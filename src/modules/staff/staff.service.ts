import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import type { PageOptionsDto } from '../../common/dto/page-options.dto';
import { Department } from '../departments/entities/department.entity';
import { Office } from '../offices/entities/office.entity';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Staff } from './entities/staff.entity';

const PHOTO_DIR = path.join(process.cwd(), 'src/shared/Image');

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepo: Repository<Staff>,
    @InjectRepository(Office)
    private readonly officeRepo: Repository<Office>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
  ) {}

  async create(
    dto: CreateStaffDto,
    officeId: Uuid,
    file?: { originalname: string; buffer: Buffer },
  ): Promise<Staff> {
    const office = await this.officeRepo.findOne({
      where: { id: officeId },
    });

    if (!office) {
      throw new NotFoundException(`Office with ID "${officeId}" not found`);
    }

    const department = await this.departmentRepo.findOne({
      where: { id: dto.departmentId },
    });

    if (!department) {
      throw new NotFoundException(
        `Department with ID "${dto.departmentId}" not found`,
      );
    }

    const exists = await this.staffRepo.findOne({
      where: { employeeId: dto.employeeId },
    });

    if (exists) {
      throw new ConflictException('Staff with this employee ID already exists');
    }

    const staff = this.staffRepo.create({
      ...dto,
      officeId,
      password: dto.password ? await bcrypt.hash(dto.password, 10) : undefined,
    });

    const savedStaff = await this.staffRepo.save(staff);

    if (file && savedStaff.cidNo) {
      if (!existsSync(PHOTO_DIR)) {
        mkdirSync(PHOTO_DIR, { recursive: true });
      }

      const ext = path.extname(file.originalname) || '.jpg';
      const filename = `${savedStaff.cidNo}${ext}`;
      writeFileSync(path.join(PHOTO_DIR, filename), file.buffer);
      savedStaff.photo = filename;

      return this.staffRepo.save(savedStaff);
    }

    return savedStaff;
  }

  async findAll(pageOptionsDto: PageOptionsDto, officeId: Uuid) {
    const qb = this.staffRepo.createQueryBuilder('staff');

    qb.where('staff.officeId = :officeId', { officeId });

    if (pageOptionsDto.q) {
      qb.andWhere(
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

  async findByOffice(officeId: Uuid, departmentId: Uuid) {
    return this.staffRepo.find({
      where: { officeId, departmentId },
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
      staff.password = await bcrypt.hash(dto.password, 10);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = dto;
    Object.assign(staff, rest);

    return this.staffRepo.save(staff);
  }

  async remove(id: Uuid): Promise<void> {
    const staff = await this.findOne(id);
    await this.staffRepo.remove(staff);
  }

  async uploadPhoto(
    id: Uuid,
    file: { originalname: string; buffer: Buffer },
  ): Promise<Staff> {
    const staff = await this.findOne(id);

    if (!staff.cidNo) {
      throw new BadRequestException(
        'Staff must have a CID number before uploading a photo',
      );
    }

    if (!existsSync(PHOTO_DIR)) {
      mkdirSync(PHOTO_DIR, { recursive: true });
    }

    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${staff.cidNo}${ext}`;
    const filePath = path.join(PHOTO_DIR, filename);

    writeFileSync(filePath, file.buffer);

    staff.photo = filename;

    return this.staffRepo.save(staff);
  }
}
