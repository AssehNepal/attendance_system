import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';

@Entity('outing_requests')
export class OutingRequest extends AbstractEntity {
  @Column({ type: 'uuid', name: 'staff_id' })
  staffId!: Uuid;

  @Column({ type: 'date', name: 'log_date' })
  logDate!: string;

  @Column({ type: 'timestamptz', default: () => 'now()', name: 'requested_at' })
  requestedAt!: Date;

  @Column({ type: 'boolean', name: 'will_resume' })
  willResume!: boolean;

  @Column({ type: 'time', nullable: true, name: 'resume_time' })
  resumeTime?: string;

  @Column({ type: 'boolean', default: false, name: 'outing_before_checkin' })
  outingBeforeCheckin!: boolean;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: 'active' | 'resumed' | 'cancelled';

  @Column({ type: 'timestamptz', nullable: true, name: 'resumed_at' })
  resumedAt?: Date;

  @ManyToOne('Staff', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staff_id' })
  staff?: any;
}
