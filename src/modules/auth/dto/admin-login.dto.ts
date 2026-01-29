import { StringField } from '../../../decorators/field.decorators.ts';

/**
 * Admin Login DTO
 * Admins login with CID + password for enhanced security
 */
export class AdminLoginDto {
  @StringField({ minLength: 11, maxLength: 20 })
  cidNo!: string;

  @StringField({ minLength: 8 })
  password!: string;
}
