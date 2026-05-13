import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';

@Entity('departments')
export class Department extends AbstractEntity {
  @Column({ type: 'uuid', name: 'office_id' })
  officeId!: Uuid;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 20 })
  code!: string;

  @Column({ type: 'uuid', nullable: true, name: 'head_staff_id' })
  headStaffId?: Uuid;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @ManyToOne('Office', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'office_id' })
  office?: any;

  @ManyToOne('Staff', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'head_staff_id' })
  headStaff?: any;
}
