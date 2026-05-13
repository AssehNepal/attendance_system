import { ApiPropertyOptional } from '@nestjs/swagger';

import {
  BooleanFieldOptional,
  StringFieldOptional,
} from '../../../decorators/field.decorators';

export class UpdateOfficeDto {
  @ApiPropertyOptional({ example: 'Thimphu District Office' })
  @StringFieldOptional({ maxLength: 200 })
  name?: string;

  @ApiPropertyOptional({ example: 'THM' })
  @StringFieldOptional({ maxLength: 20 })
  dzongkhagCode?: string;

  @ApiPropertyOptional({ example: 'thimphu.gov.bt' })
  @StringFieldOptional({ maxLength: 100 })
  emailDomain?: string;

  @ApiPropertyOptional({ example: '09:00' })
  @StringFieldOptional({ maxLength: 10 })
  officeStartTime?: string;

  @ApiPropertyOptional({ example: '17:00' })
  @StringFieldOptional({ maxLength: 10 })
  officeEndTime?: string;

  @ApiPropertyOptional({ example: '10:00' })
  @StringFieldOptional({ maxLength: 10 })
  absenceCutoffTime?: string;

  @ApiPropertyOptional({ example: true })
  @BooleanFieldOptional()
  isActive?: boolean;
}
