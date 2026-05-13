import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';

@Entity('weekly_holidays')
export class WeeklyHoliday extends AbstractEntity {
  @Column({ type: 'uuid', name: 'office_id' })
  officeId!: Uuid;

  @Column({ type: 'smallint', name: 'day_of_week' })
  dayOfWeek!: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @Column({ type: 'uuid', name: 'created_by' })
  createdById!: Uuid;

  @ManyToOne('Office', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'office_id' })
  office?: any;

  @ManyToOne('Admin', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  createdByAdmin?: any;
}
