import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  BooleanFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators';

export class CreateOfficeDto {
  @ApiProperty({
    example: 'Thimphu District Office',
    description: 'Unique office name',
  })
  @StringField({ maxLength: 200 })
  name!: string;

  @ApiProperty({
    example: 'THM',
    description: 'Unique dzongkhag code (2-20 chars)',
  })
  @StringField({ maxLength: 20 })
  dzongkhagCode!: string;

  @ApiPropertyOptional({
    example: 'thimphu.gov.bt',
    description: 'Allowed email domain for staff (optional)',
  })
  @StringFieldOptional({ maxLength: 100 })
  emailDomain?: string;

  @ApiPropertyOptional({
    example: '09:00',
    description: 'Office opening time in HH:MM format',
  })
  @StringFieldOptional({ maxLength: 10 })
  officeStartTime?: string;

  @ApiPropertyOptional({
    example: '17:00',
    description: 'Office closing time in HH:MM format',
  })
  @StringFieldOptional({ maxLength: 10 })
  officeEndTime?: string;

  @ApiPropertyOptional({
    example: '10:00',
    description: 'Time after which staff is marked absent (HH:MM)',
  })
  @StringFieldOptional({ maxLength: 10 })
  absenceCutoffTime?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this office is currently active',
  })
  @BooleanFieldOptional()
  isActive?: boolean;
}
