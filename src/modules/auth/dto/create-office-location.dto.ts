import { StringField } from '../../../decorators/field.decorators.ts';

export class CreateOfficeLocationDto {
  @StringField()
  name!: string;

  @StringField({ required: false })
  code?: string;

  @StringField({ required: false })
  description?: string;
}
