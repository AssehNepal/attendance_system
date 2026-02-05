import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: '11234567890',
    description: 'CID Number',
  })
  @IsString()
  @IsNotEmpty()
  cidNo!: string;

  @ApiProperty({
    example: 'Tshering Dorji',
    description: 'Full Name',
  })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiPropertyOptional({
    example: 'Password@123',
    description: 'User password',
  })
  @IsString()
  @IsOptional()
  password?: string;
}
