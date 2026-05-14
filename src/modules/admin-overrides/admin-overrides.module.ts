import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminOverridesController } from './admin-overrides.controller';
import { AdminOverridesService } from './admin-overrides.service';
import { AdminOverride } from './entities/admin-override.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdminOverride])],
  controllers: [AdminOverridesController],
  providers: [AdminOverridesService],
  exports: [AdminOverridesService],
})
export class AdminOverridesModule {}
