import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

export type PermissionAction = string;
export type PermissionSubject = string;

export interface PermissionRequirement {
  action: PermissionAction;
  subject: PermissionSubject;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // 🔓 ALWAYS ALLOW - No permission-based access control
    return true;
  }
}
