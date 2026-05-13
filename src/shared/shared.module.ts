import type { Provider } from '@nestjs/common';
import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MailerModule } from '@nestjs-modules/mailer';

import { ApiConfigService } from './services/api-config.service.ts';
import { AwsS3Service } from './services/aws-s3.service.ts';
import { EmailService } from './services/email.service.ts';
import { GeneratorService } from './services/generator.service.ts';
import { ValidatorService } from './services/validator.service.ts';

const providers: Provider[] = [
  ApiConfigService,
  ValidatorService,
  AwsS3Service,
  GeneratorService,
  EmailService,
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
          secure: true,
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
