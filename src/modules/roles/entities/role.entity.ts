import { Column, Entity, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import type { RolePermission } from './role-permission.entity';
import type { AdminRole } from '../../admin/entities/admin-role.entity';

@Entity('roles')
export class Role extends AbstractEntity {
  @Column({ type: 'varchar', length: 100, unique: true, name: 'name' })
  name!: string;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description?: string;

  @OneToMany('RolePermission', 'role', {
    cascade: true,
  })
  rolePermissions!: RolePermission[];

  @OneToMany('AdminRole', 'role')
  adminRoles!: AdminRole[];
}
