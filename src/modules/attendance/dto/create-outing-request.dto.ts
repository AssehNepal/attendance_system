import { Matches } from 'class-validator';

import {
  BooleanField,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators';

export class CreateOutingRequestDto {
  // staffId is injected from the authenticated user session in the controller
  staffId!: Uuid;

  /**
   * Date of the outing in YYYY-MM-DD format.
   * Can be today or a future date (e.g. apply tomorrow's outing today).
   */
  @StringField({
    maxLength: 10,
    example: '2026-05-19',
    description:
      'Outing date in YYYY-MM-DD format. Can be today or a future date.',
  })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
    message: 'logDate must be a valid date in YYYY-MM-DD format',
  })
  logDate!: string;

  @BooleanField({
    example: true,
    description: 'Whether the staff member will return before end of day.',
  })
  willResume!: boolean;

  /**
   * Time the staff member leaves for the outing in HH:mm format (24-hour), e.g. "10:00".
   */
  @StringField({
    maxLength: 5,
    example: '10:00',
    description:
      'Time the staff leaves for the outing in HH:mm (24-hour) format.',
  })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'outFrom must be in HH:mm format (e.g. "10:00")',
  })
  outFrom!: string;

  /**
   * Expected resume time in HH:mm format (24-hour), e.g. "14:30".
   * Required when willResume is true.
   */
  @StringFieldOptional({
    maxLength: 5,
    example: '14:30',
    description:
      'Expected return time in HH:mm (24-hour) format. Required when willResume is true.',
  })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'resumeTime must be in HH:mm format (e.g. "14:30")',
  })
  resumeTime?: string;

  // outingBeforeCheckin is auto-determined by the backend
  outingBeforeCheckin?: boolean;
}
