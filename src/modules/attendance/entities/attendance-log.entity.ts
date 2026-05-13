import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';

@Entity('attendance_logs')
export class AttendanceLog extends AbstractEntity {
  @Column({ type: 'uuid', name: 'staff_id' })
  staffId!: Uuid;

  @Column({ type: 'date', name: 'log_date' })
  logDate!: string;

  @Column({ type: 'time', nullable: true, name: 'checkin_time' })
  checkinTime?: string;

  @Column({ type: 'time', nullable: true, name: 'checkout_time' })
  checkoutTime?: string;

  @Column({ type: 'varchar', length: 30, default: 'out' })
  status!: 'present' | 'out' | 'on_duty' | 'on_leave' | 'absent' | 'holiday';

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
    name: 'checkin_source',
  })
  checkinSource?: string;

  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
    name: 'checkout_source',
  })
  checkoutSource?: string;

  @Column({ type: 'uuid', nullable: true, name: 'override_by' })
  overrideBy?: Uuid;

  // ── Relations ──

  @ManyToOne('Staff', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staff_id' })
  staff?: any;

  @ManyToOne('Admin', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'override_by' })
  overrideByAdmin?: any;
}
