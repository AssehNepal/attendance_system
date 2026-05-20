import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Holiday } from '../holidays/entities/holiday.entity';
import { WeeklyHoliday } from '../holidays/entities/weekly-holiday.entity';
import { Staff } from '../staff/entities/staff.entity';
import { AttendanceController } from './attendance.controller';
import { AttendanceScheduler } from './attendance.scheduler';
import { AttendanceService } from './attendance.service';
import { AttendanceLog } from './entities/attendance-log.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { OnDutyRemark } from './entities/on-duty-remark.entity';
import { OutingRequest } from './entities/outing-request.entity';
import { ScanLog } from './entities/scan-log.entity';
import { LeaveController } from './leave.controller';
import { LiveBoardController } from './live-board.controller';
import { OutingController } from './outing.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      AttendanceLog,
      ScanLog,
      OnDutyRemark,
      OutingRequest,
      LeaveRequest,
      WeeklyHoliday,
      Holiday,
      Staff,
    ]),
  ],
  controllers: [
    AttendanceController,
    OutingController,
    LeaveController,
    LiveBoardController,
  ],
  providers: [AttendanceService, AttendanceScheduler],
  exports: [AttendanceService],
})
export class AttendanceModule {}
