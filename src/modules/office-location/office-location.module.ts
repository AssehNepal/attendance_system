import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfficeLocationService } from './office-location.service';
import { OfficeLocationController } from './office-location.controller';
import { OfficeLocation } from './entities/office-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OfficeLocation])],
  controllers: [OfficeLocationController],
  providers: [OfficeLocationService],
  exports: [OfficeLocationService],
})
export class OfficeLocationModule {}
