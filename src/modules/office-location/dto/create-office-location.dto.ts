import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOfficeLocationDto {
  @ApiProperty({
    example: 'Thimphu District Office',
    description: 'Office location name',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
