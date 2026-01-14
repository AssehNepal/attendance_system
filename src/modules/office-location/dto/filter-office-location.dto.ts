import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterOfficeLocationDto {
  @ApiPropertyOptional({ description: 'Filter by office location name (partial match)' })
  @IsString()
  @IsOptional()
  name?: string;
}
