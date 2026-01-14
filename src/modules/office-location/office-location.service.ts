import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageDto } from '../../common/dto/page.dto';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import { CreateOfficeLocationDto } from './dto/create-office-location.dto';
import { UpdateOfficeLocationDto } from './dto/update-office-location.dto';
import { QueryOfficeLocationDto } from './dto/query-office-location.dto';
import { FilterOfficeLocationDto } from './dto/filter-office-location.dto';
import { OfficeLocation } from './entities/office-location.entity';

@Injectable()
export class OfficeLocationService {
  constructor(
    @InjectRepository(OfficeLocation)
    private readonly officeLocationRepository: Repository<OfficeLocation>,
  ) {}

  async create(createOfficeLocationDto: CreateOfficeLocationDto): Promise<OfficeLocation> {
    const officeLocation = this.officeLocationRepository.create(createOfficeLocationDto);
    return this.officeLocationRepository.save(officeLocation);
  }

  async findAll(queryDto: QueryOfficeLocationDto): Promise<PageDto<OfficeLocation>> {
    const queryBuilder = this.officeLocationRepository.createQueryBuilder('officeLocation');

    if (queryDto.name) {
      queryBuilder.andWhere('officeLocation.name ILIKE :name', {
        name: `%${queryDto.name}%`,
      });
    }

    queryBuilder
      .orderBy('officeLocation.created_at', queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take);

    const [entities, itemCount] = await queryBuilder.getManyAndCount();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto: queryDto });

    return new PageDto(entities, pageMetaDto);
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

  async filter(filterDto: FilterOfficeLocationDto): Promise<OfficeLocation[]> {
    const queryBuilder = this.officeLocationRepository.createQueryBuilder('officeLocation');

    if (filterDto.name) {
      queryBuilder.andWhere('officeLocation.name ILIKE :name', {
        name: `%${filterDto.name}%`,
      });
    }

    return queryBuilder.getMany();
  }

  async update(
    id: Uuid,
    updateOfficeLocationDto: UpdateOfficeLocationDto,
  ): Promise<OfficeLocation> {
    const officeLocation = await this.findOne(id);

    Object.assign(officeLocation, updateOfficeLocationDto);

    return this.officeLocationRepository.save(officeLocation);
  }

  async remove(id: Uuid): Promise<void> {
    const officeLocation = await this.findOne(id);
    await this.officeLocationRepository.remove(officeLocation);
  }
}
