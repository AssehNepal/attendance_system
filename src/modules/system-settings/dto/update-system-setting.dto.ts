import { StringFieldOptional } from '../../../decorators/field.decorators';

export class UpdateSystemSettingDto {
  @StringFieldOptional({ maxLength: 500 })
  value?: string;

  @StringFieldOptional()
  description?: string;
}
