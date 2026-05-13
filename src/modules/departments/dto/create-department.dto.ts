import {
  BooleanFieldOptional,
  StringField,
  UUIDField,
  UUIDFieldOptional,
} from '../../../decorators/field.decorators';

export class CreateDepartmentDto {
  @UUIDField()
  officeId!: Uuid;

  @StringField({ maxLength: 150 })
  name!: string;

  @StringField({ maxLength: 20 })
  code!: string;

  @UUIDFieldOptional()
  headStaffId?: Uuid;

  @BooleanFieldOptional()
  isActive?: boolean;
}
