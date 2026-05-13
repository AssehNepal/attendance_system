import { Exclude } from 'class-transformer';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';

@Entity('admins')
export class Admin extends AbstractEntity {
  @Column({ type: 'uuid', nullable: true, name: 'office_id' })
  officeId?: Uuid;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  @Exclude({ toPlainOnly: true })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 20, default: 'admin' })
  role!: 'super_admin' | 'admin';

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
  lastLoginAt?: Date;

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdById?: Uuid;

  // ── Relations ──

  @ManyToOne('Office', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'office_id' })
  office?: any;

  @ManyToOne('Admin', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdByAdmin?: Admin;
}
