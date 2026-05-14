import { IsIn, IsOptional } from 'class-validator';

import {
  BooleanFieldOptional,
  EmailField,
  StringField,
  StringFieldOptional,
  UUIDFieldOptional,
} from '../../../decorators/field.decorators';

export class CreateAdminDto {
  @StringField({
    maxLength: 200,
    description: 'Admin full name',
    example: 'Tashi Dorji',
  })
  name!: string;

  @EmailField({
    description: 'Admin email address',
    example: 'tashi.dorji@gov.bt',
  })
  email!: string;

  @StringField({
    maxLength: 255,
    description: 'Admin password',
    example: 'P@ssw0rd123',
  })
  password!: string;

  @StringFieldOptional({
    maxLength: 20,
    description: 'Admin role',
    example: 'admin',
  })
  @IsOptional()
  @IsIn(['super_admin', 'admin'], {
    message: 'Role must be either super_admin or admin',
  })
  role?: 'super_admin' | 'admin';

  @UUIDFieldOptional({
    description: 'Office ID the admin belongs to',
    example: '58b587e4-4b92-4ba8-a637-de9966440390',
  })
  officeId?: Uuid;

  @BooleanFieldOptional({
    description: 'Whether the admin is active',
    example: true,
  })
  isActive?: boolean;
}
