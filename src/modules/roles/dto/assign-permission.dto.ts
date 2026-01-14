import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignPermissionDto {
  @ApiProperty({ description: 'Permission ID to assign' })
  @IsUUID()
  @IsNotEmpty()
  permissionId!: Uuid;
}
