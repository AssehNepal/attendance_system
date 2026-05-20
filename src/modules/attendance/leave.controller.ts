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
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';

@Controller('leaves')
@ApiTags('Leaves')
@UseGuards(AuthGuard())
@ApiBearerAuth()
export class LeaveController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createLeave(@Body() dto: CreateLeaveRequestDto, @AuthUser() user: any) {
    return this.attendanceService.createLeave({ ...dto, staffId: user.id });
  }

  @Get('my')
  findMyLeaves(@AuthUser() user: any) {
    return this.attendanceService.findLeavesByStaff(user.id);
  }

  @Get('staff/:staffId')
  @ApiParam({ name: 'staffId', type: 'string', format: 'uuid' })
  findLeavesByStaff(@Param('staffId', ParseUUIDPipe) staffId: Uuid) {
    return this.attendanceService.findLeavesByStaff(staffId);
  }

  @Patch(':id/cancel')
  cancelLeave(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.attendanceService.cancelLeave(id);
  }
}
