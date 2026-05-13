import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';

@Entity('offices')
export class Office extends AbstractEntity {
  @Column({ type: 'varchar', length: 200, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 20, unique: true, name: 'dzongkhag_code' })
  dzongkhagCode!: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'email_domain',
  })
  emailDomain?: string;

  @Column({ type: 'time', default: '09:00', name: 'office_start_time' })
  officeStartTime!: string;

  @Column({ type: 'time', default: '17:00', name: 'office_end_time' })
  officeEndTime!: string;

  @Column({ type: 'time', default: '10:00', name: 'absence_cutoff_time' })
  absenceCutoffTime!: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @Column({ type: 'uuid', name: 'created_by' })
  createdById!: Uuid;

  @ManyToOne('Admin', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  createdByAdmin?: any;
}
