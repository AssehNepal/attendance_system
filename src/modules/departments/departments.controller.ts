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
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentsService } from './departments.service';

@Controller('departments')
@ApiTags('Departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Get()
  findAll(@Query() pageOptionsDto: PageOptionsDto) {
    return this.departmentsService.findAll(pageOptionsDto);
  }

  @Get('office/:officeId')
  findByOffice(@Param('officeId') officeId: Uuid) {
    return this.departmentsService.findByOffice(officeId);
  }

  @Get(':id')
  findOne(@Param('id') id: Uuid) {
    return this.departmentsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: Uuid, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: Uuid) {
    return this.departmentsService.remove(id);
  }
}
