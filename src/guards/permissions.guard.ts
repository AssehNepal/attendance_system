import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PERMISSION_KEY = 'permission';

export type PermissionAction = string;
export type PermissionSubject = string;

export interface PermissionRequirement {
  action: PermissionAction;
  subject: PermissionSubject;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission =
      this.reflector.getAllAndOverride<PermissionRequirement>(PERMISSION_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    // If no permission is required, allow access
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // 🔓 SUPER_ADMIN bypass - Full access to all endpoints
    if (user.roleType === 'SUPER_ADMIN') {
      return true;
    }

    // For regular users/admins, check permissions from ability array
    if (!user.ability || !Array.isArray(user.ability)) {
      return false;
    }

    // Check if user has the required permission in their ability array
    return user.ability.some((ability: any) => {
      const hasAction = Array.isArray(ability.action)
        ? ability.action.includes(requiredPermission.action)
        : ability.action === requiredPermission.action;

      const hasSubject = Array.isArray(ability.subject)
        ? ability.subject.includes(requiredPermission.subject)
        : ability.subject === requiredPermission.subject;

      return hasAction && hasSubject;
    });
  }
}
