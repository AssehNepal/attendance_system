import { StringField } from '../../../decorators/field.decorators.ts';

export class AdminLoginDto {
  @StringField()
  cidNo!: string;

  @StringField()
  password!: string;
}
