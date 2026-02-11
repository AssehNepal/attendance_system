import { Column, Entity, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import type { RolePermission } from './role-permission.entity';

export enum PermissionAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
}

export enum PermissionSubject {
  BIRTH = 'BIRTH',
  PERSON = 'PERSON',
  HOUSEHOLD = 'HOUSEHOLD',
  ADMIN = 'ADMIN',
  ROLE = 'ROLE',
  PERMISSION = 'PERMISSION',
}

@Entity('permissions')
export class Permission extends AbstractEntity {
  @Column({ type: 'varchar', length: 100, unique: true, name: 'name' })
  name!: string;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description?: string;

  @Column({
    type: 'varchar',
    name: 'actions',
  })
  actions!: string;

  @Column({
    type: 'varchar',
    name: 'subjects',
  })
  subjects!: string;

  @OneToMany('RolePermission', 'permission')
  rolePermissions!: RolePermission[];
}
