import { Exclude } from 'class-transformer';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import type { OfficeLocation } from './office-location.entity';
import type { AdminRole } from './admin-role.entity';

@Entity('admin')
export class Admin extends AbstractEntity {
  @Column({ type: 'varchar', length: 20, unique: true, name: 'cid_no' })
  cidNo!: string;

  @Column({ type: 'varchar', length: 20, default: 'ADMIN', name: 'role_type' })
  roleType!: string;

  @Column({ type: 'varchar', length: 255, name: 'password' })
  @Exclude({ toPlainOnly: true })
  password!: string;

  @Column({ type: 'uuid', nullable: true, name: 'office_location_id' })
  officeLocationId?: string;

  @ManyToOne('OfficeLocation', 'admins', {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'office_location_id' })
  officeLocation?: OfficeLocation;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'agency_id' })
  agencyId?: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'mobile_no' })
  mobileNo?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'email' })
  email?: string;

  @OneToMany('AdminRole', 'admin')
  adminRoles!: AdminRole[];
}
