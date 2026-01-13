import {
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';
import { IsArray, IsEnum } from 'class-validator';
import {
  PermissionAction,
  PermissionSubject,
} from '../entities/permission.entity.ts';

export class CreatePermissionDto {
  @StringField()
  name!: string;

  @StringFieldOptional()
  description?: string;

  @IsArray()
  @IsEnum(PermissionAction, { each: true })
  actions!: PermissionAction[];

  @IsArray()
  @IsEnum(PermissionSubject, { each: true })
  subjects!: PermissionSubject[];
}
