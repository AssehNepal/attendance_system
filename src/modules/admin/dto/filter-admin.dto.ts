import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class FilterAdminDto {
  @ApiPropertyOptional({ description: 'Filter by CID number (partial match)' })
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

  @ApiPropertyOptional({ description: 'Filter by email' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Filter by mobile number' })
  @IsString()
  @IsOptional()
  mobileNo?: string;
}
