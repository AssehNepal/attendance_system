import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: '11234567890123', description: 'CID Number' })
  @IsString()
  @IsNotEmpty()
  cidNo!: string;

  @ApiPropertyOptional({ example: 'Password@123', description: 'User password' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ description: 'NDI Deeplink URL' })
  @IsString()
  @IsOptional()
  ndiDeeplink?: string;
}
