import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfficeLocationService } from './office-location.service';
import { OfficeLocationController } from './office-location.controller';
import { OfficeLocation } from './entities/office-location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OfficeLocation]),
    ClientsModule.register([
      {
        name: 'NATS_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://localhost:4222'],
        },
      },
    ]),
  ],
  controllers: [OfficeLocationController],
  providers: [OfficeLocationService],
  exports: [OfficeLocationService],
})
export class OfficeLocationModule {}
