import type { Provider } from '@nestjs/common';
import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { ApiConfigService } from './services/api-config.service.ts';
import { AwsS3Service } from './services/aws-s3.service.ts';
import { EmailService } from './services/email.service.ts';
import { GeneratorService } from './services/generator.service.ts';

import { ValidatorService } from './services/validator.service.ts';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { MailerModule } from '@nestjs-modules/mailer';

const providers: Provider[] = [
  ApiConfigService,
  ValidatorService,
  AwsS3Service,
  GeneratorService,
  EmailService,
  {
    provide: 'NATS_SERVICE',
    useFactory: (configService: ApiConfigService) => {
      const natsConfig = configService.natsConfig;

      try {
        return ClientProxyFactory.create({
          transport: Transport.NATS,
          options: {
            name: 'NATS_SERVICE',
            servers: [`nats://${natsConfig.host}:${natsConfig.port}`],
          },
        });
      } catch (error) {
        console.error('Failed to create NATS client:', error);

        throw error;
      }
    },
    inject: [ApiConfigService],
  },
  {
    provide: 'COMMON_SERVICE',
    useFactory: (configService: ApiConfigService) => {
      const commonServiceTcpOptions = configService.commonServiceTcpOptions;

      return ClientProxyFactory.create({
        transport: Transport.TCP,
        options: {
          host: commonServiceTcpOptions.host,
          port: commonServiceTcpOptions.port,
        },
      });
    },
    inject: [ApiConfigService],
  },
];

@Global()
@Module({
  providers,
  imports: [
    CqrsModule,
    MailerModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ApiConfigService) => ({
        transport: {
          host: configService.emailConfig.host,
          port: configService.emailConfig.port,
          secure: true, // Use port 465
          auth: {
            user: configService.emailConfig.username,
            pass: configService.emailConfig.password,
          },
        },
        defaults: {
          from: `"${configService.emailConfig.emailFromName}" <${configService.emailConfig.emailFrom}>`,
        },
      }),
      inject: [ApiConfigService],
    }),
  ],
  exports: [...providers, CqrsModule],
})
export class SharedModule {}
