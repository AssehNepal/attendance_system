import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';

@Entity('holidays')
export class Holiday extends AbstractEntity {
  @Column({ type: 'uuid', name: 'office_id' })
  officeId!: Uuid;

  @Column({ type: 'date', name: 'holiday_date' })
  holidayDate!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 30, default: 'public' })
  type!: 'public' | 'restricted';

  @Column({ type: 'uuid', name: 'created_by' })
  createdById!: Uuid;

  @ManyToOne('Office', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'office_id' })
  office?: any;

  @ManyToOne('Admin', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  createdByAdmin?: any;
}
