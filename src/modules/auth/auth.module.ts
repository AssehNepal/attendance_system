import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import { AgencyModule } from '../agency/agency.module';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module.ts';
import { AuthController } from './auth.controller.ts';
import { AuthService } from './auth.service';
// Import all auth entities
import { Admin } from './entities/admin.entity';
import { AdminRole } from './entities/admin-role.entity';
import { OfficeLocation } from './entities/office-location.entity';
import { Permission } from './entities/permission.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { JwtStrategy } from './jwt.strategy';
import { NdiService } from './ndi.service';
import { PublicStrategy } from './public.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Admin,
      AdminRole,
      OfficeLocation,
      Permission,
      Role,
      RolePermission,
      RefreshToken,
    ]),
    forwardRef(() => UsersModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: ApiConfigService) => ({
        privateKey: configService.authConfig.privateKey,
        publicKey: configService.authConfig.publicKey,
        signOptions: {
          algorithm: 'RS256',
          //     expiresIn: configService.getNumber('JWT_EXPIRATION_TIME'),
        },
        verifyOptions: {
          algorithms: ['RS256'],
        },
        // if you want to use token with expiration date
        // signOptions: {
        //     expiresIn: configService.getNumber('JWT_EXPIRATION_TIME'),
        // },
      }),
      inject: [ApiConfigService],
    }),
    AgencyModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, NdiService, JwtStrategy, PublicStrategy],
  exports: [JwtModule, AuthService, NdiService],
})
export class AuthModule {}
