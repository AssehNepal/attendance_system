import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateAdminRoleDto {
  @ApiProperty({
    description: 'Admin ID',
    type: 'string',
    format: 'uuid',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  adminId?: string;

  @ApiProperty({
    description: 'Role ID',
    type: 'string',
    format: 'uuid',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  roleId?: string;
}
