import {
  StringFieldOptional,
  UUIDFieldOptional,
} from '../../../decorators/field.decorators';

export class UpdateAttendanceLogDto {
  @StringFieldOptional({ maxLength: 10 })
  checkinTime?: string;

  @StringFieldOptional({ maxLength: 10 })
  checkoutTime?: string;

  @StringFieldOptional({ maxLength: 30 })
  status?: 'present' | 'out' | 'on_duty' | 'on_leave' | 'absent' | 'holiday';

  @StringFieldOptional()
  remarks?: string;

  @StringFieldOptional({ maxLength: 30 })
  checkinSource?: string;

  @StringFieldOptional({ maxLength: 30 })
  checkoutSource?: string;

  @UUIDFieldOptional()
  overrideBy?: Uuid;
}
