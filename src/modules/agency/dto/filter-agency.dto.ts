import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterAgencyDto {
  @ApiPropertyOptional({ description: 'Filter by agency name (partial match)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Filter by agency code' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Filter by description' })
  @IsString()
  @IsOptional()
  description?: string;
}
