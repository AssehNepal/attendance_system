import { StringField } from '../../../decorators/field.decorators';

export class CreateDepartmentDto {
  @StringField({
    maxLength: 150,
    description: 'Department name',
    example: 'ICT Department',
  })
  name!: string;

  @StringField({
    maxLength: 20,
    description: 'Department code',
    example: 'ICT01',
  })
  code!: string;
}
