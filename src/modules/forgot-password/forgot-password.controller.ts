import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublicRoute } from '../../decorators/public-route.decorator';
import { CreateForgotPasswordDto } from './dto/create-forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordService } from './forgot-password.service';

@ApiTags('forgot-password')
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

  @Post('verify-otp/:cidOrEmailOrMobile/:otp')
  @PublicRoute()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify reset OTP' })
  @ApiOkResponse({ description: 'OTP validation result' })
  async verifyOtp(
    @Param('cidOrEmailOrMobile') cidOrEmailOrMobile: string,
    @Param('otp') otp: string,
  ) {
    return this.forgotPasswordService.verifyOtp(cidOrEmailOrMobile, otp);
  }

  @Post('reset-password/:otp')
  @PublicRoute()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using OTP' })
  @ApiOkResponse({ description: 'Password reset result' })
  async resetPassword(
    @Param('otp') otp: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.forgotPasswordService.resetPassword(otp, dto);
  }
}
