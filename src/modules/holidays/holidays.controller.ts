import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

import { AuthUser } from '../../decorators/auth-user.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { CreateWeeklyHolidayDto } from './dto/create-weekly-holiday.dto';
import { HolidaysService } from './holidays.service';

@Controller('holidays')
@ApiTags('Holidays')
@UseGuards(AuthGuard())
@ApiBearerAuth()
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  // ── Weekly Holidays ──

  @Post('weekly')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        dayOfWeek: {
          type: 'integer',
          minimum: 1,
          maximum: 7,
          example: 6,
          description: '1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun',
        },
        isActive: { type: 'boolean', example: true },
      },
      required: ['dayOfWeek'],
    },
  })
  createWeekly(@Body() dto: CreateWeeklyHolidayDto, @AuthUser() user: any) {
    return this.holidaysService.createWeekly(dto, user.id, user.officeId);
  }

  @Get('weekly')
  findWeeklyByOffice(@AuthUser() user: any) {
    return this.holidaysService.findWeeklyByOffice(user.officeId);
  }

  @Delete('weekly/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeWeekly(@Param('id') id: Uuid) {
    return this.holidaysService.removeWeekly(id);
  }

  // ── Holidays ──

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        holidayDate: { type: 'string', example: '2026-12-17' },
        name: { type: 'string', example: 'National Day' },
        type: {
          type: 'string',
          enum: ['public', 'restricted'],
          example: 'public',
        },
      },
      required: ['holidayDate', 'name'],
    },
  })
  createHoliday(@Body() dto: CreateHolidayDto, @AuthUser() user: any) {
    return this.holidaysService.createHoliday(dto, user.id, user.officeId);
  }

  @Get()
  findHolidaysByOffice(@AuthUser() user: any) {
    return this.holidaysService.findHolidaysByOffice(user.officeId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeHoliday(@Param('id') id: Uuid) {
    return this.holidaysService.removeHoliday(id);
  }
}
