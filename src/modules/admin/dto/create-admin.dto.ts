import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({
    example: '11234567890',
    description: 'CID Number (exactly 11 digits)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(11, { message: 'cidNo must be exactly 11 digits' })
  @MaxLength(11, { message: 'cidNo must be exactly 11 digits' })
  cidNo!: string;

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
