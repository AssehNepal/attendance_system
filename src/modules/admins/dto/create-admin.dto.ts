import {
  BooleanFieldOptional,
  EmailField,
  StringField,
  StringFieldOptional,
  UUIDFieldOptional,
} from '../../../decorators/field.decorators';

export class CreateAdminDto {
  @StringField({ maxLength: 200 })
  name!: string;

  @EmailField()
  email!: string;

  @StringField({ maxLength: 255 })
  password!: string;

  @StringFieldOptional({ maxLength: 20 })
  role?: 'super_admin' | 'admin';

  @UUIDFieldOptional()
  officeId?: Uuid;

  @BooleanFieldOptional()
  isActive?: boolean;
}
