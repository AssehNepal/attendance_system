import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { ApiConfigService } from '../../shared/services/api-config.service';
import { EmailService } from '../../shared/services/email.service';
import { GeneratorService } from '../../shared/services/generator.service';
import { Admin } from '../admins/entities/admin.entity';
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
    const { email } = dto;

    if (!email) {
      throw new BadRequestException('Email must be provided');
    }

    const admin = await this.adminRepository.findOne({
      where: { email },
    });

    if (!admin) {
      this.logger.warn(`OTP requested for non-existent admin: ${email}`);
      throw new NotFoundException('Admin not found');
    }

    const rawOtp = this.generatorService.generateSixDigitToken();
    const hashedOtp = bcrypt.hashSync(rawOtp, 10);

    const expiryMinutes = this.configService.otpConfig.expirationMinutes;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await this.otpRepository.delete({ adminId: admin.id });

    await this.otpRepository.save({
      adminId: admin.id,
      otp: hashedOtp,
      expiresAt,
      email: admin.email,
    });

    await this.emailService.sendPasswordResetToken(admin.email, rawOtp);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtpAndResetPassword(dto: ResetPasswordDto) {
    const { email, otp, newPassword } = dto;

    const admin = await this.adminRepository.findOne({
      where: { email },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const otpRecord = await this.otpRepository.findOne({
      where: { adminId: admin.id },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    if (otpRecord.expiresAt < new Date()) {
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    const isValid = bcrypt.compareSync(otp, otpRecord.otp);

    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }

    admin.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.adminRepository.save(admin);

    await this.otpRepository.delete({ adminId: admin.id });

    return { message: 'Password reset successfully' };
  }
}
