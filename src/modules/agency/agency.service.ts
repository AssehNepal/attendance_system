import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageDto } from '../../common/dto/page.dto';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { QueryAgencyDto } from './dto/query-agency.dto';
import { FilterAgencyDto } from './dto/filter-agency.dto';
import { Agency } from './entities/agency.entity';

@Injectable()
export class AgencyService {
  constructor(
    @InjectRepository(Agency)
    private readonly agencyRepository: Repository<Agency>,
  ) {}

  async create(createAgencyDto: CreateAgencyDto): Promise<Agency> {
    // 1. Validate name length (400 Bad Request)
    if (createAgencyDto.name.length < 3 || createAgencyDto.name.length > 255) {
      throw new BadRequestException(
        'Name must be between 3 and 255 characters',
      );
    }

    // 2. Validate code length (400 Bad Request)
    if (createAgencyDto.code.length < 2 || createAgencyDto.code.length > 50) {
      throw new BadRequestException('Code must be between 2 and 50 characters');
    }

    // 3. Validate code format (400 Bad Request)
    if (!/^[A-Z0-9_]+$/.test(createAgencyDto.code)) {
      throw new BadRequestException(
        'Code must contain only uppercase letters, numbers, and underscores',
      );
    }

    // 4. Check if agency with code already exists (409 Conflict)
    const existingCode = await this.agencyRepository.findOne({
      where: { code: createAgencyDto.code },
    });

    if (existingCode) {
      throw new ConflictException(
        `Agency with code "${createAgencyDto.code}" already exists`,
      );
    }

    // 5. Check if agency with name already exists (409 Conflict)
    const existingName = await this.agencyRepository.findOne({
      where: { name: createAgencyDto.name },
    });

    if (existingName) {
      throw new ConflictException(
        `Agency with name "${createAgencyDto.name}" already exists`,
      );
    }

    const agency = this.agencyRepository.create(createAgencyDto);
    return this.agencyRepository.save(agency);
  }

  async findAll(queryDto: QueryAgencyDto): Promise<PageDto<Agency>> {
    const queryBuilder = this.agencyRepository.createQueryBuilder('agency');

    if (queryDto.name) {
      queryBuilder.andWhere('agency.name ILIKE :name', {
        name: `%${queryDto.name}%`,
      });
    }

    if (queryDto.code) {
      queryBuilder.andWhere('agency.code ILIKE :code', {
        code: `%${queryDto.code}%`,
      });
    }

    queryBuilder.skip(queryDto.skip).take(queryDto.take);

    if (queryDto.order) {
      queryBuilder.orderBy(
        'agency.createdAt',
        queryDto.order as 'ASC' | 'DESC',
      );
    }

    const [entities, itemCount] = await queryBuilder.getManyAndCount();

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: queryDto,
    });

    return new PageDto(entities, pageMetaDto);
  }

  async findOne(id: Uuid): Promise<Agency> {
    const agency = await this.agencyRepository.findOne({
      where: { id },
      relations: ['admins'],
    });

    if (!agency) {
      throw new NotFoundException(`Agency with ID "${id}" not found`);
    }

    return agency;
  }

  async filter(filterDto: FilterAgencyDto): Promise<Agency[]> {
    const queryBuilder = this.agencyRepository.createQueryBuilder('agency');

    if (filterDto.name) {
      queryBuilder.andWhere('agency.name ILIKE :name', {
        name: `%${filterDto.name}%`,
      });
    }

    if (filterDto.code) {
      queryBuilder.andWhere('agency.code ILIKE :code', {
        code: `%${filterDto.code}%`,
      });
    }

    return queryBuilder.getMany();
  }

  async update(id: Uuid, updateAgencyDto: UpdateAgencyDto): Promise<Agency> {
    const agency = await this.findOne(id);

    // If updating code, check for conflicts
    if (updateAgencyDto.code && updateAgencyDto.code !== agency.code) {
      const existing = await this.agencyRepository.findOne({
        where: { code: updateAgencyDto.code },
      });

      if (existing) {
        throw new ConflictException(
          `Agency with code "${updateAgencyDto.code}" already exists`,
        );
      }
    }

    Object.assign(agency, updateAgencyDto);

    return this.agencyRepository.save(agency);
  }

  async remove(id: Uuid): Promise<{ statusCode: number; message: string }> {
    const agency = await this.findOne(id);
    await this.agencyRepository.remove(agency);
    return { statusCode: 200, message: 'Agency deleted successfully' };
  }

  async findByCode(code: string): Promise<Agency | null> {
    return this.agencyRepository.findOne({
      where: { code },
      relations: ['admins'],
    });
  }
}
