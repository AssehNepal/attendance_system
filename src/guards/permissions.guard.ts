import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PERMISSION_MAPPING } from '../constants/permission-mapping';

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
      const actionStr = String(ability.action);
      const userActions = actionStr.split(',');

      // Expand composite actions
      const expandedActions = new Set<string>();
      userActions.forEach((action) => {
        expandedActions.add(action.trim());
        const mapped = PERMISSION_MAPPING[action.trim()];
        if (mapped) {
          mapped.forEach((m) => expandedActions.add(m.trim()));
        }
      });

      const hasAction = expandedActions.has(requiredPermission.action);

      const subjectStr = String(ability.subject);
      const hasSubject =
        subjectStr === '*' ||
        subjectStr.split(',').some((s) => s.trim() === requiredPermission.subject);

      return hasAction && hasSubject;
    });
  }
}
