import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';

@Entity('leave_requests')
export class LeaveRequest extends AbstractEntity {
  @Column({ type: 'uuid', name: 'staff_id' })
  staffId!: Uuid;

  @Column({ type: 'date', name: 'leave_from' })
  leaveFrom!: string;

  @Column({ type: 'date', name: 'leave_to' })
  leaveTo!: string;

  @Column({ type: 'varchar', length: 50, name: 'leave_type' })
  leaveType!: 'casual' | 'earned' | 'medical' | 'maternity' | 'special';

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'varchar', length: 20, default: 'approved' })
  status!: 'approved' | 'cancelled';

  @Column({ type: 'timestamptz', nullable: true, name: 'cancelled_at' })
  cancelledAt?: Date;

  @ManyToOne('Staff', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staff_id' })
  staff?: any;
}
