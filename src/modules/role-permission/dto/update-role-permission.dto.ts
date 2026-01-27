import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRolePermissionDto {
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'Role ID',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  roleId?: string;

  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'Permission ID',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  @IsOptional()
  permissionId?: string;
}
