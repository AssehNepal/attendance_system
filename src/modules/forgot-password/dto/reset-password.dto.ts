import {
  PasswordField,
  StringField,
} from '../../../decorators/field.decorators';

export class ResetPasswordDto {
  @StringField({ minLength: 1 })
  readonly cidOrEmailOrMobile!: string;

  @PasswordField({ minLength: 8 })
  readonly newPassword!: string;

  @PasswordField({ minLength: 8 })
  readonly confirmPassword!: string;
}
