import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PageOptionsDto } from '../../../common/dto/page-options.dto';

export class QueryRolePermissionDto extends PageOptionsDto {
  @ApiPropertyOptional({
    type: 'string',
    format: 'uuid',
    description: 'Filter by Role ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  roleId?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'uuid',
    description: 'Filter by Permission ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  @IsOptional()
  permissionId?: string;
}
