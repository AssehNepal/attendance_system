import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../../common/dto/page-options.dto';

export class QueryRoleDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Search by role name' })
  @IsString()
  @IsOptional()
  name?: string;
}
