import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class FilterRoleDto {
  @ApiPropertyOptional({ description: 'Filter by role name (partial match)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Filter by description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Has permissions assigned' })
  @IsBoolean()
  @IsOptional()
  hasPermissions?: boolean;
}
