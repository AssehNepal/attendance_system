import { Column, Entity, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import type { Admin } from '../../admin/entities/admin.entity';

@Entity('office_location')
export class OfficeLocation extends AbstractEntity {
  @Column({ type: 'varchar', length: 255, name: 'name' })
  name!: string;

  @OneToMany('Admin', 'officeLocation')
  admins!: Admin[];
}
