import { ApiProperty } from '@nestjs/swagger';

class UserInfo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  cidNo!: string;

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

  @ApiProperty({ type: UserInfo })
  user!: UserInfo;
}
