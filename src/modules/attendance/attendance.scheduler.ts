import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AttendanceService } from './attendance.service';

@Injectable()
export class AttendanceScheduler {
  private readonly logger = new Logger(AttendanceScheduler.name);

  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Runs every minute to process outing departures and returns.
   * Updates attendance_logs based on out_from and resume_time.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleOutingTransitions(): Promise<void> {
    const departures = await this.attendanceService.processOutingDepartures();
    const returns = await this.attendanceService.processOutingReturns();

    if (departures > 0 || returns > 0) {
      this.logger.log(
        `Outing transitions: ${departures} departures, ${returns} returns`,
      );
      // Emit event so SSE listeners can push fresh data to clients
      this.eventEmitter.emit('attendance.updated');
    }
  }
}
