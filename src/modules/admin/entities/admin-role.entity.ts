import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import type { Role } from '../../roles/entities/role.entity';
import type { Admin } from './admin.entity';

@Entity('admin_role')
export class AdminRole extends AbstractEntity {
  @Column({ type: 'uuid', name: 'admin_id' })
  adminId!: Uuid;

  @ManyToOne('Admin', 'adminRoles', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'admin_id' })
  admin!: Admin;

  @Column({ type: 'uuid', name: 'role_id' })
  roleId!: Uuid;

  @ManyToOne('Role', 'adminRoles', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role!: Role;
}
