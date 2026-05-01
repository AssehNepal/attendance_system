import { IsArray } from 'class-validator';

import { UUIDField } from '../../../decorators/field.decorators.ts';

export class AssignRolesDto {
  @IsArray()
  @UUIDField({ each: true })
  roleIds!: string[];
}
