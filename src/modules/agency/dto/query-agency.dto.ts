import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../../common/dto/page-options.dto';

export class QueryAgencyDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Search by agency name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Search by agency code' })
  @IsString()
  @IsOptional()
  code?: string;
}
