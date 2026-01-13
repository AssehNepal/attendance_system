import { StringField } from '../../../decorators/field.decorators.ts';

export class NdiCallbackDto {
  @StringField()
  code!: string;

  @StringField()
  state!: string;
}
