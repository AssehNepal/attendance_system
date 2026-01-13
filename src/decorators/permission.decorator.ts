import { SetMetadata } from '@nestjs/common';
import {
  PermissionAction,
  PermissionSubject,
} from '../modules/auth/entities/permission.entity.ts';
import { PERMISSION_KEY } from '../guards/permissions.guard.ts';

export const RequirePermission = (
  action: PermissionAction,
  subject: PermissionSubject,
) => SetMetadata(PERMISSION_KEY, { action, subject });
