import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';

@Entity('system_settings')
export class SystemSetting extends AbstractEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  key!: string;

  @Column({ type: 'varchar', length: 500 })
  value!: string;

  @Column({ type: 'text', nullable: true, name: 'image_url' })
  imageUrl?: string;

  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updatedById?: Uuid;

  @ManyToOne('Admin', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by' })
  updatedByAdmin?: any;
}
