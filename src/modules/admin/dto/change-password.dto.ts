import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'The current password of the admin' })
  @IsString()
  @IsNotEmpty()
  oldPassword!: string;

  @ApiProperty({ description: 'The new password for the admin' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword!: string;
}
