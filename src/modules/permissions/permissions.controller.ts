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
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { FilterPermissionDto } from './dto/filter-permission.dto';

@Controller('permissions')
@ApiTags('Permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: 'Permission created successfully' })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Invalid name/actions/subjects format or empty arrays',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Permission with same name already exists',
  })
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all permissions with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated permissions' })
  findAll(@Query() queryDto: QueryPermissionDto) {
    return this.permissionsService.findAll(queryDto);
  }

  @Get('search/filter')
  @ApiOperation({ summary: 'Filter permissions by criteria' })
  @ApiResponse({ status: 200, description: 'Returns filtered permissions' })
  filter(@Query() filterDto: FilterPermissionDto) {
    return this.permissionsService.filter(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({ status: 200, description: 'Returns permission' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  findOne(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update permission' })
  @ApiResponse({ status: 200, description: 'Permission updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete permission' })
  @ApiResponse({ status: 204, description: 'Permission deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.permissionsService.remove(id);
  }
}
