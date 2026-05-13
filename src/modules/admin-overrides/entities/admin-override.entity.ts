import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';

@Entity('admin_overrides')
export class AdminOverride extends AbstractEntity {
  @Column({ type: 'uuid', name: 'admin_id' })
  adminId!: Uuid;

  @Column({ type: 'varchar', length: 50, name: 'target_table' })
  targetTable!: string;

  @Column({ type: 'uuid', name: 'target_id' })
  targetId!: Uuid;

  @Column({ type: 'varchar', length: 50, name: 'action_type' })
  actionType!: string;

  @Column({ type: 'text', nullable: true, name: 'old_value' })
  oldValue?: string;

  @Column({ type: 'text', nullable: true, name: 'new_value' })
  newValue?: string;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ type: 'timestamptz', default: () => 'now()', name: 'override_at' })
  overrideAt!: Date;

  @ManyToOne('Admin', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'admin_id' })
  admin?: any;
}
