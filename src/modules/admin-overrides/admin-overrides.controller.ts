import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { AdminOverridesService } from './admin-overrides.service';
import { CreateAdminOverrideDto } from './dto/create-admin-override.dto';

@Controller('admin-overrides')
@ApiTags('Admin Overrides')
export class AdminOverridesController {
  constructor(private readonly overridesService: AdminOverridesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAdminOverrideDto) {
    return this.overridesService.create(dto);
  }

  @Get()
  findAll(@Query() pageOptionsDto: PageOptionsDto) {
    return this.overridesService.findAll(pageOptionsDto);
  }

  @Get(':targetTable/:targetId')
  findByTarget(
    @Param('targetTable') targetTable: string,
    @Param('targetId') targetId: Uuid,
  ) {
    return this.overridesService.findByTarget(targetTable, targetId);
  }
}
