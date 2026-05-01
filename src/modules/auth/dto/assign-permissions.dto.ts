import { IsArray } from 'class-validator';

import { UUIDField } from '../../../decorators/field.decorators.ts';

export class AssignPermissionsDto {
  @IsArray()
  @UUIDField({ each: true })
  permissionIds!: string[];
}
