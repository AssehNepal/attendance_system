import {
  BooleanFieldOptional,
  StringField,
  UUIDField,
} from '../../../decorators/field.decorators';

export class CreateDepartmentDto {
  @UUIDField({
    description: 'Office ID',
    example: '58b587e4-4b92-4ba8-a637-de9966440390',
  })
  officeId!: Uuid;

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

  @BooleanFieldOptional({
    description: 'Whether the department is active',
    example: true,
  })
  isActive?: boolean;
}
