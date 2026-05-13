import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { PageOptionsDto } from '../../common/dto/page-options.dto';
import { CreateAdminOverrideDto } from './dto/create-admin-override.dto';
import { AdminOverride } from './entities/admin-override.entity';

@Injectable()
export class AdminOverridesService {
  constructor(
    @InjectRepository(AdminOverride)
    private readonly overrideRepo: Repository<AdminOverride>,
  ) {}

  async create(dto: CreateAdminOverrideDto): Promise<AdminOverride> {
    const override = this.overrideRepo.create(dto);

    return this.overrideRepo.save(override);
  }

  async findAll(pageOptionsDto: PageOptionsDto) {
    const qb = this.overrideRepo.createQueryBuilder('o');

    if (pageOptionsDto.q) {
      qb.where('o.targetTable ILIKE :q OR o.actionType ILIKE :q', {
        q: `%${pageOptionsDto.q}%`,
      });
    }

    qb.orderBy('o.overrideAt', 'DESC');

    if (pageOptionsDto.skip !== undefined) qb.skip(pageOptionsDto.skip);
    if (pageOptionsDto.take) qb.take(pageOptionsDto.take);

    const [data, total] = await qb.getManyAndCount();

    return { data, total };
  }

  async findByTarget(targetTable: string, targetId: Uuid) {
    return this.overrideRepo.find({
      where: { targetTable, targetId },
      order: { overrideAt: 'DESC' },
      relations: ['admin'],
    });
  }
}
