import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import type { PageOptionsDto } from '../../common/dto/page-options.dto';
import { Holiday } from '../holidays/entities/holiday.entity';
import { WeeklyHoliday } from '../holidays/entities/weekly-holiday.entity';
import { Staff } from '../staff/entities/staff.entity';
import { CreateAttendanceLogDto } from './dto/create-attendance-log.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { CreateOutingRequestDto } from './dto/create-outing-request.dto';
import { UpdateAttendanceLogDto } from './dto/update-attendance-log.dto';
import { AttendanceLog } from './entities/attendance-log.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { OnDutyRemark } from './entities/on-duty-remark.entity';
import { OutingRequest } from './entities/outing-request.entity';
import { ScanLog } from './entities/scan-log.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceLog)
    private readonly attendanceRepo: Repository<AttendanceLog>,
    @InjectRepository(ScanLog)
    private readonly scanLogRepo: Repository<ScanLog>,
    @InjectRepository(OnDutyRemark)
    private readonly onDutyRepo: Repository<OnDutyRemark>,
    @InjectRepository(OutingRequest)
    private readonly outingRepo: Repository<OutingRequest>,
    @InjectRepository(LeaveRequest)
    private readonly leaveRepo: Repository<LeaveRequest>,
    @InjectRepository(WeeklyHoliday)
    private readonly weeklyHolidayRepo: Repository<WeeklyHoliday>,
    @InjectRepository(Holiday)
    private readonly holidayRepo2: Repository<Holiday>,
    @InjectRepository(Staff)
    private readonly staffRepo: Repository<Staff>,
  ) {}

  // ── Attendance Logs ──

  /**
   * Convert JS Date.getDay() (0=Sunday) to our 1-7 format (7=Sunday)
   */
  private getDayOfWeek(date: Date): number {
    const jsDay = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    return jsDay === 0 ? 7 : jsDay; // 1=Mon, ..., 6=Sat, 7=Sun
  }

  /** Convert "HH:mm" to 12-hour format like "1:50 PM" */
  private to12Hour(time: string): string {
    const [hStr, mStr] = time.split(':');
    let h = Number(hStr);
    const suffix = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${mStr} ${suffix}`;
  }

  private async isWeeklyHoliday(officeId: Uuid, date: Date): Promise<boolean> {
    const dayOfWeek = this.getDayOfWeek(date);
    const holiday = await this.weeklyHolidayRepo.findOne({
      where: { officeId, dayOfWeek, isActive: true },
    });
    return !!holiday;
  }

  private async isHoliday(officeId: Uuid, date: Date): Promise<boolean> {
    const dateStr = date.toISOString().split('T')[0]!;
    const holiday = await this.holidayRepo2.findOne({
      where: { officeId, holidayDate: dateStr },
    });
    return !!holiday;
  }

  private async isNonWorkingDay(officeId: Uuid, date: Date): Promise<boolean> {
    return (
      (await this.isWeeklyHoliday(officeId, date)) ||
      (await this.isHoliday(officeId, date))
    );
  }

  async createLog(
    dto: CreateAttendanceLogDto,
    source: string = 'manual',
  ): Promise<AttendanceLog> {
    // Get staff to find their officeId
    const staff = await this.staffRepo.findOne({
      where: { id: dto.staffId },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    const now = new Date();

    // Check if today is a weekly holiday or public holiday for this staff's office
    if (await this.isNonWorkingDay(staff.officeId, now)) {
      throw new BadRequestException('Cannot check in on a holiday');
    }

    const logDate = now.toISOString().split('T')[0]!;
    const currentTime = now.toTimeString().split(' ')[0]!;

    // Find the latest open log (has checkin but no checkout) for this staff today
    const openLog = await this.attendanceRepo.findOne({
      where: { staffId: dto.staffId, logDate, checkoutTime: IsNull() },
      order: { createdAt: 'DESC' },
    });

    // If there's an open log, close it with checkout
    if (openLog && openLog.checkinTime) {
      openLog.checkoutTime = currentTime;
      openLog.checkoutSource = source;

      return this.attendanceRepo.save(openLog);
    }

    // No open log, create a new checkin row
    const log = this.attendanceRepo.create({
      staffId: dto.staffId,
      logDate,
      checkinTime: currentTime,
      checkoutTime: undefined,
      status: 'present',
      remarks: undefined,
      checkinSource: source,
      checkoutSource: undefined,
      overrideBy: undefined,
    });

    return this.attendanceRepo.save(log);
  }

  async findAllLogs(pageOptionsDto: PageOptionsDto) {
    const qb = this.attendanceRepo.createQueryBuilder('log');

    if (pageOptionsDto.q) {
      qb.where('log.status ILIKE :q', { q: `%${pageOptionsDto.q}%` });
    }

    qb.orderBy('log.logDate', 'DESC');

    if (pageOptionsDto.skip !== undefined) qb.skip(pageOptionsDto.skip);
    if (pageOptionsDto.take) qb.take(pageOptionsDto.take);

    const [data, total] = await qb.getManyAndCount();

    return { data, total };
  }

  async findLogsByStaff(staffId: Uuid) {
    return this.attendanceRepo.find({
      where: { staffId },
      order: { logDate: 'DESC' },
    });
  }

  async findOneLog(id: Uuid): Promise<AttendanceLog> {
    const log = await this.attendanceRepo.findOne({
      where: { id },
      relations: ['staff'],
    });

    if (!log) {
      throw new NotFoundException('Attendance log not found');
    }

    return log;
  }

  async updateLog(
    id: Uuid,
    dto: UpdateAttendanceLogDto,
  ): Promise<AttendanceLog> {
    const log = await this.findOneLog(id);
    Object.assign(log, dto);

    return this.attendanceRepo.save(log);
  }

  async removeLog(id: Uuid): Promise<void> {
    const log = await this.findOneLog(id);
    await this.attendanceRepo.remove(log);
  }

  // ── Scan Logs ──

  async findScansByStaffAndDate(staffId: Uuid, logDate: string) {
    return this.scanLogRepo.find({
      where: { staffId, logDate },
      order: { scannedAt: 'ASC' },
    });
  }

  // ── On Duty Remarks ──

  async findDutyRemarksByStaff(staffId: Uuid, logDate: string) {
    return this.onDutyRepo.find({
      where: { staffId, logDate },
      order: { outTime: 'ASC' },
    });
  }

  // ── Outing Requests ──

  async createOuting(dto: CreateOutingRequestDto): Promise<OutingRequest> {
    const todayStr = new Date().toISOString().split('T')[0]!;
    const isFutureDate = dto.logDate > todayStr;

    let outingBeforeCheckin = false;

    if (!isFutureDate) {
      const attendanceLog = await this.attendanceRepo.findOne({
        where: { staffId: dto.staffId, logDate: dto.logDate },
      });

      outingBeforeCheckin = !attendanceLog?.checkinTime;

      if (outingBeforeCheckin) {
        // Staff left BEFORE checking in — no log exists yet.
        // Create a new log with status 'out' so the day isn't counted as absent.
        await this.attendanceRepo.save(
          this.attendanceRepo.create({
            staffId: dto.staffId,
            logDate: dto.logDate,
            // never checked in
            checkinTime: undefined,
            // left at outFrom time
            checkoutTime: dto.outFrom,
            status: 'out',
            checkinSource: undefined,
            checkoutSource: 'outing',
          }),
        );
      } else if (attendanceLog) {
        // Staff has already checked in — mark them as 'out' from outFrom time.
        // Whether willResume is true or false, they are currently OUT.
        // On resume (scan/checkin again) the log will be updated back to 'present'.
        attendanceLog.status = 'out';
        attendanceLog.checkoutTime = dto.outFrom;
        attendanceLog.checkoutSource = 'outing';
        await this.attendanceRepo.save(attendanceLog);
      }
    }
    // For future dates: attendance log is untouched —
    // the staff will check in normally on that day.

    const outing = this.outingRepo.create({ ...dto, outingBeforeCheckin });

    return this.outingRepo.save(outing);
  }

  async findOutingsByStaff(staffId: Uuid) {
    return this.outingRepo.find({
      where: { staffId },
      order: { createdAt: 'DESC' },
    });
  }

  async cancelOuting(id: Uuid): Promise<OutingRequest> {
    const outing = await this.outingRepo.findOne({ where: { id } });

    if (!outing) {
      throw new NotFoundException('Outing request not found');
    }

    outing.status = 'cancelled';

    return this.outingRepo.save(outing);
  }

  // ── Outing Scheduler Methods ──

  /**
   * Process outings where out_from time has been reached.
   * Sets attendance log status to 'out'.
   */
  async processOutingDepartures(): Promise<number> {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]!;
    const currentHHMM = now.toTimeString().slice(0, 5); // "HH:mm"

    // Find active outings for today where out_from matches current minute
    const outings = await this.outingRepo.find({
      where: {
        logDate: todayStr,
        status: 'active',
      },
    });

    // Filter outings whose out_from starts with current HH:mm
    const dueDepartures = outings.filter(
      (o) => o.outFrom && o.outFrom.slice(0, 5) <= currentHHMM,
    );

    let processed = 0;

    for (const outing of dueDepartures) {
      const log = await this.attendanceRepo.findOne({
        where: { staffId: outing.staffId, logDate: todayStr },
        order: { createdAt: 'DESC' },
      });

      if (log && log.status === 'out') {
        // Already processed
        continue;
      }

      if (log) {
        log.status = 'out';
        log.checkoutTime = outing.outFrom;
        log.checkoutSource = 'outing';
        await this.attendanceRepo.save(log);
      } else {
        // No log exists — create one with status 'out'
        await this.attendanceRepo.save(
          this.attendanceRepo.create({
            staffId: outing.staffId,
            logDate: todayStr,
            checkinTime: undefined,
            checkoutTime: outing.outFrom,
            status: 'out',
            checkinSource: undefined,
            checkoutSource: 'outing',
          }),
        );
      }

      processed++;
    }

    return processed;
  }

  /**
   * Process outings where resume_time has been reached.
   * Sets attendance log status back to 'present' and marks outing as 'resumed'.
   */
  async processOutingReturns(): Promise<number> {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]!;
    const currentHHMM = now.toTimeString().slice(0, 5); // "HH:mm"

    // Find active outings for today with willResume=true and resume_time reached
    const outings = await this.outingRepo.find({
      where: {
        logDate: todayStr,
        status: 'active',
        willResume: true,
      },
    });

    const dueReturns = outings.filter(
      (o) => o.resumeTime && o.resumeTime.slice(0, 5) <= currentHHMM,
    );

    let processed = 0;

    for (const outing of dueReturns) {
      const log = await this.attendanceRepo.findOne({
        where: { staffId: outing.staffId, logDate: todayStr },
        order: { createdAt: 'DESC' },
      });

      if (log && log.status === 'out') {
        log.status = 'present';
        log.checkoutTime = undefined;
        await this.attendanceRepo.save(log);
      }

      outing.status = 'resumed';
      outing.resumedAt = new Date();
      await this.outingRepo.save(outing);

      processed++;
    }

    return processed;
  }

  // ── Leave Requests ──

  async createLeave(dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    // Get staff to find their officeId
    const staff = await this.staffRepo.findOne({
      where: { id: dto.staffId },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    // Check if any requested leave days fall on holidays
    const from = new Date(dto.leaveFrom);
    const to = new Date(dto.leaveTo);
    const holidayDays: string[] = [];

    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      if (await this.isNonWorkingDay(staff.officeId, d)) {
        holidayDays.push(d.toISOString().split('T')[0]!);
      }
    }

    if (holidayDays.length > 0) {
      throw new BadRequestException(
        `Cannot apply leave on holidays: ${holidayDays.join(', ')}`,
      );
    }

    const leave = this.leaveRepo.create(dto);

    return this.leaveRepo.save(leave);
  }

  async findLeavesByStaff(staffId: Uuid) {
    return this.leaveRepo.find({
      where: { staffId },
      order: { leaveFrom: 'DESC' },
    });
  }

  async cancelLeave(id: Uuid): Promise<LeaveRequest> {
    const leave = await this.leaveRepo.findOne({ where: { id } });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    leave.status = 'cancelled';
    leave.cancelledAt = new Date();

    return this.leaveRepo.save(leave);
  }

  // ── My Attendance Summary ──

  async getMyAttendance(staffId: Uuid, year: number) {
    const staff = await this.staffRepo.findOne({ where: { id: staffId } });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    const yearStart = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Start from the staff's creation date if it's within the requested year
    const staffCreatedDate = new Date(staff.createdAt)
      .toISOString()
      .split('T')[0]!;
    const startDate = [staffCreatedDate, yearStart]
      .sort((a, b) => a.localeCompare(b))
      .pop()!;

    // Get unique present dates (multiple check-ins per day count as one)
    const presentDays: { log_date: string }[] = await this.attendanceRepo
      .createQueryBuilder('log')
      .select('DISTINCT log.log_date', 'log_date')
      .where('log.staff_id = :staffId', { staffId })
      .andWhere('log.log_date >= :startDate', { startDate })
      .andWhere('log.log_date <= :endDate', { endDate })
      .andWhere("log.status = 'present'")
      .getRawMany();

    const presentDates = new Set(
      presentDays.map((r) => {
        const d = r.log_date;
        return typeof d === 'string'
          ? d
          : new Date(d).toISOString().split('T')[0]!;
      }),
    );

    // Get unique leave dates
    const leaveRecords = await this.leaveRepo
      .createQueryBuilder('leave')
      .where('leave.staff_id = :staffId', { staffId })
      .andWhere('leave.leave_from >= :startDate', { startDate })
      .andWhere('leave.leave_to <= :endDate', { endDate })
      .andWhere("leave.status = 'approved'")
      .getMany();

    const leaveDates = new Set<string>();

    for (const leave of leaveRecords) {
      const from = new Date(leave.leaveFrom);
      const to = new Date(leave.leaveTo);

      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        leaveDates.add(d.toISOString().split('T')[0]!);
      }
    }

    // Get weekly holidays and specific holidays for this office
    const weeklyHolidays = await this.weeklyHolidayRepo.find({
      where: { officeId: staff.officeId, isActive: true },
    });
    const weeklyHolidayDays = new Set(weeklyHolidays.map((w) => w.dayOfWeek));

    const specificHolidays = await this.holidayRepo2.find({
      where: { officeId: staff.officeId },
    });
    const specificHolidayDates = new Set(
      specificHolidays
        .map((h) => {
          const d = h.holidayDate;
          return typeof d === 'string'
            ? d
            : new Date(d).toISOString().split('T')[0]!;
        })
        .filter((d) => d >= startDate && d <= endDate),
    );

    // Calculate working days, absent days
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]!;
    const endStr =
      [endDate, todayStr].sort((a, b) => a.localeCompare(b))[0] ?? todayStr;

    const absentDates: string[] = [];
    let totalWorkingDays = 0;
    let holidayCount = 0;

    // Iterate using string dates to avoid timezone issues
    let current = startDate;

    while (current <= endStr) {
      const [y, m, day] = current.split('-').map(Number);
      // Create date at noon UTC to avoid timezone shifts
      const dateObj = new Date(Date.UTC(y!, m! - 1, day!));
      const utcDay = dateObj.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      const dayOfWeek = utcDay === 0 ? 7 : utcDay; // 1=Mon, ..., 7=Sun

      // Skip weekly holidays and specific holidays
      if (
        weeklyHolidayDays.has(dayOfWeek) ||
        specificHolidayDates.has(current)
      ) {
        holidayCount++;
      } else {
        totalWorkingDays++;

        if (!presentDates.has(current) && !leaveDates.has(current)) {
          absentDates.push(current);
        }
      }

      // Move to next day using UTC
      dateObj.setUTCDate(dateObj.getUTCDate() + 1);
      current = dateObj.toISOString().split('T')[0]!;
    }

    return {
      year,
      staffId,
      totalWorkingDays,
      holidayCount,
      presentCount: presentDates.size,
      leaveCount: leaveDates.size,
      absentCount: absentDates.length,
      absentDates,
    };
  }

  // ── Attendance Summary by Staff/Year/Month ──

  async getAttendanceSummary(staffId: Uuid, year: number, month?: number) {
    const staff = await this.staffRepo.findOne({ where: { id: staffId } });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    let monthStart: string;
    let monthEnd: string;

    if (month) {
      const monthStr = String(month).padStart(2, '0');
      monthStart = `${year}-${monthStr}-01`;
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      monthEnd = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
    } else {
      monthStart = `${year}-01-01`;
      monthEnd = `${year}-12-31`;
    }

    // Start from staff creation date if within the range
    const staffCreatedDate = new Date(staff.createdAt)
      .toISOString()
      .split('T')[0]!;
    const startDate =
      staffCreatedDate > monthStart ? staffCreatedDate : monthStart;
    const endDate = monthEnd;

    // Get unique present dates
    const presentDays: { log_date: string }[] = await this.attendanceRepo
      .createQueryBuilder('log')
      .select('DISTINCT log.log_date', 'log_date')
      .where('log.staff_id = :staffId', { staffId })
      .andWhere('log.log_date >= :startDate', { startDate })
      .andWhere('log.log_date <= :endDate', { endDate })
      .andWhere("log.status = 'present'")
      .getRawMany();

    const presentDates = new Set(
      presentDays.map((r) => {
        const d = r.log_date;
        return typeof d === 'string'
          ? d
          : new Date(d).toISOString().split('T')[0]!;
      }),
    );

    // Get leave dates
    const leaveRecords = await this.leaveRepo
      .createQueryBuilder('leave')
      .where('leave.staff_id = :staffId', { staffId })
      .andWhere('leave.leave_from <= :endDate', { endDate })
      .andWhere('leave.leave_to >= :startDate', { startDate })
      .andWhere("leave.status = 'approved'")
      .getMany();

    const leaveDates = new Set<string>();

    for (const leave of leaveRecords) {
      const from = new Date(leave.leaveFrom);
      const to = new Date(leave.leaveTo);

      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const ds = d.toISOString().split('T')[0]!;
        if (ds >= startDate && ds <= endDate) {
          leaveDates.add(ds);
        }
      }
    }

    // Get holidays
    const weeklyHolidays = await this.weeklyHolidayRepo.find({
      where: { officeId: staff.officeId, isActive: true },
    });
    const weeklyHolidayDays = new Set(weeklyHolidays.map((w) => w.dayOfWeek));

    const specificHolidays = await this.holidayRepo2.find({
      where: { officeId: staff.officeId },
    });
    const specificHolidayDates = new Set(
      specificHolidays
        .map((h) => {
          const d = h.holidayDate;
          return typeof d === 'string'
            ? d
            : new Date(d).toISOString().split('T')[0]!;
        })
        .filter((d) => d >= startDate && d <= endDate),
    );

    // Calculate
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]!;
    // eslint-disable-next-line unicorn/prefer-math-min-max
    const endStr = endDate < todayStr ? endDate : todayStr;

    const absentDates: string[] = [];
    let totalWorkingDays = 0;
    let holidayCount = 0;
    let current = startDate;

    while (current <= endStr) {
      const [y, m, day] = current.split('-').map(Number);
      const dateObj = new Date(Date.UTC(y!, m! - 1, day!));
      const utcDay = dateObj.getUTCDay();
      const dayOfWeek = utcDay === 0 ? 7 : utcDay;

      if (
        weeklyHolidayDays.has(dayOfWeek) ||
        specificHolidayDates.has(current)
      ) {
        holidayCount++;
      } else {
        totalWorkingDays++;
        if (!presentDates.has(current) && !leaveDates.has(current)) {
          absentDates.push(current);
        }
      }

      dateObj.setUTCDate(dateObj.getUTCDate() + 1);
      current = dateObj.toISOString().split('T')[0]!;
    }

    return {
      year,
      month,
      staff: {
        id: staff.id,
        employeeId: staff.employeeId,
        name: staff.name,
        email: staff.email,
        contactNo: staff.contactNo,
        cidNo: staff.cidNo,
        officeId: staff.officeId,
        departmentId: staff.departmentId,
        employmentType: staff.employmentType,
        photo: staff.photo,
        isActive: staff.isActive,
      },
      startDate,
      endDate: endStr,
      totalWorkingDays,
      holidayCount,
      presentCount: presentDates.size,
      leaveCount: leaveDates.size,
      absentCount: absentDates.length,
      absentDates,
    };
  }

  // ── All Staff Attendance Summary ──

  async getAllStaffAttendanceSummary(
    year: number,
    month?: number,
    departmentId?: Uuid,
  ) {
    const where: any = { isActive: true };
    if (departmentId) {
      where.departmentId = departmentId;
    }
    const allStaff = await this.staffRepo.find({ where });

    const results = await Promise.all(
      allStaff.map(async (staff) => {
        return this.getAttendanceSummary(staff.id, year, month);
      }),
    );

    return results;
  }

  // ── Daily Attendance Summary ──

  async getDailySummary(date: string, officeId: Uuid, departmentId?: Uuid) {
    const staffWhere: any = { isActive: true, officeId };
    if (departmentId) {
      staffWhere.departmentId = departmentId;
    }

    // Run all queries in parallel for speed
    const [
      allStaff,
      weeklyHolidays,
      specificHolidays,
      allLogs,
      activeOutings,
      leaveRecords,
    ] = await Promise.all([
      this.staffRepo.find({ where: staffWhere }),
      this.weeklyHolidayRepo.find({ where: { officeId, isActive: true } }),
      this.holidayRepo2.find({ where: { officeId } }),
      this.attendanceRepo.find({ where: { logDate: date } }),
      this.outingRepo
        .createQueryBuilder('outing')
        .where('outing.log_date = :date', { date })
        .andWhere("outing.status != 'cancelled'")
        .getMany(),
      this.leaveRepo
        .createQueryBuilder('leave')
        .where('leave.leave_from <= :date', { date })
        .andWhere('leave.leave_to >= :date', { date })
        .andWhere("leave.status = 'approved'")
        .getMany(),
    ]);

    // Check if holiday
    const [y, m, d] = date.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y!, m! - 1, d!));
    const utcDay = dateObj.getUTCDay();
    const dayOfWeek = utcDay === 0 ? 7 : utcDay;

    const isWeeklyHol = weeklyHolidays.some((w) => w.dayOfWeek === dayOfWeek);
    const isSpecificHol = specificHolidays.some((h) => {
      const hd =
        typeof h.holidayDate === 'string'
          ? h.holidayDate
          : new Date(h.holidayDate).toISOString().split('T')[0]!;
      return hd === date;
    });
    const isHoliday = isWeeklyHol || isSpecificHol;

    // Build lookup maps
    const logStatusMap = new Map<string, string>();
    const logRemarksMap = new Map<string, string | undefined>();

    for (const log of allLogs) {
      logStatusMap.set(log.staffId, log.status);
      logRemarksMap.set(log.staffId, log.remarks);
    }

    const leaveSet = new Set(leaveRecords.map((l) => l.staffId));

    // Determine current time HH:mm for outing time-based check
    const now = new Date();
    const currentHHMM = now.toTimeString().slice(0, 5); // "HH:mm"

    // Build a map of staffId -> outing for time-based status
    const outingByStaff = new Map<string, (typeof activeOutings)[0]>();
    for (const o of activeOutings) {
      outingByStaff.set(o.staffId, o);
    }

    // Map staff to statuses
    const staffSummaries = allStaff.map((staff) => {
      let status: 'present' | 'out' | 'absent' | 'leave' | 'holiday';
      let remarks: string | undefined;

      if (isHoliday) {
        status = 'holiday';
      } else {
        const logStatus = logStatusMap.get(staff.id);
        remarks = logRemarksMap.get(staff.id) ?? undefined;

        // Check outing time-based status
        const outing = outingByStaff.get(staff.id);
        if (outing) {
          const outFrom = outing.outFrom?.slice(0, 5) ?? '';
          const resumeTime = outing.resumeTime?.slice(0, 5) ?? '';

          // Staff is currently OUT if: current time >= out_from AND (no resume_time OR current time < resume_time)
          const isCurrentlyOut =
            outFrom <= currentHHMM && (!resumeTime || currentHHMM < resumeTime);

          if (isCurrentlyOut) {
            status = 'out';
            remarks = resumeTime
              ? `Will resume from ${this.to12Hour(resumeTime)}`
              : 'Out for the day';
          } else if (resumeTime && currentHHMM >= resumeTime) {
            // Resume time has passed — they should be back (present)
            status = 'present';
          } else {
            // out_from hasn't arrived yet — use log status
            status = logStatus === 'present' ? 'present' : 'absent';
          }
        } else if (logStatus === 'out') {
          status = 'out';
        } else if (logStatus === 'present') {
          status = 'present';
        } else if (leaveSet.has(staff.id)) {
          status = 'leave';
        } else {
          status = 'absent';
        }
      }

      return {
        staff: {
          id: staff.id,
          employeeId: staff.employeeId,
          name: staff.name,
          contactNo: staff.contactNo,
          departmentId: staff.departmentId,
          photo: staff.photo,
        },
        status,
        remarks: remarks ?? null,
      };
    });

    const totalStaff = allStaff.length;
    const presentCount = staffSummaries.filter(
      (s) => s.status === 'present',
    ).length;
    const outCount = staffSummaries.filter((s) => s.status === 'out').length;
    const absentCount = staffSummaries.filter(
      (s) => s.status === 'absent',
    ).length;
    const leaveCount = staffSummaries.filter(
      (s) => s.status === 'leave',
    ).length;
    const holidayCount = staffSummaries.filter(
      (s) => s.status === 'holiday',
    ).length;

    return {
      date,
      isHoliday,
      staff: staffSummaries,
      summary: {
        totalStaff,
        presentCount,
        outCount,
        absentCount,
        leaveCount,
        holidayCount,
      },
    };
  }
}
