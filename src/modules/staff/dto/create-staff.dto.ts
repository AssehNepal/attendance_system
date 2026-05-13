import {
  BooleanFieldOptional,
  EmailFieldOptional,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators';

export class CreateStaffDto {
  @UUIDField()
  officeId!: Uuid;

  @UUIDField()
  departmentId!: Uuid;

  @StringField({ maxLength: 50 })
  employeeId!: string;

  @StringField({ maxLength: 200 })
  name!: string;

  @StringField({ maxLength: 20 })
  contactNo!: string;

  @EmailFieldOptional()
  email?: string;

  @StringFieldOptional({ maxLength: 255 })
  password?: string;

  @StringFieldOptional({ maxLength: 150 })
  designation?: string;

  @StringFieldOptional({ maxLength: 30 })
  employmentType?: 'regular' | 'contract' | 'deputation';

  @BooleanFieldOptional()
  isActive?: boolean;
}
