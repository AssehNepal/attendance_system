import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Agency } from '../agency/entities/agency.entity';
import { OfficeLocation } from '../office-location/entities/office-location.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminNatsController } from './admin-nats.controller';
import { Admin } from './entities/admin.entity';
import { AdminRole } from './entities/admin-role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, AdminRole, OfficeLocation, Agency]),
  ],
  controllers: [AdminController, AdminNatsController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
