import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateAdminRoleDto {
  @ApiProperty({ description: 'Admin ID' })
  @IsUUID()
  @IsNotEmpty()
  adminId!: Uuid;

  @ApiProperty({ description: 'Role ID' })
  @IsUUID()
  @IsNotEmpty()
  roleId!: Uuid;
}
