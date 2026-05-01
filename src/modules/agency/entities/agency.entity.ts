import { Column, Entity, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import type { Admin } from '../../admin/entities/admin.entity';

@Entity('agency')
export class Agency extends AbstractEntity {
  @Column({ type: 'varchar', length: 255, name: 'name' })
  name!: string;

  @Column({ type: 'varchar', length: 100, unique: true, name: 'code' })
  code!: string;

  @OneToMany('Admin', 'agency')
  admins!: Admin[];
}
