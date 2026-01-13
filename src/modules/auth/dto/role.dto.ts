import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import {
  BooleanFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';
import type { Role } from '../entities/role.entity.ts';

export class RoleDto extends AbstractDto {
  @StringField()
  name!: string;

  @StringFieldOptional()
  description!: string | null;

  @BooleanFieldOptional()
  isActive!: boolean;

  constructor(role: Role) {
    super(role);
    this.name = role.name;
    this.description = role.description;
    this.isActive = role.isActive;
  }
}
