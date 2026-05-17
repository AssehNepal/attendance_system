import { StringFieldOptional } from '../../../decorators/field.decorators';

export class UpdateSystemSettingDto {
  @StringFieldOptional({ maxLength: 100 })
  key?: string;

  @StringFieldOptional({ maxLength: 500 })
  value?: string;
}
