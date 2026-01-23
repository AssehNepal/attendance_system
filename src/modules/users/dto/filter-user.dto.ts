import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

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
