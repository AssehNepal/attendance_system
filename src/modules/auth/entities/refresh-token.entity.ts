import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity.ts';
import { UseDto } from '../../../decorators/use-dto.decorator.ts';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import type { User } from '../../users/entities/user.entity.ts';
import type { Admin } from './admin.entity.ts';

@Entity({ name: 'refresh_tokens' })
@UseDto(RefreshTokenDto)
export class RefreshToken extends AbstractEntity<RefreshTokenDto> {
  @Column({ type: 'text', name: 'token' })
  @Index()
  token!: string;

  @Column({ nullable: true, type: 'uuid', name: 'user_id' })
  userId!: string | null;

  @Column({ nullable: true, type: 'uuid', name: 'admin_id' })
  adminId!: string | null;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'boolean', default: false, name: 'is_revoked' })
  isRevoked!: boolean;

  @Column({ nullable: true, type: 'varchar', length: 45, name: 'ip_address' })
  ipAddress!: string | null;

  @Column({ nullable: true, type: 'text', name: 'user_agent' })
  userAgent!: string | null;

  @ManyToOne('User', { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @ManyToOne('Admin', { nullable: true })
  @JoinColumn({ name: 'admin_id' })
  admin?: Admin | null;
}
