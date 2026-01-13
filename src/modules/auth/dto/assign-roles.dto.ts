import { UUIDField } from '../../../decorators/field.decorators.ts';
import { IsArray } from 'class-validator';

export class AssignRolesDto {
  @IsArray()
  @UUIDField({ each: true })
  roleIds!: string[];
}
