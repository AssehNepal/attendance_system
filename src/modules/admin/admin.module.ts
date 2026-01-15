import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Admin } from './entities/admin.entity';
import { AdminRole } from './entities/admin-role.entity';
import { OfficeLocation } from '../office-location/entities/office-location.entity';
import { Agency } from '../agency/entities/agency.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, AdminRole, OfficeLocation, Agency]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
