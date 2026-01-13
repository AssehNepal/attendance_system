import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { UUIDField } from '../../../decorators/field.decorators.ts';
import type { AdminRole } from '../entities/admin-role.entity.ts';

export class AdminRoleDto extends AbstractDto {
  @UUIDField()
  adminId!: string;

  @UUIDField()
  roleId!: string;

  constructor(adminRole: AdminRole) {
    super(adminRole);
    this.adminId = adminRole.adminId;
    this.roleId = adminRole.roleId;
  }
}
