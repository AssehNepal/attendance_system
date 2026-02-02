import {
  StringField,
} from '../../../decorators/field.decorators.ts';

export class CreateUserDto {
  @StringField()
  cidNo!: string;

  @StringField({ minLength: 8 })
  password!: string;
}
