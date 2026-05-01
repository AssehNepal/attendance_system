import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { DataSource, Repository } from 'typeorm';

import { PageDto } from '../../common/dto/page.dto';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import { OFFICE_LOCATION_EVENTS } from '../../constants/nats-patterns';
import { CreateOfficeLocationDto } from './dto/create-office-location.dto';
import { QueryOfficeLocationDto } from './dto/query-office-location.dto';
import { UpdateOfficeLocationDto } from './dto/update-office-location.dto';
// import { FilterOfficeLocationDto } from './dto/filter-office-location.dto';
import { OfficeLocation } from './entities/office-location.entity';
import {
  OfficeLocationCreatedEvent,
  OfficeLocationDeletedEvent,
  OfficeLocationUpdatedEvent,
} from './events';

@Injectable()
export class OfficeLocationService {
  constructor(
    @InjectRepository(OfficeLocation)
    private readonly officeLocationRepository: Repository<OfficeLocation>,
    @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createOfficeLocationDto: CreateOfficeLocationDto,
  ): Promise<OfficeLocation> {
    // 1. Validate name length (400 Bad Request)
    if (
      createOfficeLocationDto.name.length < 3 ||
      createOfficeLocationDto.name.length > 255
    ) {
      throw new BadRequestException(
        'Name must be between 3 and 255 characters',
      );
    }

    // 2. Check if office location with name already exists (409 Conflict)
    const existing = await this.officeLocationRepository.findOne({
      where: { name: createOfficeLocationDto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Office location with name "${createOfficeLocationDto.name}" already exists`,
      );
    }

    // 3. Start transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 4. Save to auth_service database (within transaction)
      const officeLocation = queryRunner.manager.create(
        OfficeLocation,
        createOfficeLocationDto,
      );
      const saved = await queryRunner.manager.save(officeLocation);

      // 5. Prepare NATS event
      const event = new OfficeLocationCreatedEvent({
        id: saved.id,
        name: saved.name,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      });

      // 6. Send to common_service and WAIT for response (with 10s timeout)
      const response = await firstValueFrom(
        this.natsClient.send(OFFICE_LOCATION_EVENTS.CREATED, event).pipe(
          timeout(10_000), // 10 second timeout
          catchError((error) => {
            throw new InternalServerErrorException(
              `Failed to sync with common_service: ${error.message}`,
            );
          }),
        ),
      );

      // 7. Check if common_service succeeded
      if (!response || response.success !== true) {
        throw new InternalServerErrorException(
          'Common service failed to create office location',
        );
      }

      // 8. SUCCESS: Commit transaction
      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      // 9. FAILURE: Rollback transaction (undo the INSERT)
      await queryRunner.rollbackTransaction();

      // Re-throw the error to return proper HTTP response
      throw error;
    } finally {
      // 10. Release the query runner
      await queryRunner.release();
    }
  }

  async findAll(
    queryDto: QueryOfficeLocationDto,
  ): Promise<PageDto<OfficeLocation>> {
    const queryBuilder =
      this.officeLocationRepository.createQueryBuilder('officeLocation');

    // Search by q parameter
    if (queryDto.q) {
      queryBuilder.andWhere('officeLocation.name ILIKE :name', {
        name: `${queryDto.q}%`, // Prefix matching
      });
    }

    // Apply smart defaults for pagination
    const page = queryDto.page ?? 1;
    const take = queryDto.take ?? 10;

    // Apply pagination
    queryBuilder.skip((page - 1) * take).take(take);

    if (queryDto.order) {
      queryBuilder.orderBy(
        'officeLocation.createdAt',
        queryDto.order as 'ASC' | 'DESC',
      );
    }

    const [entities, itemCount] = await queryBuilder.getManyAndCount();

    // Create a modified query DTO with the actual values used
    const actualQueryDto = {
      ...queryDto,
      page,
      take,
    };

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: actualQueryDto as any,
    });

    return new PageDto(entities, pageMetaDto);
  }

  async findAllWithoutPagination(): Promise<OfficeLocation[]> {
    return this.officeLocationRepository.find({
      order: {
        name: 'ASC',
      },
    });
  }

  async findOne(id: Uuid): Promise<OfficeLocation> {
    const officeLocation = await this.officeLocationRepository.findOne({
      where: { id },
      relations: ['admins'],
    });

    if (!officeLocation) {
      throw new NotFoundException(`Office location with ID "${id}" not found`);
    }

    return officeLocation;
  }

  //   async filter(filterDto: FilterOfficeLocationDto): Promise<OfficeLocation[]> {
  //     const queryBuilder =
  //       this.officeLocationRepository.createQueryBuilder('officeLocation');

  //     if (filterDto.name) {
  //       queryBuilder.andWhere('officeLocation.name ILIKE :name', {
  //         name: `%${filterDto.name}%`,
  //       });
  //     }

  //     return queryBuilder.getMany();
  //   }

  async update(
    id: Uuid,
    updateOfficeLocationDto: UpdateOfficeLocationDto,
  ): Promise<OfficeLocation> {
    // Start transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find existing
      const officeLocation = await this.findOne(id);

      // Update in transaction
      Object.assign(officeLocation, updateOfficeLocationDto);
      const updated = await queryRunner.manager.save(officeLocation);

      // Prepare NATS event
      const event = new OfficeLocationUpdatedEvent({
        id: updated.id,
        name: updated.name,
        updatedAt: updated.updatedAt,
      });

      // Send to common_service and WAIT for response (with 10s timeout)
      const response = await firstValueFrom(
        this.natsClient.send(OFFICE_LOCATION_EVENTS.UPDATED, event).pipe(
          timeout(10_000), // 10 second timeout
          catchError((error) => {
            throw new InternalServerErrorException(
              `Failed to sync update with common_service: ${error.message}`,
            );
          }),
        ),
      );

      // Check if common_service succeeded
      if (!response || response.success !== true) {
        throw new InternalServerErrorException(
          'Common service failed to update office location',
        );
      }

      // SUCCESS: Commit transaction
      await queryRunner.commitTransaction();
      return updated;
    } catch (error) {
      // FAILURE: Rollback transaction
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: Uuid): Promise<{ statusCode: number; message: string }> {
    // Start transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the office location
      const officeLocation = await this.findOne(id);

      // Remove in transaction
      await queryRunner.manager.remove(officeLocation);

      // Prepare NATS deletion event
      const event = new OfficeLocationDeletedEvent({
        id,
        deletedAt: new Date(),
      });

      // Send to common_service and WAIT for response (with 10s timeout)
      const response = await firstValueFrom(
        this.natsClient.send(OFFICE_LOCATION_EVENTS.DELETED, event).pipe(
          timeout(10_000), // 10 second timeout
          catchError((error) => {
            throw new InternalServerErrorException(
              `Failed to sync deletion with common_service: ${error.message}`,
            );
          }),
        ),
      );

      // Check if common_service succeeded
      if (!response || response.success !== true) {
        throw new InternalServerErrorException(
          'Common service failed to delete office location',
        );
      }

      // SUCCESS: Commit transaction
      await queryRunner.commitTransaction();

      return {
        statusCode: 200,
        message: 'Office location deleted successfully',
      };
    } catch (error) {
      // FAILURE: Rollback deletion
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ============================================
  // REVERSE SYNC HANDLERS (from common_service)
  // ============================================

  async handleSyncFromCommonService(
    event: OfficeLocationCreatedEvent,
  ): Promise<void> {
    try {
      // Check if already exists (idempotency)
      const existing = await this.officeLocationRepository.findOne({
        where: { id: event.id as Uuid },
      });

      if (existing) {
        console.log(
          `Office location ${event.id} already exists in auth_service, skipping`,
        );
        return;
      }

      // Create without publishing back to common_service (avoid infinite loop)
      const officeLocation = this.officeLocationRepository.create({
        id: event.id as Uuid,
        name: event.name,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      });

      await this.officeLocationRepository.save(officeLocation);
      console.log(
        `Office location ${event.id} synced to auth_service successfully`,
      );
    } catch (error) {
      console.error(
        `Error syncing office location ${event.id} to auth_service:`,
        error,
      );
      throw error;
    }
  }

  async handleSyncUpdateFromCommonService(
    event: OfficeLocationUpdatedEvent,
  ): Promise<void> {
    try {
      const officeLocation = await this.officeLocationRepository.findOne({
        where: { id: event.id as Uuid },
      });

      if (!officeLocation) {
        console.warn(
          `Office location ${event.id} not found in auth_service, cannot update`,
        );
        return;
      }

      if (event.name) {
        officeLocation.name = event.name;
      }
      officeLocation.updatedAt = event.updatedAt;

      await this.officeLocationRepository.save(officeLocation);
      console.log(
        `Office location ${event.id} update synced to auth_service successfully`,
      );
    } catch (error) {
      console.error(
        `Error syncing office location update ${event.id} to auth_service:`,
        error,
      );
      throw error;
    }
  }

  async handleSyncDeleteFromCommonService(
    event: OfficeLocationDeletedEvent,
  ): Promise<void> {
    try {
      const result = await this.officeLocationRepository.delete(event.id);

      if (result.affected === 0) {
        console.warn(
          `Office location ${event.id} not found in auth_service, already deleted`,
        );
      } else {
        console.log(
          `Office location ${event.id} deletion synced to auth_service successfully`,
        );
      }
    } catch (error) {
      console.error(
        `Error syncing office location deletion ${event.id} to auth_service:`,
        error,
      );
      throw error;
    }
  }
}
