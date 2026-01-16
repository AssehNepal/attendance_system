import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { RoleType } from '../constants/role-type.ts';
import type { UserEntity } from '../modules/users/entities/user.entity.ts';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<RoleType[] | undefined>(
      'roles',
      context.getHandler(),
    );

    // If no roles are required, allow access
    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: UserEntity }>();
    const user = request.user;

    if (!user) {
      return false;
    }

    // 🔓 SUPER_ADMIN bypass - Full access regardless of required roles
    if (user.roleType === 'SUPER_ADMIN') {
      return true;
    }

    // Check if user's roleType is in the required roles
    return roles.includes(user.roleType as RoleType);
  }
}
