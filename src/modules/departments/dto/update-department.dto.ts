import {
  BooleanFieldOptional,
  StringFieldOptional,
} from '../../../decorators/field.decorators';

export class UpdateDepartmentDto {
  @StringFieldOptional({ maxLength: 150 })
  name?: string;

  @StringFieldOptional({ maxLength: 20 })
  code?: string;

  @BooleanFieldOptional()
  isActive?: boolean;
}
