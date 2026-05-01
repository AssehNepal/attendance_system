import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class FilterUserDto {
  @ApiPropertyOptional({
    description: 'Filter by role type (CITIZEN, ADMIN, etc.)',
  })
  @IsString()
  @IsOptional()
  roleType?: string;

  @ApiPropertyOptional({ description: 'Filter by password existence' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasPassword?: boolean;

  @ApiPropertyOptional({
    description:
      'Search by CID number or user ID (partial match, case-insensitive)',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
