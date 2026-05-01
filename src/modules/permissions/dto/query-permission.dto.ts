import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PageOptionsDto } from '../../../common/dto/page-options.dto';

export class QueryPermissionDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Search by permission name' })
  @IsString()
  @IsOptional()
  name?: string;
}
