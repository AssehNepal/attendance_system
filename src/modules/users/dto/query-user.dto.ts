import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../../common/dto/page-options.dto';

export class QueryUserDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Search by CID number' })
  @IsString()
  @IsOptional()
  cidNo?: string;

  @ApiPropertyOptional({ description: 'Search by role type' })
  @IsString()
  @IsOptional()
  roleType?: string;
}
