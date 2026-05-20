import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { AuthUser } from '../../decorators/auth-user.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceLogDto } from './dto/create-attendance-log.dto';
import { UpdateAttendanceLogDto } from './dto/update-attendance-log.dto';

@Controller('attendance')
@ApiTags('Attendance')
@UseGuards(AuthGuard())
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ── Attendance Logs ──

  @Post('logs')
  @HttpCode(HttpStatus.CREATED)
  createLog(@AuthUser() user: any) {
    return this.attendanceService.createLog(
      { staffId: user.id } as CreateAttendanceLogDto,
      'manual',
    );
  }

  @Post('logs/biometric')
  @HttpCode(HttpStatus.CREATED)
  createBiometricLog(@Body() dto: CreateAttendanceLogDto) {
    return this.attendanceService.createLog(dto, 'system');
  }

  @Get('logs')
  findAllLogs(@Query() pageOptionsDto: PageOptionsDto) {
    return this.attendanceService.findAllLogs(pageOptionsDto);
  }

  @Get('logs/my')
  findMyLogs(@AuthUser() user: any) {
    return this.attendanceService.findLogsByStaff(user.id);
  }

  @Get('logs/staff/:staffId')
  @ApiParam({ name: 'staffId', type: 'string', format: 'uuid' })
  findLogsByStaff(@Param('staffId', ParseUUIDPipe) staffId: Uuid) {
    return this.attendanceService.findLogsByStaff(staffId);
  }

  @Get('logs/:id')
  findOneLog(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.attendanceService.findOneLog(id);
  }

  @Put('logs/:id')
  updateLog(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() dto: UpdateAttendanceLogDto,
  ) {
    return this.attendanceService.updateLog(id, dto);
  }

  @Delete('logs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeLog(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.attendanceService.removeLog(id);
  }

  // ── Scan Logs ──

  @Get('scans/my/:logDate')
  @ApiParam({ name: 'logDate', type: 'string', example: '2026-05-16' })
  findMyScans(@AuthUser() user: any, @Param('logDate') logDate: string) {
    return this.attendanceService.findScansByStaffAndDate(user.id, logDate);
  }

  @Get('scans/:staffId/:logDate')
  @ApiParam({ name: 'staffId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'logDate', type: 'string', example: '2026-05-16' })
  findScans(
    @Param('staffId', ParseUUIDPipe) staffId: Uuid,
    @Param('logDate') logDate: string,
  ) {
    return this.attendanceService.findScansByStaffAndDate(staffId, logDate);
  }

  // ── On Duty Remarks ──

  @Get('duty-remarks/my/:logDate')
  @ApiParam({ name: 'logDate', type: 'string', example: '2026-05-16' })
  findMyDutyRemarks(@AuthUser() user: any, @Param('logDate') logDate: string) {
    return this.attendanceService.findDutyRemarksByStaff(user.id, logDate);
  }

  @Get('duty-remarks/:staffId/:logDate')
  @ApiParam({ name: 'staffId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'logDate', type: 'string', example: '2026-05-16' })
  findDutyRemarks(
    @Param('staffId', ParseUUIDPipe) staffId: Uuid,
    @Param('logDate') logDate: string,
  ) {
    return this.attendanceService.findDutyRemarksByStaff(staffId, logDate);
  }

  // ── My Attendance Summary ──

  @Get('summary/:year')
  @ApiParam({ name: 'year', type: 'integer', example: 2026 })
  @ApiQuery({ name: 'month', required: false, type: 'integer', example: 5 })
  @ApiQuery({
    name: 'staffId',
    required: false,
    type: 'string',
    description: 'UUID of staff',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    type: 'string',
    description: 'UUID of department to filter staff',
  })
  getMyAttendance(
    @Param('year', ParseIntPipe) year: number,
    @Query('staffId') staffId?: string,
    @Query('month') month?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const monthNum = month ? Number.parseInt(month, 10) : undefined;
    if (staffId) {
      return this.attendanceService.getAttendanceSummary(
        staffId as Uuid,
        year,
        monthNum,
      );
    }
    return this.attendanceService.getAllStaffAttendanceSummary(
      year,
      monthNum,
      departmentId as Uuid | undefined,
    );
  }

  @Get('my-attendance/:year')
  @ApiParam({ name: 'year', type: 'integer', example: 2026 })
  @ApiQuery({ name: 'month', required: false, type: 'integer', example: 5 })
  getAttendanceSummary(
    @Param('year', ParseIntPipe) year: number,
    @Query('month') month?: string,
    @AuthUser() user?: any,
  ) {
    const monthNum = month ? Number.parseInt(month, 10) : undefined;
    return this.attendanceService.getAttendanceSummary(
      user.id as Uuid,
      year,
      monthNum,
    );
  }

  // ── Daily Attendance Summary ──

  @Get('daily-summary/:date')
  @ApiParam({ name: 'date', type: 'string', example: '2026-05-17' })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    type: 'string',
    description: 'UUID of department to filter staff',
  })
  getDailySummary(
    @Param('date') date: string,
    @Query('departmentId') departmentId?: string,
    @AuthUser() user?: any,
  ) {
    return this.attendanceService.getDailySummary(
      date,
      user.officeId as Uuid,
      departmentId as Uuid | undefined,
    );
  }
}
