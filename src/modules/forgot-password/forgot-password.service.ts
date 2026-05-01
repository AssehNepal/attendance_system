import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { validateHash } from '../../common/utils';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { EmailService } from '../../shared/services/email.service';
import { GeneratorService } from '../../shared/services/generator.service';
import { Admin } from '../admin/entities/admin.entity';
import { CreateForgotPasswordDto } from './dto/create-forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetOtp } from './entities/password-reset-otp.entity';

@Injectable()
export class ForgotPasswordService {
  private readonly logger = new Logger(ForgotPasswordService.name);

  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(PasswordResetOtp)
    private readonly otpRepository: Repository<PasswordResetOtp>,
    private readonly generatorService: GeneratorService,
    private readonly emailService: EmailService,
    private readonly configService: ApiConfigService,
  ) {}

  async sendOtp(dto: CreateForgotPasswordDto) {
    const { cidNo, email, mobileNo } = dto;

    if (!cidNo && !email && !mobileNo) {
      throw new BadRequestException(
        'At least one identifier (CID, Email, or Mobile No) must be provided',
      );
    }

    const admin = await this.adminRepository.findOne({
      where: [
        ...(cidNo ? [{ cidNo }] : []),
        ...(email ? [{ email }] : []),
        ...(mobileNo ? [{ mobileNo }] : []),
      ],
    });

    if (!admin) {
      this.logger.warn(
        `OTP requested for non-existent admin: ${cidNo || email || mobileNo}`,
      );
      throw new NotFoundException('Admin not found');
    }

    const targetEmail = email || admin.email;
    if (!targetEmail) {
      throw new BadRequestException(
        'Admin does not have an email address configured',
      );
    }

    const rawOtp = this.generatorService.generateSixDigitToken();
    const hashedOtp = bcrypt.hashSync(rawOtp, 10);

    const expiryMinutes = this.configService.otpConfig.expirationMinutes;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Clean up old OTPs for this admin
    await this.otpRepository.delete({ adminId: admin.id });

    // Save new OTP with provided details
    await this.otpRepository.save({
      adminId: admin.id,
      otp: hashedOtp,
      expiresAt,
      email: email || admin.email,
      mobileNo: mobileNo || admin.mobileNo,
    });

    // Send email
    await this.emailService.sendPasswordResetToken(targetEmail, rawOtp);

    return {
      message: 'Password reset OTP has been sent to your email',
    };
  }

  async verifyOtp(cidOrEmailOrMobile: string, otp: string) {
    const admin = await this.adminRepository.findOne({
      where: [
        { cidNo: cidOrEmailOrMobile },
        { email: cidOrEmailOrMobile },
        { mobileNo: cidOrEmailOrMobile },
      ],
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const otpEntity = await this.otpRepository.findOne({
      where: { adminId: admin.id },
    });

    if (!otpEntity) {
      throw new BadRequestException('No OTP found');
    }

    if (otpEntity.expiresAt < new Date()) {
      await this.otpRepository.remove(otpEntity);
      throw new BadRequestException('OTP has expired');
    }

    const isValid = await validateHash(otp, otpEntity.otp);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }

    return {
      message: 'OTP verified successfully',
      valid: true,
    };
  }

  async resetPassword(otp: string, dto: ResetPasswordDto) {
    const { cidOrEmailOrMobile, newPassword, confirmPassword } = dto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const admin = await this.adminRepository.findOne({
      where: [
        { cidNo: cidOrEmailOrMobile },
        { email: cidOrEmailOrMobile },
        { mobileNo: cidOrEmailOrMobile },
      ],
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const otpEntity = await this.otpRepository.findOne({
      where: { adminId: admin.id },
    });

    if (!otpEntity) {
      throw new BadRequestException('No OTP found');
    }

    if (otpEntity.expiresAt < new Date()) {
      await this.otpRepository.remove(otpEntity);
      throw new BadRequestException('OTP has expired');
    }

    const isValid = await validateHash(otp, otpEntity.otp);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }

    // Update password
    const hashedPassword = bcrypt.hashSync(newPassword, 12);
    admin.password = hashedPassword;
    await this.adminRepository.save(admin);

    // Clean up OTP
    await this.otpRepository.remove(otpEntity);

    return {
      message: 'Password has been reset successfully',
    };
  }
}
