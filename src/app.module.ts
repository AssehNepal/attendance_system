import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { DataSource } from 'typeorm';
import {
  addTransactionalDataSource,
  getDataSourceByName,
} from 'typeorm-transactional';

import { AdminOverridesModule } from './modules/admin-overrides/admin-overrides.module';
import { AdminsModule } from './modules/admins/admins.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AuthModule } from './modules/auth/auth.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { ForgotPasswordModule } from './modules/forgot-password/forgot-password.module';
import { HealthCheckerModule } from './modules/health-checker/health-checker.module';
import { HolidaysModule } from './modules/holidays/holidays.module';
import { OfficesModule } from './modules/offices/offices.module';
import { StaffModule } from './modules/staff/staff.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { ApiConfigService } from './shared/services/api-config.service';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
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

        try {
          const existingDataSource = getDataSourceByName('default');
          if (existingDataSource) {
            return existingDataSource;
          }
        } catch {
          // DataSource doesn't exist yet, create it
        }

        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    AuthModule,
    AdminsModule,
    OfficesModule,
    DepartmentsModule,
    StaffModule,
    AttendanceModule,
    HolidaysModule,
    AdminOverridesModule,
    SystemSettingsModule,
    ForgotPasswordModule,
    HealthCheckerModule,
  ],
  providers: [],
})
export class AppModule {}
