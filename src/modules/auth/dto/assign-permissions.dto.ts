import { UUIDField } from '../../../decorators/field.decorators.ts';
import { IsArray } from 'class-validator';

export class AssignPermissionsDto {
  @IsArray()
  @UUIDField({ each: true })
  permissionIds!: string[];
}
