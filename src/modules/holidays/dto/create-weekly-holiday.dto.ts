import {
  BooleanFieldOptional,
  NumberField,
} from '../../../decorators/field.decorators';

export class CreateWeeklyHolidayDto {
  @NumberField({ int: true, minimum: 1, maximum: 7 })
  dayOfWeek!: number;

  @BooleanFieldOptional()
  isActive?: boolean;
}
