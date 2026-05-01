import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminRoleController } from './admin-role.controller';
import { AdminRoleService } from './admin-role.service';
import { AdminRole } from './entities/admin-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdminRole])],
  controllers: [AdminRoleController],
  providers: [AdminRoleService],
  exports: [AdminRoleService],
})
export class AdminRoleModule {}
