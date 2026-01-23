import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateAdminRoleDto {
  @ApiProperty({
    description: 'Admin ID',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  adminId?: Uuid;

  @ApiProperty({
    description: 'Role ID',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  roleId?: Uuid;
}
