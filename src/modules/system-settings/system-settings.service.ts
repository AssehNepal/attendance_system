import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

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

const IMAGE_DIR = path.join(process.cwd(), 'src/shared/sys_setting_img');

@Injectable()
export class SystemSettingsService {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingRepo: Repository<SystemSetting>,
  ) {
    if (!existsSync(IMAGE_DIR)) {
      mkdirSync(IMAGE_DIR, { recursive: true });
    }
  }

  async create(
    dto: CreateSystemSettingDto,
    updatedById?: Uuid,
    file?: { originalname: string; buffer: Buffer },
  ): Promise<SystemSetting> {
    const exists = await this.settingRepo.findOne({ where: { key: dto.key } });

    if (exists) {
      throw new ConflictException('Setting key already exists');
    }

    let imageUrl: string | undefined;

    if (file) {
      const ext = path.extname(file.originalname) || '.jpg';
      const filename = `${dto.key.replace(/\s+/g, '_')}_${Date.now()}${ext}`;
      writeFileSync(path.join(IMAGE_DIR, filename), file.buffer);
      imageUrl = `sys_setting_img/${filename}`;
    }

    const setting = this.settingRepo.create({ ...dto, updatedById, imageUrl });

    return this.settingRepo.save(setting);
  }

  async findAll(): Promise<SystemSetting[]> {
    return this.settingRepo.find({ order: { key: 'ASC' } });
  }

  async findById(id: Uuid): Promise<SystemSetting> {
    const setting = await this.settingRepo.findOne({ where: { id } });

    if (!setting) {
      throw new NotFoundException(`Setting not found`);
    }

    return setting;
  }

  async findByKey(key: string): Promise<SystemSetting> {
    const setting = await this.settingRepo.findOne({ where: { key } });

    if (!setting) {
      throw new NotFoundException(`Setting "${key}" not found`);
    }

    return setting;
  }

  async updateById(
    id: Uuid,
    dto: UpdateSystemSettingDto,
    updatedById?: Uuid,
    file?: { originalname: string; buffer: Buffer },
  ): Promise<SystemSetting> {
    const setting = await this.findById(id);

    if (file) {
      // Delete old image if exists
      if (setting.imageUrl) {
        const oldPath = path.join(
          process.cwd(),
          'src/shared',
          setting.imageUrl,
        );
        if (existsSync(oldPath)) unlinkSync(oldPath);
      }

      const ext = path.extname(file.originalname) || '.jpg';
      const filename = `${setting.key.replace(/\s+/g, '_')}_${Date.now()}${ext}`;
      writeFileSync(path.join(IMAGE_DIR, filename), file.buffer);
      setting.imageUrl = `sys_setting_img/${filename}`;
    }

    Object.assign(setting, dto, { updatedById });

    return this.settingRepo.save(setting);
  }

  async removeById(id: Uuid): Promise<object> {
    const setting = await this.findById(id);

    // Delete image file if exists
    if (setting.imageUrl) {
      const imgPath = path.join(process.cwd(), 'src/shared', setting.imageUrl);
      if (existsSync(imgPath)) unlinkSync(imgPath);
    }

    await this.settingRepo.remove(setting);

    return {
      success: true,
      message: 'Resource successfully deleted.',
      meta: {
        id,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // ── Legacy key-based methods (kept for compatibility) ──

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
