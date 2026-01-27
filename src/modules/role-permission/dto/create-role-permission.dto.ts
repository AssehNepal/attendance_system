import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRolePermissionDto {
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'Role ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  roleId!: string;

  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'Permission ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  @IsNotEmpty()
  permissionId!: string;
}
