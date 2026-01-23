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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { FilterPermissionDto } from './dto/filter-permission.dto';
import { AuthGuard } from '../../guards/auth.guard.ts';
import { RolesGuard } from '../../guards/roles.guard.ts';
import { PermissionsGuard } from '../../guards/permissions.guard.ts';
import { Roles } from '../../decorators/roles.decorator.ts';
import { RequirePermission } from '../../decorators/permission.decorator.ts';
import { RoleType } from '../../constants/role-type.ts';

@Controller('permissions')
@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(AuthGuard(), RolesGuard, PermissionsGuard)
@Roles([RoleType.SUPER_ADMIN, RoleType.ADMIN])
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @RequirePermission('create', 'Permission')
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
  @RequirePermission('read', 'Permission')
  @ApiOperation({ summary: 'Get all permissions with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated permissions' })
  findAll(@Query() queryDto: QueryPermissionDto) {
    return this.permissionsService.findAll(queryDto);
  }

  @Get('search/filter')
  @RequirePermission('read', 'Permission')
  @ApiOperation({ summary: 'Filter permissions by criteria' })
  @ApiResponse({ status: 200, description: 'Returns filtered permissions' })
  filter(@Query() filterDto: FilterPermissionDto) {
    return this.permissionsService.filter(filterDto);
  }

  @Get(':id')
  @RequirePermission('read', 'Permission')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({ status: 200, description: 'Returns permission' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  findOne(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('update', 'Permission')
  @ApiOperation({ summary: 'Update permission by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Permission UUID',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Permission updated successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  update(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @RequirePermission('delete', 'Permission')
  @ApiOperation({ summary: 'Delete permission by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Permission UUID',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Permission deleted successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  remove(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.permissionsService.remove(id);
  }
}
