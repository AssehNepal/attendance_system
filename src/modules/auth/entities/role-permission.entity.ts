import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import type { Role } from './role.entity';
import type { Permission } from './permission.entity';

@Entity('role_permission')
export class RolePermission extends AbstractEntity {
  @Column({ type: 'uuid', name: 'role_id' })
  roleId!: string;

  @ManyToOne('Role', 'rolePermissions', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @Column({ type: 'uuid', name: 'permission_id' })
  permissionId!: string;

  @ManyToOne('Permission', 'rolePermissions', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_id' })
  permission!: Permission;
}
