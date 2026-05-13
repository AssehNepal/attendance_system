import { randomBytes } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { TokenType } from '../../constants/token-type';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { Admin } from '../admins/entities/admin.entity';
import { Staff } from '../staff/entities/staff.entity';
import { RefreshToken } from './entities/refresh-token.entity';

interface JwtPayload {
  sub: Uuid;
  email?: string;
  role: string;
  type: TokenType;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
    @InjectRepository(Staff)
    private readonly staffRepo: Repository<Staff>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ApiConfigService,
  ) {}

  // ── Admin Login ──

  async adminLogin(
    email: string,
    password: string,
    ip?: string,
    userAgent?: string,
  ) {
    const admin = await this.adminRepo.findOne({ where: { email } });

    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    admin.lastLoginAt = new Date();
    await this.adminRepo.save(admin);

    const payload: JwtPayload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      type: TokenType.ACCESS_TOKEN,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.authConfig.jwtExpirationTime,
    });

    const refreshToken = await this.createRefreshToken(
      { adminId: admin.id },
      ip,
      userAgent,
    );

    return {
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: this.configService.authConfig.jwtExpirationTime,
      tokenType: 'Bearer',
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        officeId: admin.officeId,
      },
    };
  }

  // ── Staff Login ──

  async staffLogin(
    employeeId: string,
    password: string,
    ip?: string,
    userAgent?: string,
  ) {
    const staff = await this.staffRepo.findOne({ where: { employeeId } });

    if (
      !staff ||
      !staff.passwordHash ||
      !(await bcrypt.compare(password, staff.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid employee ID or password');
    }

    staff.lastLoginAt = new Date();
    await this.staffRepo.save(staff);

    const payload: JwtPayload = {
      sub: staff.id,
      email: staff.email,
      role: 'employee',
      type: TokenType.ACCESS_TOKEN,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.authConfig.jwtExpirationTime,
    });

    const refreshToken = await this.createRefreshToken(
      { staffId: staff.id },
      ip,
      userAgent,
    );

    return {
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: this.configService.authConfig.jwtExpirationTime,
      tokenType: 'Bearer',
      user: {
        id: staff.id,
        name: staff.name,
        employeeId: staff.employeeId,
        role: 'employee',
        officeId: staff.officeId,
        departmentId: staff.departmentId,
      },
    };
  }

  // ── Refresh Token ──

  async refreshAccessToken(token: string, ip?: string, userAgent?: string) {
    const existing = await this.refreshTokenRepo.findOne({
      where: { token, isRevoked: false },
    });

    if (!existing || existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old token
    existing.isRevoked = true;
    await this.refreshTokenRepo.save(existing);

    // Determine user
    let payload: JwtPayload;
    const ownerKey: { adminId?: Uuid; staffId?: Uuid } = {};

    if (existing.adminId) {
      const admin = await this.adminRepo.findOne({
        where: { id: existing.adminId },
      });

      if (!admin) throw new UnauthorizedException('Admin not found');

      payload = {
        sub: admin.id,
        email: admin.email,
        role: admin.role,
        type: TokenType.ACCESS_TOKEN,
      };
      ownerKey.adminId = admin.id;
    } else if (existing.staffId) {
      const staff = await this.staffRepo.findOne({
        where: { id: existing.staffId },
      });

      if (!staff) throw new UnauthorizedException('Staff not found');

      payload = {
        sub: staff.id,
        email: staff.email,
        role: 'employee',
        type: TokenType.ACCESS_TOKEN,
      };
      ownerKey.staffId = staff.id;
    } else {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.authConfig.jwtExpirationTime,
    });

    const newRefreshToken = await this.createRefreshToken(
      ownerKey,
      ip,
      userAgent,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken.token,
      expiresIn: this.configService.authConfig.jwtExpirationTime,
      tokenType: 'Bearer',
    };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const existing = await this.refreshTokenRepo.findOne({
      where: { token },
    });

    if (existing) {
      existing.isRevoked = true;
      await this.refreshTokenRepo.save(existing);
    }
  }

  // ── Helpers ──

  private async createRefreshToken(
    owner: { adminId?: Uuid; staffId?: Uuid },
    ip?: string,
    userAgent?: string,
  ): Promise<RefreshToken> {
    const token = randomBytes(64).toString('hex');
    const expiresAt = new Date(
      Date.now() +
        this.configService.authConfig.jwtRefreshExpirationTime * 1000,
    );

    const refreshToken = this.refreshTokenRepo.create({
      token,
      ...owner,
      expiresAt,
      ipAddress: ip,
      userAgent,
    });

    return this.refreshTokenRepo.save(refreshToken);
  }
}
