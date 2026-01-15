import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { validateHash } from '../../common/utils.ts';
import type { RoleType } from '../../constants/role-type.ts';
import { TokenType } from '../../constants/token-type.ts';
import { UserNotFoundException } from '../../exceptions/user-not-found.exception.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import type { User } from '../users/entities/user.entity.ts';
import { UsersService } from '../users/users.service.ts';
import { TokenPayloadDto } from './dto/token-payload.dto.ts';
import type { UserLoginDto } from './dto/user-login.dto.ts';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ApiConfigService,
    private usersService: UsersService,
  ) {}

  async createAccessToken(data: {
    role: RoleType;
    userId: Uuid;
  }): Promise<TokenPayloadDto> {
    return new TokenPayloadDto({
      expiresIn: this.configService.authConfig.jwtExpirationTime,
      token: await this.jwtService.signAsync({
        userId: data.userId,
        type: TokenType.ACCESS_TOKEN,
        role: data.role,
      }),
    });
  }

  async validateUser(userLoginDto: UserLoginDto): Promise<User> {
    const user = await this.usersService.findByCidNo(userLoginDto.cidNo);

    const isPasswordValid = await validateHash(
      userLoginDto.password,
      user?.password,
    );

    if (!isPasswordValid) {
      throw new UserNotFoundException();
    }

    return user!;
  }
}
