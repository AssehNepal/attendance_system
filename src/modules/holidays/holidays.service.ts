import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateHolidayDto } from './dto/create-holiday.dto';
import { CreateWeeklyHolidayDto } from './dto/create-weekly-holiday.dto';
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
  ): Promise<WeeklyHoliday> {
    const weekly = this.weeklyRepo.create({ ...dto, createdById });

    return this.weeklyRepo.save(weekly);
  }

  async findWeeklyByOffice(officeId: Uuid): Promise<WeeklyHoliday[]> {
    return this.weeklyRepo.find({ where: { officeId, isActive: true } });
  }

  async removeWeekly(id: Uuid): Promise<void> {
    const weekly = await this.weeklyRepo.findOne({ where: { id } });

    if (!weekly) {
      throw new NotFoundException('Weekly holiday not found');
    }

    await this.weeklyRepo.remove(weekly);
  }

  // ── Holidays ──

  async createHoliday(
    dto: CreateHolidayDto,
    createdById: Uuid,
  ): Promise<Holiday> {
    const holiday = this.holidayRepo.create({ ...dto, createdById });

    return this.holidayRepo.save(holiday);
  }

  async findHolidaysByOffice(officeId: Uuid): Promise<Holiday[]> {
    return this.holidayRepo.find({
      where: { officeId },
      order: { holidayDate: 'ASC' },
    });
  }

  async removeHoliday(id: Uuid): Promise<void> {
    const holiday = await this.holidayRepo.findOne({ where: { id } });

    if (!holiday) {
      throw new NotFoundException('Holiday not found');
    }

    await this.holidayRepo.remove(holiday);
  }
}
