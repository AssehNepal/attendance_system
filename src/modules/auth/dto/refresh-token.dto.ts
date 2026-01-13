import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import {
  BooleanField,
  DateField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators.ts';
import type { RefreshToken } from '../entities/refresh-token.entity.ts';

export class RefreshTokenDto extends AbstractDto {
  @StringFieldOptional()
  token!: string;

  @UUIDField({ nullable: true })
  userId!: string | null;

  @UUIDField({ nullable: true })
  adminId!: string | null;

  @DateField()
  expiresAt!: Date;

  @BooleanField()
  isRevoked!: boolean;

  @StringFieldOptional()
  ipAddress!: string | null;

  @StringFieldOptional()
  userAgent!: string | null;

  constructor(refreshToken: RefreshToken) {
    super(refreshToken);
    this.token = refreshToken.token;
    this.userId = refreshToken.userId;
    this.adminId = refreshToken.adminId;
    this.expiresAt = refreshToken.expiresAt;
    this.isRevoked = refreshToken.isRevoked;
    this.ipAddress = refreshToken.ipAddress;
    this.userAgent = refreshToken.userAgent;
  }
}
