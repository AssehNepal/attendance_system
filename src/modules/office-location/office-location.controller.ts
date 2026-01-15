import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OfficeLocationService } from './office-location.service';
import { CreateOfficeLocationDto } from './dto/create-office-location.dto';
import { UpdateOfficeLocationDto } from './dto/update-office-location.dto';
import { QueryOfficeLocationDto } from './dto/query-office-location.dto';
import { FilterOfficeLocationDto } from './dto/filter-office-location.dto';

@Controller('office-locations')
@ApiTags('Office Locations')
export class OfficeLocationController {
  constructor(private readonly officeLocationService: OfficeLocationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new office location' })
  @ApiResponse({
    status: 201,
    description: 'Office location created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Name too short or too long',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Office location with same name already exists',
  })
  create(@Body() createOfficeLocationDto: CreateOfficeLocationDto) {
    return this.officeLocationService.create(createOfficeLocationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all office locations with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated office locations',
  })
  findAll(@Query() queryDto: QueryOfficeLocationDto) {
    return this.officeLocationService.findAll(queryDto);
  }

  @Get('search/filter')
  @ApiOperation({ summary: 'Filter office locations by criteria' })
  @ApiResponse({
    status: 200,
    description: 'Returns filtered office locations',
  })
  filter(@Query() filterDto: FilterOfficeLocationDto) {
    return this.officeLocationService.filter(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get office location by ID' })
  @ApiResponse({ status: 200, description: 'Returns office location' })
  @ApiResponse({ status: 404, description: 'Office location not found' })
  findOne(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.officeLocationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update office location' })
  @ApiResponse({
    status: 200,
    description: 'Office location updated successfully',
  })
  update(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() updateOfficeLocationDto: UpdateOfficeLocationDto,
  ) {
    return this.officeLocationService.update(id, updateOfficeLocationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete office location' })
  @ApiResponse({
    status: 204,
    description: 'Office location deleted successfully',
  })
  remove(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.officeLocationService.remove(id);
  }
}
