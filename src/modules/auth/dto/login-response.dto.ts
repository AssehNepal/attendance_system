import { ApiProperty } from '@nestjs/swagger';

class UserInfo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  cidNo!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  roleType!: string;

  @ApiProperty({ type: [String] })
  roles!: string[];
}

export class LoginResponseDto {
  @ApiProperty()
  message!: string;

  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ type: UserInfo })
  user!: UserInfo;
}
