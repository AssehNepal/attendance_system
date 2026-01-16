import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiCreatedResponse } from '@nestjs/swagger';
import type { Request } from 'express';

import { Roles } from '../../decorators/roles.decorator';
import { RequirePermission } from '../../decorators/permission.decorator';
import { RoleType } from '../../constants/role-type';
import { AuthService } from './services/auth.service';
import type { LoginResponse } from './services/auth.service';
import { UserLoginDto } from './dto/user-login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminCreatedResponseDto } from './dto/admin-created-response.dto';
import { PublicRoute } from '../../decorators/public-route.decorator.ts';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('citizen/login')
  @HttpCode(HttpStatus.OK)
  @PublicRoute()
  @ApiOkResponse({
    type: LoginResponseDto,
    description: 'Citizen login - auto-creates user on first login',
  })
  async citizenLogin(
    @Body() userLoginDto: UserLoginDto,
    @Req() req: Request,
  ): Promise<LoginResponse> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.loginCitizen(userLoginDto, ipAddress, userAgent);
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @PublicRoute()
  @ApiOkResponse({
    type: LoginResponseDto,
    description: 'Admin/Super Admin login - requires pre-registration',
  })
  async adminLogin(
    @Body() adminLoginDto: AdminLoginDto,
    @Req() req: Request,
  ): Promise<LoginResponse> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.loginAdmin(adminLoginDto, ipAddress, userAgent);
  }

  @Post('admin/create')
  @HttpCode(HttpStatus.CREATED)
  @Roles([RoleType.ADMIN, RoleType.SUPER_ADMIN])
  @RequirePermission('create', 'Admin')
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

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @PublicRoute()
  @ApiOkResponse({
    description:
      'Refresh access token using refresh token (with automatic rotation)',
  })
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
    @Req() req: Request,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.refreshAccessToken(
      refreshToken,
      ipAddress,
      userAgent,
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @PublicRoute()
  @ApiOkResponse({
    description: 'Logout (revoke refresh token)',
  })
  async logout(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ message: string }> {
    await this.authService.logout(refreshToken);
    return { message: 'Logged out successfully' };
  }
}
