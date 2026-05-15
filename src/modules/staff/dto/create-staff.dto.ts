import {
  BooleanFieldOptional,
  EmailFieldOptional,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators';

export class CreateStaffDto {
  @UUIDField({
    description: 'Department ID',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  })
  departmentId!: Uuid;

  @StringField({
    maxLength: 50,
    description: 'Employee ID',
    example: 'EMP-001',
  })
  employeeId!: string;

  @StringFieldOptional({
    maxLength: 150,
    description: 'Citizen ID Number',
    example: '11501000001',
  })
  cidNo?: string;

  @StringField({
    maxLength: 200,
    description: 'Full name',
    example: 'Dorji Wangchuk',
  })
  name!: string;

  @StringField({
    maxLength: 20,
    description: 'Contact number',
    example: '17123456',
  })
  contactNo!: string;

  @EmailFieldOptional({ description: 'Email address', example: 'dorji@gov.bt' })
  email?: string;

  @StringFieldOptional({
    maxLength: 255,
    description: 'Password',
    example: 'P@ssw0rd123',
  })
  password?: string;

  @StringFieldOptional({
    maxLength: 30,
    description: 'Employment type',
    example: 'regular',
  })
  employmentType?: 'regular' | 'contract' | 'deputation';

  @BooleanFieldOptional({
    description: 'Whether staff is active',
    example: true,
  })
  isActive?: boolean;
}
