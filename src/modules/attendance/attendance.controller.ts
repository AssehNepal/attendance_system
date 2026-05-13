import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceLogDto } from './dto/create-attendance-log.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { CreateOutingRequestDto } from './dto/create-outing-request.dto';
import { UpdateAttendanceLogDto } from './dto/update-attendance-log.dto';

@Controller('attendance')
@ApiTags('Attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ── Attendance Logs ──

  @Post('logs')
  @HttpCode(HttpStatus.CREATED)
  createLog(@Body() dto: CreateAttendanceLogDto) {
    return this.attendanceService.createLog(dto);
  }

  @Get('logs')
  findAllLogs(@Query() pageOptionsDto: PageOptionsDto) {
    return this.attendanceService.findAllLogs(pageOptionsDto);
  }

  @Get('logs/staff/:staffId')
  findLogsByStaff(@Param('staffId') staffId: Uuid) {
    return this.attendanceService.findLogsByStaff(staffId);
  }

  @Get('logs/:id')
  findOneLog(@Param('id') id: Uuid) {
    return this.attendanceService.findOneLog(id);
  }

  @Put('logs/:id')
  updateLog(@Param('id') id: Uuid, @Body() dto: UpdateAttendanceLogDto) {
    return this.attendanceService.updateLog(id, dto);
  }

  @Delete('logs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeLog(@Param('id') id: Uuid) {
    return this.attendanceService.removeLog(id);
  }

  // ── Scan Logs ──

  @Get('scans/:staffId/:logDate')
  findScans(
    @Param('staffId') staffId: Uuid,
    @Param('logDate') logDate: string,
  ) {
    return this.attendanceService.findScansByStaffAndDate(staffId, logDate);
  }

  // ── On Duty Remarks ──

  @Get('duty-remarks/:staffId/:logDate')
  findDutyRemarks(
    @Param('staffId') staffId: Uuid,
    @Param('logDate') logDate: string,
  ) {
    return this.attendanceService.findDutyRemarksByStaff(staffId, logDate);
  }

  // ── Outing Requests ──

  @Post('outings')
  @HttpCode(HttpStatus.CREATED)
  createOuting(@Body() dto: CreateOutingRequestDto) {
    return this.attendanceService.createOuting(dto);
  }

  @Get('outings/staff/:staffId')
  findOutingsByStaff(@Param('staffId') staffId: Uuid) {
    return this.attendanceService.findOutingsByStaff(staffId);
  }

  @Patch('outings/:id/cancel')
  cancelOuting(@Param('id') id: Uuid) {
    return this.attendanceService.cancelOuting(id);
  }

  // ── Leave Requests ──

  @Post('leaves')
  @HttpCode(HttpStatus.CREATED)
  createLeave(@Body() dto: CreateLeaveRequestDto) {
    return this.attendanceService.createLeave(dto);
  }

  @Get('leaves/staff/:staffId')
  findLeavesByStaff(@Param('staffId') staffId: Uuid) {
    return this.attendanceService.findLeavesByStaff(staffId);
  }

  @Patch('leaves/:id/cancel')
  cancelLeave(@Param('id') id: Uuid) {
    return this.attendanceService.cancelLeave(id);
  }
}
