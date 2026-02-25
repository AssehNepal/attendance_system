import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';

import { DataSource } from 'typeorm';
import {
  addTransactionalDataSource,
  getDataSourceByName,
} from 'typeorm-transactional';

import { AuthModule } from './modules/auth/auth.module.ts';
import { ForgotPasswordModule } from './modules/forgot-password/forgot-password.module';
import { HealthCheckerModule } from './modules/health-checker/health-checker.module.ts';
import { UsersModule } from './modules/users/users.module.ts';
import { AdminModule } from './modules/admin/admin.module.ts';
import { RolesModule } from './modules/roles/roles.module.ts';
import { PermissionsModule } from './modules/permissions/permissions.module.ts';
import { OfficeLocationModule } from './modules/office-location/office-location.module.ts';
import { AgencyModule } from './modules/agency/agency.module.ts';
import { AdminRoleModule } from './modules/admin-role/admin-role.module.ts';
import { RolePermissionModule } from './modules/role-permission/role-permission.module.ts';
import { ApiConfigService } from './shared/services/api-config.service.ts';
import { SharedModule } from './shared/shared.module.ts';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    AuthModule,
    ForgotPasswordModule,
    UsersModule,
    AdminModule,
    RolesModule,
    PermissionsModule,
    OfficeLocationModule,
    AgencyModule,
    AdminRoleModule,
    RolePermissionModule,
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ApiConfigService) =>
        configService.postgresConfig,
      inject: [ApiConfigService],
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('Invalid options passed');
        }

        // Check if DataSource already exists to avoid duplication when microservice initializes
        try {
          const existingDataSource = getDataSourceByName('default');
          if (existingDataSource) {
            return existingDataSource;
          }
        } catch (error) {
          // DataSource doesn't exist yet, create it
        }

        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    HealthCheckerModule,
  ],
  providers: [],
})
export class AppModule {}
