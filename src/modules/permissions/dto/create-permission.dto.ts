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
    example: 'Can create, read, update and delete users',
    description: 'Permission description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: ['create', 'read', 'update', 'delete'],
    description: 'Allowed actions',
  })
  @IsArray()
  @IsString({ each: true })
  actions!: string[];

  @ApiProperty({
    example: ['User', 'Admin'],
    description: 'Subjects the permission applies to',
  })
  @IsArray()
  @IsString({ each: true })
  subjects!: string[];
}
