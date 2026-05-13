import {
  BooleanFieldOptional,
  StringFieldOptional,
  UUIDFieldOptional,
} from '../../../decorators/field.decorators';

export class UpdateDepartmentDto {
  @StringFieldOptional({ maxLength: 150 })
  name?: string;

  @StringFieldOptional({ maxLength: 20 })
  code?: string;

  @UUIDFieldOptional()
  headStaffId?: Uuid;

  @BooleanFieldOptional()
  isActive?: boolean;
}
