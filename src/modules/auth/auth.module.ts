import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import { UsersModule } from '../users/users.module.ts';
import { AgencyModule } from '../agency/agency.module';
import { AuthController } from './auth.controller.ts';
import { AuthService } from './services/auth.service.ts';
import { JwtStrategy } from './jwt.strategy.ts';
import { PublicStrategy } from './public.strategy.ts';

// Import all auth entities
import { Admin } from './entities/admin.entity.ts';
import { AdminRole } from './entities/admin-role.entity.ts';
import { OfficeLocation } from './entities/office-location.entity.ts';
import { Permission } from './entities/permission.entity.ts';
import { Role } from './entities/role.entity.ts';
import { RolePermission } from './entities/role-permission.entity.ts';
import { RefreshToken } from './entities/refresh-token.entity.ts';
import { User } from '../users/entities/user.entity.ts';
import { SeedService } from './services/seed.service.ts';

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
  providers: [AuthService, JwtStrategy, PublicStrategy, SeedService],
  exports: [JwtModule, AuthService, SeedService],
})
export class AuthModule {}
