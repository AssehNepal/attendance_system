import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'Data Entry Operator',
    description: 'Role name',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 'Can enter and modify data',
    description: 'Role description',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
