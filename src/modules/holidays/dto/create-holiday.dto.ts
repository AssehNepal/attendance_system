import {
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators';

export class CreateHolidayDto {
  @StringField({ maxLength: 10 })
  holidayDate!: string;

  @StringField({ maxLength: 200 })
  name!: string;

  @StringFieldOptional({ maxLength: 30 })
  type?: 'public' | 'restricted';
}
