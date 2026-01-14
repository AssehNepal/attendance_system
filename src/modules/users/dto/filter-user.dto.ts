import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterUserDto {
  @ApiPropertyOptional({ description: 'Filter by CID number (partial match)' })
  @IsString()
  @IsOptional()
  cidNo?: string;

  @ApiPropertyOptional({ description: 'Filter by role type' })
  @IsString()
  @IsOptional()
  roleType?: string;

  @ApiPropertyOptional({ description: 'Has password set' })
  @IsOptional()
  hasPassword?: boolean;
}
