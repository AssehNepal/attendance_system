import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';

@Entity('on_duty_remarks')
export class OnDutyRemark extends AbstractEntity {
  @Column({ type: 'uuid', name: 'staff_id' })
  staffId!: Uuid;

  @Column({ type: 'date', name: 'log_date' })
  logDate!: string;

  @Column({ type: 'uuid', name: 'out_scan_id' })
  outScanId!: Uuid;

  @Column({ type: 'uuid', nullable: true, name: 'in_scan_id' })
  inScanId?: Uuid;

  @Column({ type: 'time', name: 'out_time' })
  outTime!: string;

  @Column({ type: 'time', nullable: true, name: 'in_time' })
  inTime?: string;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  token!: string;

  @Column({ type: 'timestamptz', name: 'token_expires_at' })
  tokenExpiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'submitted_at' })
  submittedAt?: Date;

  // ── Relations ──

  @ManyToOne('Staff', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staff_id' })
  staff?: any;

  @ManyToOne('ScanLog', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'out_scan_id' })
  outScan?: any;

  @ManyToOne('ScanLog', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'in_scan_id' })
  inScan?: any;
}
