import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';

import { TokenType } from '../../constants/token-type';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { Admin } from '../admins/entities/admin.entity';
import { Staff } from '../staff/entities/staff.entity';

interface JwtPayload {
  sub: Uuid;
  email: string;
  role: string;
  type: TokenType;
  officeId?: Uuid;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ApiConfigService,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.authConfig.privateKey,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    if (payload.type !== TokenType.ACCESS_TOKEN) {
      throw new UnauthorizedException('Invalid token type');
    }

    if (payload.role === 'admin' || payload.role === 'super_admin') {
      const admin = await this.adminRepository.findOne({
        where: { id: payload.sub },
      });

      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('Admin not found or deactivated');
      }

      return {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        officeId: admin.officeId,
        userType: admin.role,
      };
    }

    if (payload.role === 'employee') {
      const staff = await this.staffRepository.findOne({
        where: { id: payload.sub },
      });

      if (!staff || !staff.isActive) {
        throw new UnauthorizedException('Staff not found or deactivated');
      }

      return {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        employeeId: staff.employeeId,
        officeId: staff.officeId,
        departmentId: staff.departmentId,
        userType: 'staff',
      };
    }

    throw new UnauthorizedException('Invalid token');
  }
}
