import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateProofRequestDto {
  @ApiPropertyOptional({
    description: 'Name of the proof request',
    example: 'Verify Foundational ID',
  })
  @IsString()
  @IsOptional()
  proofName?: string;

  @ApiPropertyOptional({
    description: 'Array of attribute names to request from NDI',
    example: ['ID Number', 'Full Name'],
    isArray: true,
    type: String,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attributes?: string[];
}
