import { SetMetadata } from '@nestjs/common';
import { PERMISSION_KEY } from '../guards/permissions.guard.ts';

export const RequirePermission = (action: string, subject: string) =>
  SetMetadata(PERMISSION_KEY, { action, subject });
