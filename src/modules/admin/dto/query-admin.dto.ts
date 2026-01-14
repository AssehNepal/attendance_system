import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PageOptionsDto } from '../../../common/dto/page-options.dto';

export class QueryAdminDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Search by CID number' })
  @IsString()
  @IsOptional()
  cidNo?: string;

  @ApiPropertyOptional({ description: 'Filter by office location ID' })
  @IsUUID()
  @IsOptional()
  officeLocationId?: Uuid;

  @ApiPropertyOptional({ description: 'Filter by agency ID' })
  @IsString()
  @IsOptional()
  agencyId?: string;
}
