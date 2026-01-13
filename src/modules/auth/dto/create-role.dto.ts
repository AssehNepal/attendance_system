import {
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

export class CreateRoleDto {
  @StringField()
  name!: string;

  @StringFieldOptional()
  description?: string;
}
