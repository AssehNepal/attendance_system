import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class FilterAdminRoleDto {
  @ApiPropertyOptional({ description: 'Filter by Admin ID' })
  @IsUUID()
  @IsOptional()
  adminId?: Uuid;

  @ApiPropertyOptional({ description: 'Filter by Role ID' })
  @IsUUID()
  @IsOptional()
  roleId?: Uuid;
}
