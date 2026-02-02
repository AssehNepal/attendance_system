import { StringFieldOptional, EmailFieldOptional, PhoneFieldOptional } from '../../../decorators/field.decorators';

export class CreateForgotPasswordDto {
  @StringFieldOptional({ minLength: 1 })
  readonly cidNo?: string;

  @EmailFieldOptional()
  readonly email?: string;

  @PhoneFieldOptional()
  readonly mobileNo?: string;
}
