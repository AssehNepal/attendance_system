import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { OfficesService } from './offices.service';

@Controller('offices')
@ApiTags('Offices')
export class OfficesController {
  constructor(private readonly officesService: OfficesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateOfficeDto) {
    // TODO: extract createdById from auth user
    return this.officesService.create(dto, '' as Uuid);
  }

  @Get()
  findAll(@Query() pageOptionsDto: PageOptionsDto) {
    return this.officesService.findAll(pageOptionsDto);
  }

  @Get(':id')
  findOne(@Param('id') id: Uuid) {
    return this.officesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: Uuid, @Body() dto: UpdateOfficeDto) {
    return this.officesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: Uuid) {
    return this.officesService.remove(id);
  }
}
