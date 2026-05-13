import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import type { PageOptionsDto } from '../../common/dto/page-options.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Staff } from './entities/staff.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepo: Repository<Staff>,
  ) {}

  async create(dto: CreateStaffDto): Promise<Staff> {
    const exists = await this.staffRepo.findOne({
      where: { employeeId: dto.employeeId },
    });

    if (exists) {
      throw new ConflictException('Staff with this employee ID already exists');
    }

    const staff = this.staffRepo.create({
      ...dto,
      passwordHash: dto.password
        ? await bcrypt.hash(dto.password, 10)
        : undefined,
    });

    return this.staffRepo.save(staff);
  }

  async findAll(pageOptionsDto: PageOptionsDto) {
    const qb = this.staffRepo.createQueryBuilder('staff');

    if (pageOptionsDto.q) {
      qb.where(
        'staff.name ILIKE :q OR staff.employeeId ILIKE :q OR staff.email ILIKE :q',
        { q: `%${pageOptionsDto.q}%` },
      );
    }

    qb.orderBy('staff.createdAt', pageOptionsDto.order);

    if (pageOptionsDto.skip !== undefined) qb.skip(pageOptionsDto.skip);
    if (pageOptionsDto.take) qb.take(pageOptionsDto.take);

    const [data, total] = await qb.getManyAndCount();

    return { data, total };
  }

  async findByOffice(officeId: Uuid) {
    return this.staffRepo.find({
      where: { officeId },
      relations: ['department'],
    });
  }

  async findOne(id: Uuid): Promise<Staff> {
    const staff = await this.staffRepo.findOne({
      where: { id },
      relations: ['office', 'department'],
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return staff;
  }

  async update(id: Uuid, dto: UpdateStaffDto): Promise<Staff> {
    const staff = await this.findOne(id);

    if (dto.password) {
      (staff as any).passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const { password: _password, ...rest } = dto;
    Object.assign(staff, rest);

    return this.staffRepo.save(staff);
  }

  async remove(id: Uuid): Promise<void> {
    const staff = await this.findOne(id);
    await this.staffRepo.remove(staff);
  }
}
