import { EmailField } from '../../../decorators/field.decorators';

export class CreateForgotPasswordDto {
  @EmailField()
  readonly email!: string;
}
