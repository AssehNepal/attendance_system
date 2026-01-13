import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCommentsDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  postId!: string;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Comment content cannot be empty' })
  @MaxLength(255, { message: 'Comment content cannot exceed 255 characters' })
  comments!: string;
}
