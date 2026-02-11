import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';

/**
 * RolesGuard - DISABLED
 *
 * Roles are now informational only and not enforced.
 * Only authentication (valid token) is required, which is handled by AuthGuard.
 *
 * This guard always returns true to allow all authenticated users.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // 🔓 ALWAYS ALLOW - No role-based access control
    return true;
  }
}
