import { UUIDField } from '../../../decorators/field.decorators';

export class CreateAttendanceLogDto {
  @UUIDField({
    description: 'Staff ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  staffId!: Uuid;
}
