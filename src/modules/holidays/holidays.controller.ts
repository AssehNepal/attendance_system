import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';

import { AuthUser } from '../../decorators/auth-user.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { CreateWeeklyHolidayDto } from './dto/create-weekly-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { UpdateWeeklyHolidayDto } from './dto/update-weekly-holiday.dto';
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

  @Get('weekly/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findWeeklyById(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.holidaysService.findWeeklyById(id);
  }

  @Patch('weekly/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
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
    },
  })
  updateWeekly(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() dto: UpdateWeeklyHolidayDto,
  ) {
    return this.holidaysService.updateWeekly(id, dto);
  }

  @Delete('weekly/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  removeWeekly(@Param('id', ParseUUIDPipe) id: Uuid) {
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

  @Get(':id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findHolidayById(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.holidaysService.findHolidayById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
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
    },
  })
  updateHoliday(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() dto: UpdateHolidayDto,
  ) {
    return this.holidaysService.updateHoliday(id, dto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  removeHoliday(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.holidaysService.removeHoliday(id);
  }
}
