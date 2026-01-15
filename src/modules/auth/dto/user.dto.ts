import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import {
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';
import type { User } from '../../users/entities/user.entity.ts';

export class UserDto extends AbstractDto {
  @StringField()
  roleType!: string;

  @StringField()
  cidNo!: string;

  @StringFieldOptional()
  ndiDeeplink?: string;

  constructor(user: User) {
    super(user);
    this.roleType = user.roleType;
    this.cidNo = user.cidNo;
    this.ndiDeeplink = user.ndiDeeplink;
  }
}
