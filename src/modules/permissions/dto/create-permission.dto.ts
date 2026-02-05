import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'manage-users',
    description: 'Permission name',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example:
      'Birth and death registration verification permission for Gewog CC',
    description: 'Permission description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: ['approve', 'verify', 'create', 'read', 'update', 'delete'],
    description: 'Allowed actions',
  })
  @IsArray()
  @IsString({ each: true })
  actions!: string[];

  @ApiProperty({
    example: ['birth Registration', 'death Registration', 'user creation'],
    description: 'Subjects the permission applies to',
  })
  @IsArray()
  @IsString({ each: true })
  subjects!: string[];
}
