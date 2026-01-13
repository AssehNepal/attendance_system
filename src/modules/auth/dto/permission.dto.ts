import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import {
  BooleanFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';
import type { Permission } from '../entities/permission.entity.ts';

export class PermissionDto extends AbstractDto {
  @StringField()
  name!: string;

  @StringFieldOptional()
  description!: string | null;

  @StringField({ isArray: true })
  actions!: string[];

  @StringField({ isArray: true })
  subjects!: string[];

  @BooleanFieldOptional()
  isActive!: boolean;

  constructor(permission: Permission) {
    super(permission);
    this.name = permission.name;
    this.description = permission.description;
    this.actions = permission.actions;
    this.subjects = permission.subjects;
    this.isActive = permission.isActive;
  }
}
