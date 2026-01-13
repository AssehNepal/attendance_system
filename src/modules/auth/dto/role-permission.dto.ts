import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { UUIDField } from '../../../decorators/field.decorators.ts';
import type { RolePermission } from '../entities/role-permission.entity.ts';

export class RolePermissionDto extends AbstractDto {
  @UUIDField()
  roleId!: string;

  @UUIDField()
  permissionId!: string;

  constructor(rolePermission: RolePermission) {
    super(rolePermission);
    this.roleId = rolePermission.roleId;
    this.permissionId = rolePermission.permissionId;
  }
}
