import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ required: false })
  refreshToken?: string;

  @ApiProperty()
  expiresIn!: number;

  @ApiProperty()
  tokenType: string = 'Bearer';

  @ApiProperty()
  user!: {
    id: string;
    cidNo: string;
    roleType: string;
    roles: string[];
    permissions: Array<{ action: string; subject: string }>;
    officeLocationId?: string;
  };
}
