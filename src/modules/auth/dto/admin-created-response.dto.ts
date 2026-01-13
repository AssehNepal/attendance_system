import { ApiProperty } from '@nestjs/swagger';

class OfficeLocationDto {
  @ApiProperty({ example: 'uuid-office-1' })
  id!: string;

  @ApiProperty({ example: 'Thimphu Regional Office' })
  name!: string;
}

class RoleDto {
  @ApiProperty({ example: 'uuid-role-1' })
  id!: string;

  @ApiProperty({ example: 'Admin' })
  name!: string;

  @ApiProperty({ example: 'System administrator role' })
  description?: string;
}

class PermissionDto {
  @ApiProperty({ example: 'uuid-permission-1' })
  id!: string;

  @ApiProperty({ example: 'user_management' })
  name!: string;

  @ApiProperty({ example: 'Manage system users' })
  description?: string;

  @ApiProperty({ example: ['create', 'read', 'update', 'delete'] })
  actions!: string[];

  @ApiProperty({ example: ['User'] })
  subjects!: string[];
}

class AdminDto {
  @ApiProperty({ example: 'uuid-admin-1' })
  id!: string;

  @ApiProperty({ example: '11111111111111' })
  cidNo!: string;

  @ApiProperty({ example: 'ADMIN' })
  roleType!: string;

  @ApiProperty({ example: 'admin@example.com' })
  email!: string;

  @ApiProperty({ example: '17123456' })
  mobileNo!: string;

  @ApiProperty({ example: 'NSB' })
  agencyId!: string;

  @ApiProperty({ type: () => OfficeLocationDto })
  officeLocation!: OfficeLocationDto;

  @ApiProperty({ example: '2026-01-13T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-01-13T12:00:00.000Z' })
  updatedAt!: Date;
}

export class AdminCreatedResponseDto {
  @ApiProperty({ example: 'Admin user created successfully' })
  message!: string;

  @ApiProperty({ type: () => AdminDto })
  admin!: AdminDto;

  @ApiProperty({ type: [RoleDto] })
  assignedRoles!: RoleDto[];

  @ApiProperty({ type: [PermissionDto] })
  effectivePermissions!: PermissionDto[];
}
