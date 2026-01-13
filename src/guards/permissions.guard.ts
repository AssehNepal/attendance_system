import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PermissionAction,
  PermissionSubject,
} from '../entities/permission.entity.ts';

export const PERMISSION_KEY = 'permission';

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

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.permissions) {
      return false;
    }

    return user.permissions.some(
      (p: { action: string; subject: string }) =>
        p.action === requiredPermission.action &&
        p.subject === requiredPermission.subject,
    );
  }
}
