import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateHolidayDto {
  @IsOptional()
  @IsDateString()
  readonly holidayDate?: string;

  @IsOptional()
  @IsString()
  readonly name?: string;

  @IsOptional()
  @IsIn(['public', 'restricted'])
  readonly type?: 'public' | 'restricted';
}
