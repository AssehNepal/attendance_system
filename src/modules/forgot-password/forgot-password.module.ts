import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Admin } from '../admin/entities/admin.entity';
import { PasswordResetOtp } from './entities/password-reset-otp.entity';
import { ForgotPasswordController } from './forgot-password.controller';
import { ForgotPasswordService } from './forgot-password.service';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, PasswordResetOtp])],
  controllers: [ForgotPasswordController],
  providers: [ForgotPasswordService],
  exports: [ForgotPasswordService],
})
export class ForgotPasswordModule {}
