import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Admin } from './entities/admin.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import type { PageOptionsDto } from '../../common/dto/page-options.dto';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
  ) {}

  async create(dto: CreateAdminDto, createdById?: Uuid): Promise<Admin> {
    const exists = await this.adminRepo.findOne({
      where: { email: dto.email },
    });

    if (exists) {
      throw new ConflictException('Admin with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const admin = this.adminRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role ?? 'admin',
      officeId: dto.officeId,
      isActive: dto.isActive ?? true,
      createdById,
    });

    return this.adminRepo.save(admin);
  }

  async findAll(pageOptionsDto: PageOptionsDto): Promise<{
    data: Admin[];
    total: number;
  }> {
    const qb = this.adminRepo.createQueryBuilder('admin');

    if (pageOptionsDto.q) {
      qb.where('admin.name ILIKE :q OR admin.email ILIKE :q', {
        q: `%${pageOptionsDto.q}%`,
      });
    }

    qb.orderBy('admin.createdAt', pageOptionsDto.order);

    if (pageOptionsDto.skip !== undefined) {
      qb.skip(pageOptionsDto.skip);
    }

    if (pageOptionsDto.take) {
      qb.take(pageOptionsDto.take);
    }

    const [data, total] = await qb.getManyAndCount();

    return { data, total };
  }

  async findOne(id: Uuid): Promise<Admin> {
    const admin = await this.adminRepo.findOne({
      where: { id },
      relations: ['office'],
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  async update(id: Uuid, dto: UpdateAdminDto): Promise<Admin> {
    const admin = await this.findOne(id);

    if (dto.email && dto.email !== admin.email) {
      const exists = await this.adminRepo.findOne({
        where: { email: dto.email },
      });

      if (exists) {
        throw new ConflictException('Email already in use');
      }
    }

    if (dto.name !== undefined) admin.name = dto.name;
    if (dto.email !== undefined) admin.email = dto.email;
    if (dto.role !== undefined) admin.role = dto.role;
    if (dto.officeId !== undefined) admin.officeId = dto.officeId;
    if (dto.isActive !== undefined) admin.isActive = dto.isActive;

    if (dto.password) {
      admin.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.adminRepo.save(admin);
  }

  async remove(id: Uuid): Promise<void> {
    const admin = await this.findOne(id);
    await this.adminRepo.remove(admin);
  }
}
