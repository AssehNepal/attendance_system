import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminOverride } from './entities/admin-override.entity';
import { AdminOverridesController } from './admin-overrides.controller';
import { AdminOverridesService } from './admin-overrides.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdminOverride])],
  controllers: [AdminOverridesController],
  providers: [AdminOverridesService],
  exports: [AdminOverridesService],
})
export class AdminOverridesModule {}
