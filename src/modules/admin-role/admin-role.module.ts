import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminRoleService } from './admin-role.service';
import { AdminRoleController } from './admin-role.controller';
import { AdminRole } from './entities/admin-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdminRole])],
  controllers: [AdminRoleController],
  providers: [AdminRoleService],
  exports: [AdminRoleService],
})
export class AdminRoleModule {}
