import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { AuthService } from './services/auth.service';
import type { LoginResponse } from './services/auth.service';
import { UserLoginDto } from './dto/user-login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
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
