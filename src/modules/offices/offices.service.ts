import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { PageOptionsDto } from '../../common/dto/page-options.dto';
import { Office } from './entities/office.entity';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';

@Injectable()
export class OfficesService {
  constructor(
    @InjectRepository(Office)
    private readonly officeRepo: Repository<Office>,
  ) {}

  async create(dto: CreateOfficeDto, createdById: Uuid): Promise<Office> {
    const exists = await this.officeRepo.findOne({
      where: [{ name: dto.name }, { dzongkhagCode: dto.dzongkhagCode }],
    });

    if (exists) {
      throw new ConflictException(
        'Office with this name or dzongkhag code already exists',
      );
    }

    const office = this.officeRepo.create({
      ...dto,
      createdById,
    });

    return this.officeRepo.save(office);
  }

  async findAll(pageOptionsDto: PageOptionsDto) {
    const qb = this.officeRepo.createQueryBuilder('office');

    if (pageOptionsDto.q) {
      qb.where('office.name ILIKE :q OR office.dzongkhagCode ILIKE :q', {
        q: `%${pageOptionsDto.q}%`,
      });
    }

    qb.orderBy('office.createdAt', pageOptionsDto.order);

    if (pageOptionsDto.skip !== undefined) qb.skip(pageOptionsDto.skip);
    if (pageOptionsDto.take) qb.take(pageOptionsDto.take);

    const [data, total] = await qb.getManyAndCount();

    return { data, total };
  }

  async findOne(id: Uuid): Promise<Office> {
    const office = await this.officeRepo.findOne({ where: { id } });

    if (!office) {
      throw new NotFoundException('Office not found');
    }

    return office;
  }

  async update(id: Uuid, dto: UpdateOfficeDto): Promise<Office> {
    const office = await this.findOne(id);
    Object.assign(office, dto);

    return this.officeRepo.save(office);
  }

  async remove(id: Uuid): Promise<void> {
    const office = await this.findOne(id);
    await this.officeRepo.remove(office);
  }
}
