import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiCreatedResponse } from '@nestjs/swagger';

import { AuthService } from './services/auth.service';
import type { LoginResponse } from './services/auth.service';
import { UserLoginDto } from './dto/user-login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminCreatedResponseDto } from './dto/admin-created-response.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('citizen/login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: LoginResponseDto,
    description: 'Citizen login - auto-creates user on first login',
  })
  async citizenLogin(
    @Body() userLoginDto: UserLoginDto,
  ): Promise<LoginResponse> {
    return this.authService.loginCitizen(userLoginDto);
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: LoginResponseDto,
    description: 'Admin/Super Admin login - requires pre-registration',
  })
  async adminLogin(
    @Body() adminLoginDto: AdminLoginDto,
  ): Promise<LoginResponse> {
    return this.authService.loginAdmin(adminLoginDto);
  }

  @Post('admin/create')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    type: AdminCreatedResponseDto,
    description: 'Create a new admin user with roles and permissions',
  })
  async createAdmin(
    @Body() createAdminDto: CreateAdminDto,
  ): Promise<AdminCreatedResponseDto> {
    const result = await this.authService.createAdmin(createAdminDto);

    // Load office location details
    const adminWithOffice = await this.authService['adminRepository'].findOne({
      where: { id: result.admin.id as any },
      relations: ['officeLocation'],
    });

    return {
      message: 'Admin user created successfully',
      admin: {
        id: result.admin.id,
        cidNo: result.admin.cidNo,
        roleType: result.admin.roleType,
        email: result.admin.email!,
        mobileNo: result.admin.mobileNo!,
        agencyId: result.admin.agencyId!,
        officeLocation: {
          id: adminWithOffice?.officeLocation?.id || '',
          name: adminWithOffice?.officeLocation?.name || '',
        },
        createdAt: result.admin.createdAt,
        updatedAt: result.admin.updatedAt,
      },
      assignedRoles: result.assignedRoles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
      })),
      effectivePermissions: result.effectivePermissions.map((perm) => ({
        id: perm.id,
        name: perm.name,
        description: perm.description,
        actions: perm.actions,
        subjects: perm.subjects,
      })),
    };
  }
}
