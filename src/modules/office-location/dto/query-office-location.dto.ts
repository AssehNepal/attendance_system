import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../../common/dto/page-options.dto';

export class QueryOfficeLocationDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Search by office location name' })
  @IsString()
  @IsOptional()
  name?: string;
}
