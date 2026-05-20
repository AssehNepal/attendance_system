import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';

import { AuthUser } from '../../decorators/auth-user.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { AttendanceService } from './attendance.service';
import { CreateOutingRequestDto } from './dto/create-outing-request.dto';

@Controller('outings')
@ApiTags('Outings')
@UseGuards(AuthGuard())
@ApiBearerAuth()
export class OutingController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createOuting(@Body() dto: CreateOutingRequestDto, @AuthUser() user: any) {
    return this.attendanceService.createOuting({ ...dto, staffId: user.id });
  }

  @Get('my')
  findMyOutings(@AuthUser() user: any) {
    return this.attendanceService.findOutingsByStaff(user.id);
  }

  @Get('staff/:staffId')
  @ApiParam({ name: 'staffId', type: 'string', format: 'uuid' })
  findOutingsByStaff(@Param('staffId', ParseUUIDPipe) staffId: Uuid) {
    return this.attendanceService.findOutingsByStaff(staffId);
  }

  @Patch(':id/cancel')
  cancelOuting(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.attendanceService.cancelOuting(id);
  }
}
