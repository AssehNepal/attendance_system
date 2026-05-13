import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PublicRoute } from '../../decorators/public-route.decorator';
import { CreateForgotPasswordDto } from './dto/create-forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordService } from './forgot-password.service';

@ApiTags('Forgot Password')
@Controller('forgot-password')
export class ForgotPasswordController {
  constructor(private readonly forgotPasswordService: ForgotPasswordService) {}

  @Post('request-otp')
  @PublicRoute()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiOkResponse({ description: 'Reset OTP sent to email' })
  async requestOtp(@Body() dto: CreateForgotPasswordDto) {
    return this.forgotPasswordService.sendOtp(dto);
  }

  @Post('reset-password')
  @PublicRoute()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using OTP' })
  @ApiOkResponse({ description: 'Password reset result' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.forgotPasswordService.verifyOtpAndResetPassword(dto);
  }
}
