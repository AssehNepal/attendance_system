import {
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

/**
 * Citizen Login DTO
 * Citizens login via NDI verification only - no credentials needed
 * The NDI app will provide verified CID and user data
 */
export class UserLoginDto {
  // No fields needed - NDI handles all verification
  // Users will scan QR code and NDI provides verified identity data
}

/**
 * NDI Verified Login DTO
 * Internal DTO used after NDI verification completes via NATS
 */
export class NdiVerifiedLoginDto {
  @StringField({ minLength: 11, maxLength: 20 })
  readonly cidNo!: string;

  @StringFieldOptional()
  readonly fullName?: string;

  @StringFieldOptional()
  readonly dateOfBirth?: string;

  @StringFieldOptional()
  readonly gender?: string;
}
