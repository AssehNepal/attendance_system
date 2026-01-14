import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAgencyDto {
  @ApiProperty({ example: 'Department of Immigration', description: 'Agency name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'DOI', description: 'Agency code' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiPropertyOptional({
    example: 'Handles immigration and census data',
    description: 'Agency description',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
