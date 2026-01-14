import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class FilterRolePermissionDto {
  @ApiPropertyOptional({ description: 'Filter by Role ID' })
  @IsUUID()
  @IsOptional()
  roleId?: Uuid;

  @ApiPropertyOptional({ description: 'Filter by Permission ID' })
  @IsUUID()
  @IsOptional()
  permissionId?: Uuid;
}
