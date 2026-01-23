import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateRolePermissionDto {
  @ApiProperty({
    description: 'Role ID',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  roleId?: Uuid;

  @ApiProperty({
    description: 'Permission ID',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  permissionId?: Uuid;
}
