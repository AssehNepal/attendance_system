import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCommentsDto {
  @ApiPropertyOptional({ maxLength: 255 })
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'Comment content cannot be empty' })
  @MaxLength(255, { message: 'Comment content cannot exceed 255 characters' })
  comments?: string;
}
