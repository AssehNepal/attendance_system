import {
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators';

export class CreateLeaveRequestDto {
  @UUIDField()
  staffId!: Uuid;

  @StringField({ maxLength: 10 })
  leaveFrom!: string;

  @StringField({ maxLength: 10 })
  leaveTo!: string;

  @StringField({ maxLength: 50 })
  leaveType!: 'casual' | 'earned' | 'medical' | 'maternity' | 'special';

  @StringFieldOptional()
  reason?: string;
}
