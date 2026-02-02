import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterPermissionDto {
  @ApiPropertyOptional({
    description: 'Filter by permission name (partial match)',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by permission description (partial match)',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Filter by action (e.g., create, read, update, delete)',
  })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiPropertyOptional({
    description: 'Filter by subject (e.g., Permission, Role, Admin)',
  })
  @IsString()
  @IsOptional()
  subject?: string;
}
