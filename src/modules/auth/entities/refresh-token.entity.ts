import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';

@Entity('refresh_tokens')
export class RefreshToken extends AbstractEntity {
  @Column({ type: 'text' })
  @Index('idx_refresh_token')
  token!: string;

  @Column({ type: 'uuid', nullable: true, name: 'admin_id' })
  adminId?: Uuid;

  @Column({ type: 'uuid', nullable: true, name: 'staff_id' })
  staffId?: Uuid;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'boolean', default: false, name: 'is_revoked' })
  isRevoked!: boolean;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent?: string;

  @ManyToOne('Admin', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin?: any;

  @ManyToOne('Staff', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staff_id' })
  staff?: any;
}
