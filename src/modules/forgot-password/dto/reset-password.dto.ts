import {
  EmailField,
  PasswordField,
  StringField,
} from '../../../decorators/field.decorators';

export class ResetPasswordDto {
  @EmailField()
  readonly email!: string;

  @StringField({ minLength: 4, maxLength: 10 })
  readonly otp!: string;

  @PasswordField({ minLength: 8 })
  readonly newPassword!: string;
}
