import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateHolidayDto } from './dto/create-holiday.dto';
import { CreateWeeklyHolidayDto } from './dto/create-weekly-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { UpdateWeeklyHolidayDto } from './dto/update-weekly-holiday.dto';
import { Holiday } from './entities/holiday.entity';
import { WeeklyHoliday } from './entities/weekly-holiday.entity';

@Injectable()
export class HolidaysService {
  constructor(
    @InjectRepository(Holiday)
    private readonly holidayRepo: Repository<Holiday>,
    @InjectRepository(WeeklyHoliday)
    private readonly weeklyRepo: Repository<WeeklyHoliday>,
  ) {}

  // ── Weekly Holidays ──

  async createWeekly(
    dto: CreateWeeklyHolidayDto,
    createdById: Uuid,
    officeId: Uuid,
  ): Promise<WeeklyHoliday> {
    const weekly = this.weeklyRepo.create({ ...dto, officeId, createdById });

    return this.weeklyRepo.save(weekly);
  }

  async findWeeklyByOffice(officeId: Uuid): Promise<WeeklyHoliday[]> {
    return this.weeklyRepo.find({ where: { officeId, isActive: true } });
  }

  async findWeeklyById(id: Uuid): Promise<WeeklyHoliday> {
    const weekly = await this.weeklyRepo.findOne({ where: { id } });

    if (!weekly) {
      throw new NotFoundException('Weekly holiday not found');
    }

    return weekly;
  }

  async updateWeekly(
    id: Uuid,
    dto: UpdateWeeklyHolidayDto,
  ): Promise<WeeklyHoliday> {
    const weekly = await this.findWeeklyById(id);
    Object.assign(weekly, dto);

    return this.weeklyRepo.save(weekly);
  }

  async removeWeekly(id: Uuid): Promise<object> {
    const weekly = await this.weeklyRepo.findOne({ where: { id } });

    if (!weekly) {
      throw new NotFoundException('Weekly holiday not found');
    }

    await this.weeklyRepo.remove(weekly);

    return {
      success: true,
      message: 'Resource successfully deleted.',
      meta: {
        id,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // ── Holidays ──

  async createHoliday(
    dto: CreateHolidayDto,
    createdById: Uuid,
    officeId: Uuid,
  ): Promise<Holiday> {
    const holiday = this.holidayRepo.create({ ...dto, officeId, createdById });

    return this.holidayRepo.save(holiday);
  }

  async findHolidaysByOffice(officeId: Uuid): Promise<Holiday[]> {
    return this.holidayRepo.find({
      where: { officeId },
      order: { holidayDate: 'ASC' },
    });
  }

  async findHolidayById(id: Uuid): Promise<Holiday> {
    const holiday = await this.holidayRepo.findOne({ where: { id } });

    if (!holiday) {
      throw new NotFoundException('Holiday not found');
    }

    return holiday;
  }

  async updateHoliday(id: Uuid, dto: UpdateHolidayDto): Promise<Holiday> {
    const holiday = await this.findHolidayById(id);
    Object.assign(holiday, dto);

    return this.holidayRepo.save(holiday);
  }

  async removeHoliday(id: Uuid): Promise<object> {
    const holiday = await this.holidayRepo.findOne({ where: { id } });

    if (!holiday) {
      throw new NotFoundException('Holiday not found');
    }

    await this.holidayRepo.remove(holiday);

    return {
      success: true,
      message: 'Resource successfully deleted.',
      meta: {
        id,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
