import {
  BooleanFieldOptional,
  EmailFieldOptional,
  StringFieldOptional,
  UUIDFieldOptional,
} from '../../../decorators/field.decorators';

export class UpdateAdminDto {
  @StringFieldOptional({ maxLength: 200 })
  name?: string;

  @EmailFieldOptional()
  email?: string;

  @StringFieldOptional({ maxLength: 255 })
  password?: string;

  @StringFieldOptional({ maxLength: 20 })
  role?: 'super_admin' | 'admin';

  @UUIDFieldOptional()
  officeId?: Uuid;

  @BooleanFieldOptional()
  isActive?: boolean;
}
