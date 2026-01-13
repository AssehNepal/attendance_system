import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import {
  EnumField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators.ts';
import { AuditAction, type AuditLog } from '../entities/audit-log.entity.ts';

export class AuditLogDto extends AbstractDto {
  @EnumField(() => AuditAction)
  action!: AuditAction;

  @StringFieldOptional()
  entityType!: string;

  @UUIDField({ nullable: true })
  entityId!: string | null;

  @UUIDField({ nullable: true })
  userId!: string | null;

  @UUIDField({ nullable: true })
  adminId!: string | null;

  @StringFieldOptional()
  ipAddress!: string | null;

  @StringFieldOptional()
  userAgent!: string | null;

  metadata!: Record<string, any> | null;

  constructor(auditLog: AuditLog) {
    super(auditLog);
    this.action = auditLog.action;
    this.entityType = auditLog.entityType;
    this.entityId = auditLog.entityId;
    this.userId = auditLog.userId;
    this.adminId = auditLog.adminId;
    this.ipAddress = auditLog.ipAddress;
    this.userAgent = auditLog.userAgent;
    this.metadata = auditLog.metadata;
  }
}
