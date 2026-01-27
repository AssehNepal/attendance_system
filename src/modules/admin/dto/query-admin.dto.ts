import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../../common/dto/page-options.dto';

export class QueryAdminDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description:
      'Search by CID number (returns all matching admins starting with this value)',
  })
  @IsString()
  @IsOptional()
  cidNo?: string;

  @ApiPropertyOptional({
    description: 'Filter by office location ID (single UUID)',
  })
  @IsString()
  @IsOptional()
  officeLocationId?: string;

  @ApiPropertyOptional({
    description: 'Filter by agency ID',
  })
  @IsString()
  @IsOptional()
  agencyId?: string;
}
