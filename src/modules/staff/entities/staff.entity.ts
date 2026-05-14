import { Exclude } from 'class-transformer';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';

@Entity('staff')
export class Staff extends AbstractEntity {
  @Column({ type: 'uuid', name: 'office_id' })
  officeId!: Uuid;

  @Column({ type: 'uuid', name: 'department_id' })
  departmentId!: Uuid;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'employee_id' })
  employeeId!: string;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'cid_no' })
  cidNo?: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 20, name: 'contact_no' })
  contactNo!: string;

  @Column({ type: 'varchar', length: 200, nullable: true, unique: true })
  email?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude({ toPlainOnly: true })
  password?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
  lastLoginAt?: Date;

  @Column({
    type: 'varchar',
    length: 30,
    default: 'regular',
    name: 'employment_type',
  })
  employmentType!: 'regular' | 'contract' | 'deputation';

  @Column({ type: 'varchar', length: 100, nullable: true })
  photo?: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  // ── Relations ──

  @ManyToOne('Office', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'office_id' })
  office?: any;

  @ManyToOne('Department', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'department_id' })
  department?: any;
}
