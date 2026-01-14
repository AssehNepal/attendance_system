import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({ example: '11234567890123', description: 'CID Number' })
  @IsString()
  @IsNotEmpty()
  cidNo!: string;

  @ApiProperty({ example: 'SecurePassword@123', description: 'Admin password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ description: 'Office Location ID' })
  @IsUUID()
  @IsOptional()
  officeLocationId?: Uuid;

  @ApiPropertyOptional({ description: 'Agency ID' })
  @IsString()
  @IsOptional()
  agencyId?: string;

  @ApiPropertyOptional({ example: '17123456', description: 'Mobile number' })
  @IsString()
  @IsOptional()
  mobileNo?: string;

  @ApiPropertyOptional({ example: 'admin@example.com', description: 'Email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'NDI Deeplink URL' })
  @IsString()
  @IsOptional()
  ndiDeeplink?: string;
}
