import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';

@Entity('scan_logs')
export class ScanLog extends AbstractEntity {
  @Column({ type: 'uuid', name: 'staff_id' })
  staffId!: Uuid;

  @Column({ type: 'date', name: 'log_date' })
  logDate!: string;

  @Column({ type: 'timestamptz', name: 'scanned_at' })
  scannedAt!: Date;

  @Column({ type: 'varchar', length: 20, name: 'scan_type' })
  scanType!: 'checkin' | 'on_duty';

  @Column({ type: 'varchar', length: 30, default: 'biometric' })
  source!: string;

  @ManyToOne('Staff', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staff_id' })
  staff?: any;
}
