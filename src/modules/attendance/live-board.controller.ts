import { Controller, Get, Logger, Query, Sse } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  catchError,
  from,
  fromEvent,
  interval,
  map,
  merge,
  Observable,
  of,
  switchMap,
  timeout,
} from 'rxjs';

import { AttendanceService } from './attendance.service';

interface MessageEvent {
  data: string | object;
}

/**
 * SSE endpoint for the TV screen live attendance board.
 * No auth required — intended for public TV display.
 */
@Controller('attendance')
@ApiTags('Live Board')
export class LiveBoardController {
  private readonly logger = new Logger(LiveBoardController.name);

  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** Regular GET endpoint to test if getDailySummary works */
  @Get('live-board/snapshot')
  @ApiOperation({ summary: 'Get a single snapshot of the live board data' })
  @ApiQuery({ name: 'officeId', required: true })
  @ApiQuery({ name: 'departmentId', required: false })
  async snapshot(
    @Query('officeId') officeId: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const todayStr = new Date().toISOString().split('T')[0]!;
    this.logger.log(
      `Snapshot requested: date=${todayStr}, officeId=${officeId}, departmentId=${departmentId}`,
    );
    const result = await this.attendanceService.getDailySummary(
      todayStr,
      officeId as Uuid,
      departmentId ? (departmentId as Uuid) : undefined,
    );
    this.logger.log(`Snapshot returned ${result.staff.length} staff`);
    return result;
  }

  @Sse('live-board')
  @ApiExcludeEndpoint()
  liveboard(
    @Query('officeId') officeId: string,
    @Query('departmentId') departmentId?: string,
  ): Observable<MessageEvent> {
    this.logger.log(
      `SSE connection: officeId=${officeId}, departmentId=${departmentId}`,
    );

    const fetchData$ = from(
      this.attendanceService.getDailySummary(
        new Date().toISOString().split('T')[0]!,
        officeId as Uuid,
        departmentId ? (departmentId as Uuid) : undefined,
      ),
    ).pipe(
      timeout(10_000),
      map((data) => ({ data }) as MessageEvent),
      catchError((err) => {
        this.logger.error('Live board fetch error', err?.message ?? err);
        return of({ data: { error: 'Failed to fetch data' } } as MessageEvent);
      }),
    );

    // Emit immediately on connection
    const initial$ = fetchData$;

    // Push data every 30 seconds
    const periodic$ = interval(30_000).pipe(switchMap(() => fetchData$));

    // Push on attendance.updated event from scheduler
    const event$ = fromEvent(this.eventEmitter, 'attendance.updated').pipe(
      switchMap(() => fetchData$),
    );

    return merge(initial$, periodic$, event$);
  }
}
