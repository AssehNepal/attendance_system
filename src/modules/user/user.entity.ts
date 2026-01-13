import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import type { UserDtoOptions } from './dtos/user.dto.ts';
import { UserDto } from './dtos/user.dto.ts';

@Entity({ name: 'users' })
@UseDto(UserDto)
export class UserEntity extends AbstractEntity<UserDto, UserDtoOptions> {
  @Column({
    type: 'varchar',
    length: 20,
    default: 'CITIZEN',
    name: 'role_type',
  })
  roleType!: string;

  @Column({
    unique: true,
    type: 'varchar',
    length: 20,
    name: 'cid_no',
  })
  cidNo!: string;

  @Column({ type: 'varchar', nullable: true, name: 'password' })
  password!: string | null;

  @Column({ nullable: true, type: 'text', name: 'ndi_deeplink' })
  ndiDeeplink!: string | null;
}
