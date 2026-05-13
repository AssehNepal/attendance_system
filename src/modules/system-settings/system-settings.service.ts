import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateSystemSettingDto } from './dto/create-system-setting.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { SystemSetting } from './entities/system-setting.entity';

@Injectable()
export class SystemSettingsService {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingRepo: Repository<SystemSetting>,
  ) {}

  async create(
    dto: CreateSystemSettingDto,
    updatedById?: Uuid,
  ): Promise<SystemSetting> {
    const exists = await this.settingRepo.findOne({
      where: { key: dto.key },
    });

    if (exists) {
      throw new ConflictException('Setting key already exists');
    }

    const setting = this.settingRepo.create({ ...dto, updatedById });

    return this.settingRepo.save(setting);
  }

  async findAll(): Promise<SystemSetting[]> {
    return this.settingRepo.find({ order: { key: 'ASC' } });
  }

  async findByKey(key: string): Promise<SystemSetting> {
    const setting = await this.settingRepo.findOne({ where: { key } });

    if (!setting) {
      throw new NotFoundException(`Setting "${key}" not found`);
    }

    return setting;
  }

  async update(
    key: string,
    dto: UpdateSystemSettingDto,
    updatedById?: Uuid,
  ): Promise<SystemSetting> {
    const setting = await this.findByKey(key);
    Object.assign(setting, dto, { updatedById });

    return this.settingRepo.save(setting);
  }

  async remove(key: string): Promise<void> {
    const setting = await this.findByKey(key);
    await this.settingRepo.remove(setting);
  }
}
