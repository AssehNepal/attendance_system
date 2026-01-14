import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateRolePermissionDto {
  @ApiProperty({ description: 'Role ID' })
  @IsUUID()
  @IsNotEmpty()
  roleId!: Uuid;

  @ApiProperty({ description: 'Permission ID' })
  @IsUUID()
  @IsNotEmpty()
  permissionId!: Uuid;
}
