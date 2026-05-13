import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { PageOptionsDto } from '../../common/dto/page-options.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
  ) {}

  async create(dto: CreateDepartmentDto): Promise<Department> {
    const existing = await this.deptRepo.findOne({
      where: { officeId: dto.officeId, name: dto.name },
    });

    if (existing) {
      throw new ConflictException(
        `A department with name '${dto.name}' already exists in this office`,
      );
    }

    const dept = this.deptRepo.create(dto);

    return this.deptRepo.save(dept);
  }

  async findAll(pageOptionsDto: PageOptionsDto) {
    const qb = this.deptRepo.createQueryBuilder('dept');

    if (pageOptionsDto.q) {
      qb.where('dept.name ILIKE :q OR dept.code ILIKE :q', {
        q: `%${pageOptionsDto.q}%`,
      });
    }

    qb.orderBy('dept.createdAt', pageOptionsDto.order);

    if (pageOptionsDto.skip !== undefined) qb.skip(pageOptionsDto.skip);
    if (pageOptionsDto.take) qb.take(pageOptionsDto.take);

    const [data, total] = await qb.getManyAndCount();

    return { data, total };
  }

  async findByOffice(officeId: Uuid): Promise<Department[]> {
    return this.deptRepo.find({ where: { officeId } });
  }

  async findOne(id: Uuid): Promise<Department> {
    const dept = await this.deptRepo.findOne({
      where: { id },
      relations: ['office'],
    });

    if (!dept) {
      throw new NotFoundException('Department not found');
    }

    return dept;
  }

  async update(id: Uuid, dto: UpdateDepartmentDto): Promise<Department> {
    const dept = await this.findOne(id);
    Object.assign(dept, dto);

    return this.deptRepo.save(dept);
  }

  async remove(id: Uuid): Promise<void> {
    const dept = await this.findOne(id);
    await this.deptRepo.remove(dept);
  }
}
