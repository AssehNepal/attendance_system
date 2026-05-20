import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

import {
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators';

export class CreateLeaveRequestDto {
  staffId!: Uuid;

  @StringField({ maxLength: 10 })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'leaveFrom must be YYYY-MM-DD' })
  @ApiProperty({ example: '2026-05-20' })
  leaveFrom!: string;

  @StringField({ maxLength: 10 })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'leaveTo must be YYYY-MM-DD' })
  @ApiProperty({ example: '2026-05-22' })
  leaveTo!: string;

  @StringField({ maxLength: 50 })
  @ApiProperty({
    example: 'casual',
    enum: ['casual', 'earned', 'medical', 'maternity', 'special'],
  })
  leaveType!: 'casual' | 'earned' | 'medical' | 'maternity' | 'special';

  @StringFieldOptional()
  @ApiProperty({ example: 'Family function', required: false })
  reason?: string;
}
