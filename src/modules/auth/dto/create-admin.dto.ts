import {
  EmailField,
  PhoneField,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';
import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminDto {
  @StringField({ minLength: 11, maxLength: 20 })
  @ApiProperty({
    description: 'Citizen ID Number (CID)',
    example: '11111111111111',
    minLength: 11,
    maxLength: 20,
  })
  cidNo!: string;

  @StringField({ minLength: 8 })
  @ApiProperty({
    description: 'Admin password (minimum 8 characters)',
    example: 'Admin@12345',
    minLength: 8,
  })
  password!: string;

  @EmailField()
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@example.com',
  })
  email!: string;

  @PhoneField()
  @ApiProperty({
    description: 'Mobile number',
    example: '17123456',
  })
  mobileNo!: string;

  @StringField()
  @ApiProperty({
    description: 'Agency ID',
    example: 'NSB',
  })
  agencyId!: string;

  // Office Location - can provide existing ID OR new name
  @IsOptional()
  @IsUUID('4')
  @ApiProperty({
    description:
      'Existing office location ID (provide this OR officeLocationName)',
    example: 'uuid-office-location-id',
    required: false,
  })
  officeLocationId?: string;

  @StringFieldOptional()
  @ApiProperty({
    description: 'New office location name (provide this OR officeLocationId)',
    example: 'Thimphu Regional Office',
    required: false,
  })
  officeLocationName?: string;

  // Roles Assignment
  @IsArray()
  @IsUUID('4', { each: true })
  @ApiProperty({
    description: 'Array of role IDs to assign to admin',
    example: ['uuid-role-1', 'uuid-role-2'],
    type: [String],
    isArray: true,
  })
  roleIds!: string[];
}
