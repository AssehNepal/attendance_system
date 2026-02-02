import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  IsEnum,
} from 'class-validator';
import { RoleType } from '../../../constants/role-type';

export class CreateAdminDto {
  @ApiProperty({
    example: '11234567890',
    description: 'CID Number',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  cidNo!: string;

  @ApiProperty({
    enum: RoleType,
    enumName: 'RoleType',
    example: RoleType.ADMIN,
    description: 'Admin role type (ADMIN or SUPER_ADMIN)',
  })
  @IsEnum(RoleType, { message: 'roleType must be either ADMIN or SUPER_ADMIN' })
  @IsNotEmpty()
  roleType!: RoleType;

  @ApiProperty({ example: 'SecurePassword@123', description: 'Admin password' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({ description: 'Office Location ID' })
  @IsOptional()
  @IsUUID('4', { message: 'officeLocationId must be a valid UUID' })
  officeLocationId?: string;

  @ApiPropertyOptional({ description: 'Agency ID' })
  @IsOptional()
  @IsUUID('4', { message: 'agencyId must be a valid UUID' })
  agencyId?: string;

  @ApiPropertyOptional({ example: '17123456', description: 'Mobile number' })
  @IsString()
  @IsOptional()
  mobileNo?: string;

  @ApiPropertyOptional({
    example: 'admin@example.com',
    description: 'Email address',
  })
  @IsEmail()
  @IsOptional()
  email?: string;
}
