import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RolePermissionService } from './role-permission.service';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { QueryRolePermissionDto } from './dto/query-role-permission.dto';
import { FilterRolePermissionDto } from './dto/filter-role-permission.dto';

@Controller('role-permission')
@ApiTags('Role-Permission Assignments')
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Post()
  @ApiOperation({ summary: 'Assign permission to role' })
  @ApiResponse({ status: 201, description: 'Permission assigned successfully' })
  @ApiResponse({ status: 409, description: 'Permission already assigned to this role' })
  create(@Body() createRolePermissionDto: CreateRolePermissionDto) {
    return this.rolePermissionService.create(createRolePermissionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all role-permission assignments with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated role-permission assignments' })
  findAll(@Query() queryDto: QueryRolePermissionDto) {
    return this.rolePermissionService.findAll(queryDto);
  }

  @Get('search/filter')
  @ApiOperation({ summary: 'Filter role-permission assignments by criteria' })
  @ApiResponse({ status: 200, description: 'Returns filtered role-permission assignments' })
  filter(@Query() filterDto: FilterRolePermissionDto) {
    return this.rolePermissionService.filter(filterDto);
  }

  @Get('role/:roleId')
  @ApiOperation({ summary: 'Get all permissions assigned to a specific role' })
  @ApiResponse({ status: 200, description: 'Returns all permissions for the role' })
  findByRoleId(@Param('roleId', ParseUUIDPipe) roleId: Uuid) {
    return this.rolePermissionService.findByRoleId(roleId);
  }

  @Get('permission/:permissionId')
  @ApiOperation({ summary: 'Get all roles assigned to a specific permission' })
  @ApiResponse({ status: 200, description: 'Returns all roles with the permission' })
  findByPermissionId(@Param('permissionId', ParseUUIDPipe) permissionId: Uuid) {
    return this.rolePermissionService.findByPermissionId(permissionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role-permission assignment by ID' })
  @ApiResponse({ status: 200, description: 'Returns role-permission assignment' })
  @ApiResponse({ status: 404, description: 'Role-permission assignment not found' })
  findOne(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.rolePermissionService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove permission from role by assignment ID' })
  @ApiResponse({ status: 204, description: 'Permission removed successfully' })
  remove(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.rolePermissionService.remove(id);
  }

  @Delete('role/:roleId/permission/:permissionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove specific permission from role' })
  @ApiResponse({ status: 204, description: 'Permission removed successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  removeByRoleAndPermission(
    @Param('roleId', ParseUUIDPipe) roleId: Uuid,
    @Param('permissionId', ParseUUIDPipe) permissionId: Uuid,
  ) {
    return this.rolePermissionService.removeByRoleAndPermission(roleId, permissionId);
  }
}
