import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';

import { TokenType } from '../../constants/token-type.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import { UsersService } from '../users/users.service.ts';
import { Admin } from './entities/admin.entity.ts';

interface JwtPayload {
  userId: Uuid;
  cidNo: string;
  roleType: 'CITIZEN' | 'ADMIN' | 'SUPER_ADMIN';
  type: TokenType;
  roles?: string[];
  permissions?: Array<{ actions: string[]; subjects: string[] }>;
  officeLocationId?: Uuid;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ApiConfigService,
    private usersService: UsersService,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.authConfig.publicKey,
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    // Verify token type
    if (payload.type !== TokenType.ACCESS_TOKEN) {
      throw new UnauthorizedException('Invalid token type');
    }

    // Handle CITIZEN users
    if (payload.roleType === 'CITIZEN') {
      const user = await this.usersService.findOne(payload.userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return {
        ...user,
        roleType: 'CITIZEN',
      };
    }

    // Handle ADMIN and SUPER_ADMIN users
    if (payload.roleType === 'ADMIN' || payload.roleType === 'SUPER_ADMIN') {
      const admin = await this.adminRepository.findOne({
        where: { id: payload.userId },
        relations: ['officeLocation', 'agency'],
      });

      if (!admin) {
        throw new UnauthorizedException('Admin not found');
      }

      // Build ability array from permissions
      const ability = payload.permissions
        ? payload.permissions.map((perm) => ({
            action: perm.actions.length === 1 ? perm.actions[0] : perm.actions,
            subject:
              perm.subjects.length === 1 ? perm.subjects[0] : perm.subjects,
          }))
        : [];

      return {
        id: admin.id,
        cidNo: admin.cidNo,
        roleType: payload.roleType,
        roles: payload.roles || [],
        ability, // This is used by PermissionsGuard
        officeLocationId: payload.officeLocationId,
        officeLocation: admin.officeLocation,
        agency: admin.agency,
      };
    }

    throw new UnauthorizedException('Invalid role type');
  }
}
