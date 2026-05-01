import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PageOptionsDto } from '../../../common/dto/page-options.dto';

export class QueryUserDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description:
      'Search by CID number (returns all matching users starting with this value)',
  })
  @IsString()
  @IsOptional()
  cidNo?: string;
}
