import { AbstractDto } from '../../../common/dto/abstract.dto';
import {
  BooleanField,
  DateField,
  StringFieldOptional,
  UUIDFieldOptional,
} from '../../../decorators/field.decorators';
import type { RefreshToken } from '../entities/refresh-token.entity';

export class RefreshTokenDto extends AbstractDto {
  @StringFieldOptional()
  token!: string;

  @UUIDFieldOptional()
  adminId!: string | null;

  @UUIDFieldOptional()
  staffId!: string | null;

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
    this.adminId = refreshToken.adminId ?? null;
    this.staffId = refreshToken.staffId ?? null;
    this.expiresAt = refreshToken.expiresAt;
    this.isRevoked = refreshToken.isRevoked;
    this.ipAddress = refreshToken.ipAddress ?? null;
    this.userAgent = refreshToken.userAgent ?? null;
  }
}
