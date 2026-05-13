import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { PageOptionsDto } from '../../common/dto/page-options.dto';
import { CreateAttendanceLogDto } from './dto/create-attendance-log.dto';
import { UpdateAttendanceLogDto } from './dto/update-attendance-log.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { CreateOutingRequestDto } from './dto/create-outing-request.dto';
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
  ) {}

  // ── Attendance Logs ──

  async createLog(dto: CreateAttendanceLogDto): Promise<AttendanceLog> {
    const log = this.attendanceRepo.create(dto);

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
}
