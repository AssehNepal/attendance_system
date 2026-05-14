import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { SnakeNamingStrategy } from '../../snake-naming.strategy';

@Injectable()
export class ApiConfigService {
  constructor(private configService: ConfigService) {}

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  private getNumber(key: string): number {
    const value = this.get(key);
    const num = Number(value);

    if (Number.isNaN(num)) {
      throw new TypeError(
        `Environment variable ${key} must be a number. Received: ${value}`,
      );
    }

    return num;
  }

  private getBoolean(key: string): boolean {
    const value = this.get(key);

    try {
      return Boolean(JSON.parse(value));
    } catch {
      throw new Error(
        `Environment variable ${key} must be a boolean. Received: ${value}`,
      );
    }
  }

  private getString(key: string, defaultValue?: string): string {
    const value = this.configService.get<string>(key);

    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      throw new Error(`${key} environment variable doesn't exist`);
    }

    return value.toString().replaceAll(String.raw`\n`, '\n');
  }

  get nodeEnv(): string {
    return this.getString('NODE_ENV');
  }

  get postgresConfig(): TypeOrmModuleOptions {
    const baseConfig = {
      autoLoadEntities: true,
      dropSchema: this.isTest,
      type: 'postgres' as const,
      subscribers: [],
      migrationsRun: false,
      logging: this.getBoolean('ENABLE_ORM_LOGS'),
      namingStrategy: new SnakeNamingStrategy(),
    };

    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    if (databaseUrl) {
      return {
        ...baseConfig,
        url: databaseUrl,
        ssl: { rejectUnauthorized: false },
      };
    }

    return {
      ...baseConfig,
      host: this.getString('DB_HOST'),
      port: this.getNumber('DB_PORT'),
      username: this.getString('DB_USERNAME'),
      password: this.getString('DB_PASSWORD'),
      database: this.getString('DB_DATABASE'),
    };
  }

  get documentationEnabled(): boolean {
    return this.getBoolean('ENABLE_DOCUMENTATION');
  }

  get authConfig() {
    return {
      privateKey: this.getString('JWT_PRIVATE_KEY'),
      publicKey: this.getString('JWT_PUBLIC_KEY'),
      jwtExpirationTime: this.getNumber('JWT_EXPIRATION_TIME'),
      jwtRefreshExpirationTime: this.getNumber('JWT_REFRESH_EXPIRATION_TIME'),
    };
  }

  get appConfig() {
    return {
      port: this.getString('PORT'),
    };
  }

  get emailConfig() {
    return {
      host: this.getString('EMAIL_HOST'),
      port: this.getNumber('EMAIL_PORT'),
      username: this.getString('EMAIL_USER'),
      password: this.getString('EMAIL_PASSWORD'),
      emailFromName: this.getString('EMAIL_FROM_NAME'),
      emailFrom: this.getString('EMAIL_FROM'),
    };
  }

  get otpConfig() {
    return {
      expirationMinutes: this.getNumber('FORGOT_PASSWORD_OTP_EXPIRY_MINUTES'),
    };
  }

  get redisConfig() {
    return {
      enabled: this.getBoolean('REDIS_CACHE_ENABLED'),
      host: this.getString('REDIS_HOST'),
      port: this.getNumber('REDIS_PORT'),
    };
  }

  get awsS3Config() {
    return {
      accessKeyId: this.getString('ACCESS_KEY_ID'),
      secretAccessKey: this.getString('SECRET_ACCESS_KEY'),
      bucketEndpoint: this.getString('AWS_S3_BUCKET_ENDPOINT'),
      bucketName: this.getString('AWS_S3_BUCKET_NAME'),
      bucketRegion: this.getString('AWS_S3_BUCKET_REGION'),
      usePathStyleEndpoint: this.getBoolean('AWS_USE_PATH_STYLE_ENDPOINT'),
    };
  }

  private get(key: string): string {
    const value = this.configService.get<string>(key);

    if (value == null) {
      throw new Error(`Environment variable ${key} is not set`);
    }

    return value;
  }
}
