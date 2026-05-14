import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import type { Request } from 'express';

import { PublicRoute } from '../../decorators/public-route.decorator';
import { AuthService } from './auth.service';

class AdminLoginDto {
  @ApiProperty({ example: 'admin@example.com', description: 'Admin email' })
  @IsString()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'P@ssw0rd123', description: 'Admin password' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

class StaffLoginDto {
  @ApiProperty({ example: '11501000001', description: 'Staff CID number' })
  @IsString()
  @IsNotEmpty()
  cidNo!: string;

  @ApiProperty({ example: 'P@ssw0rd123', description: 'Staff password' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

class RefreshTokenRequestDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6...hex-encoded-refresh-token',
    description: 'Refresh token received from login',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

class UserResponseDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  id!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ example: 'admin@example.com', required: false })
  email?: string;

  @ApiProperty({ example: 'super_admin' })
  role!: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: false,
  })
  officeId?: string;

  @ApiProperty({ example: 'EMP-001', required: false })
  employeeId?: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: false,
  })
  departmentId?: string;
}

class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ example: 'a1b2c3d4e5f6...hex-encoded-refresh-token' })
  refreshToken!: string;

  @ApiProperty({ example: 3600 })
  expiresIn!: number;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}

class RefreshResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ example: 'a1b2c3d4e5f6...hex-encoded-refresh-token' })
  refreshToken!: string;

  @ApiProperty({ example: 3600 })
  expiresIn!: number;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;
}

class LogoutResponseDto {
  @ApiProperty({ example: 'Logged out successfully' })
  message!: string;
}

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @PublicRoute()
  @ApiOperation({ summary: 'Admin login with email & password' })
  @ApiBody({ type: AdminLoginDto })
  @ApiOkResponse({ type: LoginResponseDto, description: 'Login successful' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async adminLogin(@Body() dto: AdminLoginDto, @Req() req: Request) {
    return this.authService.adminLogin(
      dto.email,
      dto.password,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('staff/login')
  @HttpCode(HttpStatus.OK)
  @PublicRoute()
  @ApiOperation({ summary: 'Staff login with CID number & password' })
  @ApiBody({ type: StaffLoginDto })
  @ApiOkResponse({ type: LoginResponseDto, description: 'Login successful' })
  @ApiUnauthorizedResponse({
    description: 'Invalid CID number or password',
  })
  async staffLogin(@Body() dto: StaffLoginDto, @Req() req: Request) {
    return this.authService.staffLogin(
      dto.cidNo,
      dto.password,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @PublicRoute()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenRequestDto })
  @ApiOkResponse({
    type: RefreshResponseDto,
    description: 'Token refreshed successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
  })
  async refresh(@Body() dto: RefreshTokenRequestDto, @Req() req: Request) {
    return this.authService.refreshAccessToken(
      dto.refreshToken,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke refresh token' })
  @ApiBody({ type: RefreshTokenRequestDto })
  @ApiOkResponse({
    type: LogoutResponseDto,
    description: 'Logged out successfully',
  })
  async logout(@Body() dto: RefreshTokenRequestDto) {
    await this.authService.revokeRefreshToken(dto.refreshToken);

    return { message: 'Logged out successfully' };
  }
}
