import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AgencyService } from './agency.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { FilterAgencyDto } from './dto/filter-agency.dto';
import { QueryAgencyDto } from './dto/query-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';

@Controller('agencies')
@ApiTags('Agencies')
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agency' })
  @ApiResponse({ status: 201, description: 'Agency created successfully' })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Invalid name/code format, name/code too short or too long',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Agency with same name or code already exists',
  })
  create(@Body() createAgencyDto: CreateAgencyDto) {
    return this.agencyService.create(createAgencyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all agencies with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated agencies' })
  findAll(@Query() queryDto: QueryAgencyDto) {
    return this.agencyService.findAll(queryDto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get ALL agencies without pagination' })
  @ApiResponse({ status: 200, description: 'Returns all agencies' })
  findAllWithoutPagination() {
    return this.agencyService.findAllWithoutPagination();
  }

  @Get('search/filter')
  @ApiOperation({ summary: 'Filter agencies by criteria' })
  @ApiResponse({ status: 200, description: 'Returns filtered agencies' })
  filter(@Query() filterDto: FilterAgencyDto) {
    return this.agencyService.filter(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agency by ID' })
  @ApiResponse({ status: 200, description: 'Returns agency' })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  findOne(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.agencyService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update agency by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Agency UUID',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Agency updated successfully' })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  update(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() updateAgencyDto: UpdateAgencyDto,
  ) {
    return this.agencyService.update(id, updateAgencyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete agency by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Agency UUID',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Agency deleted successfully' })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  remove(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.agencyService.remove(id);
  }
}
