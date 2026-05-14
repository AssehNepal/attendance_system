import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { AuthUser } from '../../decorators/auth-user.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Controller('departments')
@ApiTags('Departments')
@UseGuards(AuthGuard())
@ApiBearerAuth()
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new department' })
  create(@Body() dto: CreateDepartmentDto, @AuthUser() user: any) {
    return this.departmentsService.create(dto, user.officeId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments with pagination' })
  findAll(@Query() pageOptionsDto: PageOptionsDto) {
    return this.departmentsService.findAll(pageOptionsDto);
  }

  @Get('office/:officeId')
  @ApiOperation({ summary: 'Get departments by office ID' })
  @ApiParam({ name: 'officeId', type: 'string', format: 'uuid' })
  findByOffice(@Param('officeId', ParseUUIDPipe) officeId: Uuid) {
    return this.departmentsService.findByOffice(officeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update department by ID (partial update)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  update(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete department by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async remove(@Param('id', ParseUUIDPipe) id: Uuid) {
    await this.departmentsService.remove(id);

    return {
      success: true,
      statusCode: 200,
      message: `Department with ID ${id} has been successfully deleted`,
    };
  }
}
