import {
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

export class AdminLoginDto {
  @StringField()
  cidNo!: string;

  @StringField()
  password!: string;

  @StringFieldOptional()
  ndiDeeplink?: string;
}
