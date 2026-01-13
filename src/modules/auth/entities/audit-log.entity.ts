import type { UserEntity } from '../../user/user.entity';
import type { Admin } from './admin.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';

@Entity('audit_log')
export class AuditLog extends AbstractEntity {
  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId?: string;

  @ManyToOne('UserEntity', 'auditLogs', { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @Column({ type: 'uuid', nullable: true, name: 'admin_id' })
  adminId?: string;

  @ManyToOne('Admin', 'auditLogs', { nullable: true })
  @JoinColumn({ name: 'admin_id' })
  admin?: Admin;

  @Column({ type: 'varchar', length: 100, name: 'action' })
  action!: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'entity_type' })
  entityType?: string;

  @Column({ type: 'uuid', nullable: true, name: 'entity_id' })
  entityId?: string;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'metadata' })
  metadata?: Record<string, any>;
}
