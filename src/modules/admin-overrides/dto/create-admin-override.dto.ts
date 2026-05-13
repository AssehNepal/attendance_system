import {
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators';

export class CreateAdminOverrideDto {
  @UUIDField()
  adminId!: Uuid;

  @StringField({ maxLength: 50 })
  targetTable!: string;

  @UUIDField()
  targetId!: Uuid;

  @StringField({ maxLength: 50 })
  actionType!: string;

  @StringFieldOptional()
  oldValue?: string;

  @StringFieldOptional()
  newValue?: string;

  @StringField()
  reason!: string;
}
