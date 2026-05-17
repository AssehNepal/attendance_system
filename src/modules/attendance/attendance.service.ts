import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import type { PageOptionsDto } from '../../common/dto/page-options.dto';
import { WeeklyHoliday } from '../holidays/entities/weekly-holiday.entity';
import { Holiday } from '../holidays/entities/holiday.entity';
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
    const outing = this.outingRepo.create(dto);

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
    const where: any = { isActive: true, officeId };
    if (departmentId) {
      where.departmentId = departmentId;
    }
    const allStaff = await this.staffRepo.find({ where });

    // Check if the date is a holiday for this office
    const [y, m, d] = date.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y!, m! - 1, d!));
    const utcDay = dateObj.getUTCDay();
    const dayOfWeek = utcDay === 0 ? 7 : utcDay;

    const weeklyHolidays = await this.weeklyHolidayRepo.find({
      where: { officeId, isActive: true },
    });
    const specificHolidays = await this.holidayRepo2.find({
      where: { officeId },
    });

    const isWeeklyHol = weeklyHolidays.some((w) => w.dayOfWeek === dayOfWeek);
    const isSpecificHol = specificHolidays.some((h) => {
      const hd =
        typeof h.holidayDate === 'string'
          ? h.holidayDate
          : new Date(h.holidayDate).toISOString().split('T')[0]!;
      return hd === date;
    });
    const isHoliday = isWeeklyHol || isSpecificHol;

    // Get all present staff for this date
    const presentLogs = await this.attendanceRepo
      .createQueryBuilder('log')
      .select('log.staff_id', 'staffId')
      .where('log.log_date = :date', { date })
      .andWhere("log.status = 'present'")
      .getRawMany<{ staffId: string }>();
    const presentSet = new Set(presentLogs.map((l) => l.staffId));

    // Get all approved leaves covering this date
    const leaveRecords = await this.leaveRepo
      .createQueryBuilder('leave')
      .where('leave.leave_from <= :date', { date })
      .andWhere('leave.leave_to >= :date', { date })
      .andWhere("leave.status = 'approved'")
      .getMany();
    const leaveSet = new Set(leaveRecords.map((l) => l.staffId));

    const staffSummaries = allStaff.map((staff) => {
      let status: 'present' | 'absent' | 'leave' | 'holiday';
      if (isHoliday) {
        status = 'holiday';
      } else if (presentSet.has(staff.id)) {
        status = 'present';
      } else if (leaveSet.has(staff.id)) {
        status = 'leave';
      } else {
        status = 'absent';
      }

      return {
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
        status,
      };
    });

    const totalStaff = allStaff.length;
    const presentCount = staffSummaries.filter(
      (s) => s.status === 'present',
    ).length;
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
        absentCount,
        leaveCount,
        holidayCount,
      },
    };
  }
}
