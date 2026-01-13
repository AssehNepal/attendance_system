import {
  StringFieldOptional,
  StringField,
} from '../../../decorators/field.decorators.ts';

export class UserLoginDto {
  @StringField({ minLength: 11, maxLength: 20 })
  readonly cidNo!: string;

  @StringFieldOptional()
  readonly password?: string;

  @StringFieldOptional()
  readonly ndiDeeplink?: string;
}
