import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateHolidayDto } from './dto/create-holiday.dto';
import { CreateWeeklyHolidayDto } from './dto/create-weekly-holiday.dto';
import { HolidaysService } from './holidays.service';

@Controller('holidays')
@ApiTags('Holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  // ── Weekly Holidays ──

  @Post('weekly')
  @HttpCode(HttpStatus.CREATED)
  createWeekly(@Body() dto: CreateWeeklyHolidayDto) {
    // TODO: extract createdById from auth user
    return this.holidaysService.createWeekly(dto, '' as Uuid);
  }

  @Get('weekly/office/:officeId')
  findWeeklyByOffice(@Param('officeId') officeId: Uuid) {
    return this.holidaysService.findWeeklyByOffice(officeId);
  }

  @Delete('weekly/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeWeekly(@Param('id') id: Uuid) {
    return this.holidaysService.removeWeekly(id);
  }

  // ── Holidays ──

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createHoliday(@Body() dto: CreateHolidayDto) {
    // TODO: extract createdById from auth user
    return this.holidaysService.createHoliday(dto, '' as Uuid);
  }

  @Get('office/:officeId')
  findHolidaysByOffice(@Param('officeId') officeId: Uuid) {
    return this.holidaysService.findHolidaysByOffice(officeId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeHoliday(@Param('id') id: Uuid) {
    return this.holidaysService.removeHoliday(id);
  }
}
