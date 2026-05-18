import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { AuthUser } from '../../decorators/auth-user.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { CreateForgotPasswordDto } from './dto/create-forgot-password.dto';
import { ResetPasswordAuthDto } from './dto/reset-password-auth.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordService } from './forgot-password.service';

@ApiTags('Forgot Password')
@Controller('forgot-password')
export class ForgotPasswordController {
  constructor(private readonly forgotPasswordService: ForgotPasswordService) {}

  // ── Public (email in body) ──

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP via email (public)' })
  @ApiOkResponse({ description: 'OTP sent to your registered email' })
  async requestOtp(@Body() dto: CreateForgotPasswordDto) {
    return this.forgotPasswordService.sendOtp(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using email + OTP (public)' })
  @ApiOkResponse({ description: 'Password reset successfully' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.forgotPasswordService.verifyOtpAndResetPassword(dto);
  }

  // ── Authenticated (email from session) ──

  @Post('request-otp/me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard())
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Request OTP using logged-in session email (authenticated)',
  })
  @ApiOkResponse({ description: 'OTP sent to your registered email' })
  async requestOtpAuth(@AuthUser() user: any) {
    return this.forgotPasswordService.sendOtpBySession(user);
  }

  @Post('reset-password/me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard())
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reset password using OTP (authenticated, no email needed)',
  })
  @ApiOkResponse({ description: 'Password reset successfully' })
  async resetPasswordAuth(
    @Body() dto: ResetPasswordAuthDto,
    @AuthUser() user: any,
  ) {
    return this.forgotPasswordService.verifyOtpAndResetPasswordBySession(
      user,
      dto.otp,
      dto.newPassword,
    );
  }
}
