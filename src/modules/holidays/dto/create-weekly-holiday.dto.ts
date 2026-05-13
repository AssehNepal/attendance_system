import {
  NumberField,
  BooleanFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators';

export class CreateWeeklyHolidayDto {
  @UUIDField()
  officeId!: Uuid;

  @NumberField({ int: true, minimum: 0, maximum: 6 })
  dayOfWeek!: number;

  @BooleanFieldOptional()
  isActive?: boolean;
}
