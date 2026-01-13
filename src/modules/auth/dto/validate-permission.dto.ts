import { StringField } from '../../../decorators/field.decorators.ts';
import {
  PermissionAction,
  PermissionSubject,
} from '../entities/permission.entity.ts';

export class ValidatePermissionDto {
  @StringField()
  action!: PermissionAction;

  @StringField()
  subject!: PermissionSubject;
}
