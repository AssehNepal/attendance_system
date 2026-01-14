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
import { AdminRoleService } from './admin-role.service';
import { CreateAdminRoleDto } from './dto/create-admin-role.dto';
import { QueryAdminRoleDto } from './dto/query-admin-role.dto';
import { FilterAdminRoleDto } from './dto/filter-admin-role.dto';

@Controller('admin-role')
@ApiTags('Admin-Role Assignments')
export class AdminRoleController {
  constructor(private readonly adminRoleService: AdminRoleService) {}

  @Post()
  @ApiOperation({ summary: 'Assign role to admin' })
  @ApiResponse({ status: 201, description: 'Role assigned successfully' })
  @ApiResponse({ status: 409, description: 'Role already assigned to this admin' })
  create(@Body() createAdminRoleDto: CreateAdminRoleDto) {
    return this.adminRoleService.create(createAdminRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all admin-role assignments with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated admin-role assignments' })
  findAll(@Query() queryDto: QueryAdminRoleDto) {
    return this.adminRoleService.findAll(queryDto);
  }

  @Get('search/filter')
  @ApiOperation({ summary: 'Filter admin-role assignments by criteria' })
  @ApiResponse({ status: 200, description: 'Returns filtered admin-role assignments' })
  filter(@Query() filterDto: FilterAdminRoleDto) {
    return this.adminRoleService.filter(filterDto);
  }

  @Get('admin/:adminId')
  @ApiOperation({ summary: 'Get all roles assigned to a specific admin' })
  @ApiResponse({ status: 200, description: 'Returns all roles for the admin' })
  findByAdminId(@Param('adminId', ParseUUIDPipe) adminId: Uuid) {
    return this.adminRoleService.findByAdminId(adminId);
  }

  @Get('role/:roleId')
  @ApiOperation({ summary: 'Get all admins assigned to a specific role' })
  @ApiResponse({ status: 200, description: 'Returns all admins with the role' })
  findByRoleId(@Param('roleId', ParseUUIDPipe) roleId: Uuid) {
    return this.adminRoleService.findByRoleId(roleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get admin-role assignment by ID' })
  @ApiResponse({ status: 200, description: 'Returns admin-role assignment' })
  @ApiResponse({ status: 404, description: 'Admin-role assignment not found' })
  findOne(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.adminRoleService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove role from admin by assignment ID' })
  @ApiResponse({ status: 204, description: 'Role removed successfully' })
  remove(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.adminRoleService.remove(id);
  }

  @Delete('admin/:adminId/role/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove specific role from admin' })
  @ApiResponse({ status: 204, description: 'Role removed successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  removeByAdminAndRole(
    @Param('adminId', ParseUUIDPipe) adminId: Uuid,
    @Param('roleId', ParseUUIDPipe) roleId: Uuid,
  ) {
    return this.adminRoleService.removeByAdminAndRole(adminId, roleId);
  }
}
