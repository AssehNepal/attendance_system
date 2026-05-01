import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export enum ProofRequestPurpose {
  LOGIN = 'login',
  EKYC = 'ekyc',
}

export class CreateProofRequestDto {
  @ApiPropertyOptional({
    description: 'Name of the proof request',
    example: 'Verify Foundational ID',
  })
  @IsString()
  @IsOptional()
  proofName?: string;

  @ApiPropertyOptional({
    description: 'Purpose of the proof request',
    example: 'login',
    enum: ProofRequestPurpose,
    enumName: 'ProofRequestPurpose',
  })
  @IsEnum(ProofRequestPurpose)
  @IsOptional()
  purpose?: ProofRequestPurpose;

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
