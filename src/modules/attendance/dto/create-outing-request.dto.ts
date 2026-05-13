import {
  BooleanField,
  BooleanFieldOptional,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators';

export class CreateOutingRequestDto {
  @UUIDField()
  staffId!: Uuid;

  @StringField({ maxLength: 10 })
  logDate!: string;

  @BooleanField()
  willResume!: boolean;

  @StringFieldOptional({ maxLength: 10 })
  resumeTime?: string;

  @BooleanFieldOptional()
  outingBeforeCheckin?: boolean;
}
