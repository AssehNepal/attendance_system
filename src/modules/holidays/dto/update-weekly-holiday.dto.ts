import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateWeeklyHolidayDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  readonly dayOfWeek?: number;

  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;
}
