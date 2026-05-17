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

  async sendOtp(sessionUser: { id: Uuid; email: string; userType: string }) {
    const { id, email, userType } = sessionUser;

    if (!email) {
      throw new BadRequestException('No email associated with your account');
    }

    // Verify the user still exists
    if (userType === 'staff') {
      const staff = await this.staffRepository.findOne({ where: { id } });
      if (!staff) throw new NotFoundException('Staff not found');
    } else {
      const admin = await this.adminRepository.findOne({ where: { id } });
      if (!admin) throw new NotFoundException('Admin not found');
    }

    const rawOtp = this.generatorService.generateSixDigitToken();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Remove any existing OTP for this user
    await this.otpRepository.delete({ userId: id });

    await this.otpRepository.save({
      userId: id,
      userType: userType === 'staff' ? 'staff' : 'admin',
      otp: rawOtp,
      email,
      expiresAt,
    });

    await this.emailService.sendPasswordResetToken(email, rawOtp);

    this.logger.log(`OTP sent to ${email} (userType: ${userType})`);
    return { message: 'OTP sent successfully to your registered email' };
  }

  async verifyOtpAndResetPassword(
    sessionUser: { id: Uuid; userType: string },
    dto: ResetPasswordDto,
  ) {
    const { otp, newPassword } = dto;
    const { id, userType } = sessionUser;

    const otpRecord = await this.otpRepository.findOne({
      where: { userId: id },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    if (otpRecord.expiresAt < new Date()) {
      await this.otpRepository.delete({ userId: id });
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    const isValid = otp === otpRecord.otp;
    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (userType === 'staff') {
      const staff = await this.staffRepository.findOne({ where: { id } });
      if (!staff) throw new NotFoundException('Staff not found');
      staff.password = hashedPassword;
      await this.staffRepository.save(staff);
    } else {
      const admin = await this.adminRepository.findOne({ where: { id } });
      if (!admin) throw new NotFoundException('Admin not found');
      admin.passwordHash = hashedPassword;
      await this.adminRepository.save(admin);
    }

    await this.otpRepository.delete({ userId: id });

    return { message: 'Password reset successfully' };
  }
}
