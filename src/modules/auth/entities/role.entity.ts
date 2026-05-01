import { Column, Entity, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import type { AdminRole } from './admin-role.entity';
import type { RolePermission } from './role-permission.entity';

@Entity('roles')
export class Role extends AbstractEntity {
  @Column({ type: 'varchar', length: 100, unique: true, name: 'name' })
  name!: string;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description?: string;

  @OneToMany('RolePermission', 'role')
  rolePermissions!: RolePermission[];

  @OneToMany('AdminRole', 'role')
  adminRoles!: AdminRole[];
}
