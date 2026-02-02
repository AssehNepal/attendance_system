import { Exclude } from 'class-transformer';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import type { OfficeLocation } from '../../office-location/entities/office-location.entity';
import type { AdminRole } from './admin-role.entity';
import type { Agency } from '../../agency/entities/agency.entity';

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
  officeLocationId?: Uuid;

  @ManyToOne('OfficeLocation', 'admins', {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'office_location_id' })
  officeLocation?: OfficeLocation;

  @Column({ type: 'uuid', nullable: true, name: 'agency_id' })
  agencyId?: Uuid;

  @ManyToOne('Agency', 'admins', {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'agency_id' })
  agency?: Agency;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'mobile_no' })
  mobileNo?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'email' })
  email?: string;

  @OneToMany('AdminRole', 'admin', { cascade: true })
  adminRoles!: AdminRole[];
}
