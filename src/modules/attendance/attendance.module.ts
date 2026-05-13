import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceLog } from './entities/attendance-log.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { OnDutyRemark } from './entities/on-duty-remark.entity';
import { OutingRequest } from './entities/outing-request.entity';
import { ScanLog } from './entities/scan-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttendanceLog,
      ScanLog,
      OnDutyRemark,
      OutingRequest,
      LeaveRequest,
    ]),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
