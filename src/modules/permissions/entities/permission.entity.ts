import { Column, Entity, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import type { RolePermission } from '../../roles/entities/role-permission.entity';

@Entity('permissions')
export class Permission extends AbstractEntity {
  @Column({ type: 'varchar', length: 100, unique: true, name: 'name' })
  name!: string;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description?: string;

  @Column({ type: 'varchar', name: 'actions' })
  actions!: string;

  @Column({ type: 'varchar', name: 'subjects' })
  subjects!: string;

  @OneToMany('RolePermission', 'permission')
  rolePermissions!: RolePermission[];
}
