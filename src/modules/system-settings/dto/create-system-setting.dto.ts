import {
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators';

export class CreateSystemSettingDto {
  @StringField({ maxLength: 100 })
  key!: string;

  @StringField({ maxLength: 500 })
  value!: string;

  @StringFieldOptional()
  description?: string;
}
