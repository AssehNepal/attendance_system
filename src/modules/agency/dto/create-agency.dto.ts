import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAgencyDto {
  @ApiProperty({
    example: 'Department of Immigration',
    description: 'Agency name',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'DOI',
    description: 'Agency code',
  })
  @IsString()
  @IsNotEmpty()
  code!: string;
}
