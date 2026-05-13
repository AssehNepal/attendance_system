import { StringField } from '../../../decorators/field.decorators';

export class LoginPayloadDto {
  @StringField()
  accessToken!: string;

  @StringField()
  refreshToken!: string;
}
