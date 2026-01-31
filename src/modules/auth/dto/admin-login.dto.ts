import { StringField } from '../../../decorators/field.decorators.ts';

/**
 * Admin Login DTO
 * Admins login with CID + password for enhanced security
 */
export class AdminLoginDto {
  @StringField({ minLength: 1, maxLength: 100 })
  cidNo!: string;

  @StringField({ minLength: 2, maxLength: 100 })
  password!: string;
}
