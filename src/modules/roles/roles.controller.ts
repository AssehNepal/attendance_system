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
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { FilterRoleDto } from './dto/filter-role.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';

@Controller('roles')
@ApiTags('Roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 409, description: 'Role with name already exists' })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated roles' })
  findAll(@Query() queryDto: QueryRoleDto) {
    return this.rolesService.findAll(queryDto);
  }

  @Get('search/filter')
  @ApiOperation({ summary: 'Filter roles by criteria' })
  @ApiResponse({ status: 200, description: 'Returns filtered roles' })
  filter(@Query() filterDto: FilterRoleDto) {
    return this.rolesService.filter(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID with permissions' })
  @ApiResponse({ status: 200, description: 'Returns role' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  findOne(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete role' })
  @ApiResponse({ status: 204, description: 'Role deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.rolesService.remove(id);
  }

  @Post(':id/assign-permission')
  @ApiOperation({ summary: 'Assign permission to role' })
  @ApiResponse({ status: 201, description: 'Permission assigned successfully' })
  @ApiResponse({ status: 409, description: 'Permission already assigned' })
  assignPermission(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() assignPermissionDto: AssignPermissionDto,
  ) {
    return this.rolesService.assignPermission(id, assignPermissionDto);
  }

  @Delete(':roleId/remove-permission/:permissionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove permission from role' })
  @ApiResponse({ status: 204, description: 'Permission removed successfully' })
  removePermission(
    @Param('roleId', ParseUUIDPipe) roleId: Uuid,
    @Param('permissionId', ParseUUIDPipe) permissionId: Uuid,
  ) {
    return this.rolesService.removePermission(roleId, permissionId);
  }
}
