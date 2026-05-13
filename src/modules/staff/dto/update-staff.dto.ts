import {
  BooleanFieldOptional,
  EmailFieldOptional,
  StringFieldOptional,
  UUIDFieldOptional,
} from '../../../decorators/field.decorators';

export class UpdateStaffDto {
  @UUIDFieldOptional()
  officeId?: Uuid;

  @UUIDFieldOptional()
  departmentId?: Uuid;

  @StringFieldOptional({ maxLength: 200 })
  name?: string;

  @StringFieldOptional({ maxLength: 20 })
  contactNo?: string;

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
