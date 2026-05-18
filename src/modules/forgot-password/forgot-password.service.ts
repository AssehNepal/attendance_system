import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { EmailService } from '../../shared/services/email.service';
import { GeneratorService } from '../../shared/services/generator.service';
import { Admin } from '../admins/entities/admin.entity';
import { Staff } from '../staff/entities/staff.entity';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Otp } from './entities/otp.entity';

@Injectable()
export class ForgotPasswordService {
  private readonly logger = new Logger(ForgotPasswordService.name);

  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    private readonly generatorService: GeneratorService,
    private readonly emailService: EmailService,
  ) {}

  async sendOtp(email: string) {
    if (!email) {
      throw new BadRequestException('Email must be provided');
    }

    // Check admin first, then staff
    let userId: Uuid;
    let userType: 'admin' | 'staff';

    const admin = await this.adminRepository.findOne({ where: { email } });

    if (admin) {
      userId = admin.id;
      userType = 'admin';
    } else {
      const staff = await this.staffRepository.findOne({ where: { email } });

      if (!staff) {
        throw new NotFoundException('No account found with this email');
      }

      userId = staff.id;
      userType = 'staff';
    }

    const rawOtp = this.generatorService.generateSixDigitToken();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Remove any existing OTP for this user
    await this.otpRepository.delete({ userId });

    await this.otpRepository.save({
      userId,
      userType,
      otp: rawOtp,
      email,
      expiresAt,
    });

    await this.emailService.sendPasswordResetToken(email, rawOtp);

    this.logger.log(`OTP sent to ${email} (userType: ${userType})`);
    return { message: 'OTP sent successfully to your registered email' };
  }

  async verifyOtpAndResetPassword(dto: ResetPasswordDto) {
    const { email, otp, newPassword } = dto;

    // Find user by email across admin and staff
    let userId: Uuid;
    let userType: 'admin' | 'staff';

    const admin = await this.adminRepository.findOne({ where: { email } });

    if (admin) {
      userId = admin.id;
      userType = 'admin';
    } else {
      const staff = await this.staffRepository.findOne({ where: { email } });

      if (!staff)
        throw new NotFoundException('No account found with this email');

      userId = staff.id;
      userType = 'staff';
    }

    const otpRecord = await this.otpRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    if (otpRecord.expiresAt < new Date()) {
      await this.otpRepository.delete({ userId });
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    if (otp !== otpRecord.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (userType === 'staff') {
      const staff = await this.staffRepository.findOne({
        where: { id: userId },
      });
      if (!staff) throw new NotFoundException('Staff not found');
      staff.password = hashedPassword;
      await this.staffRepository.save(staff);
    } else {
      const adminUser = await this.adminRepository.findOne({
        where: { id: userId },
      });
      if (!adminUser) throw new NotFoundException('Admin not found');
      adminUser.passwordHash = hashedPassword;
      await this.adminRepository.save(adminUser);
    }

    await this.otpRepository.delete({ userId });

    return { message: 'Password reset successfully' };
  }

  // ── Authenticated versions (email from session) ──

  async sendOtpBySession(sessionUser: {
    id: Uuid;
    email: string;
    userType: string;
  }) {
    if (!sessionUser.email) {
      throw new BadRequestException('No email associated with your account');
    }

    return this.sendOtp(sessionUser.email);
  }

  async verifyOtpAndResetPasswordBySession(
    sessionUser: { id: Uuid; userType: string },
    otp: string,
    newPassword: string,
  ) {
    const { id: userId, userType } = sessionUser;

    const otpRecord = await this.otpRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    if (otpRecord.expiresAt < new Date()) {
      await this.otpRepository.delete({ userId });
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    if (otp !== otpRecord.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (userType === 'staff') {
      const staff = await this.staffRepository.findOne({
        where: { id: userId },
      });
      if (!staff) throw new NotFoundException('Staff not found');
      staff.password = hashedPassword;
      await this.staffRepository.save(staff);
    } else {
      const adminUser = await this.adminRepository.findOne({
        where: { id: userId },
      });
      if (!adminUser) throw new NotFoundException('Admin not found');
      adminUser.passwordHash = hashedPassword;
      await this.adminRepository.save(adminUser);
    }

    await this.otpRepository.delete({ userId });

    return { message: 'Password reset successfully' };
  }
}
