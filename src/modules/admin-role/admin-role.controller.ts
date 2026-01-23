import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AdminRoleService } from './admin-role.service';
import { CreateAdminRoleDto } from './dto/create-admin-role.dto';
import { QueryAdminRoleDto } from './dto/query-admin-role.dto';
import { FilterAdminRoleDto } from './dto/filter-admin-role.dto';
import { AuthGuard } from '../../guards/auth.guard.ts';
import { RolesGuard } from '../../guards/roles.guard.ts';
import { PermissionsGuard } from '../../guards/permissions.guard.ts';
import { Roles } from '../../decorators/roles.decorator.ts';
import { RequirePermission } from '../../decorators/permission.decorator.ts';
import { RoleType } from '../../constants/role-type.ts';
import { UpdateAdminRoleDto } from './dto/update-admin-role.dto';

@Controller('admin-role')
@ApiTags('Admin-Role Assignments')
@ApiBearerAuth()
@UseGuards(AuthGuard(), RolesGuard, PermissionsGuard)
@Roles([RoleType.SUPER_ADMIN, RoleType.ADMIN])
export class AdminRoleController {
  constructor(private readonly adminRoleService: AdminRoleService) {}

  @Post()
  @RequirePermission('update', 'AdminRole')
  @ApiOperation({ summary: 'Assign role to admin' })
  @ApiResponse({ status: 201, description: 'Role assigned successfully' })
  @ApiResponse({
    status: 409,
    description: 'Role already assigned to this admin',
  })
  create(@Body() createAdminRoleDto: CreateAdminRoleDto) {
    return this.adminRoleService.create(createAdminRoleDto);
  }

  @Get()
  @RequirePermission('read', 'AdminRole')
  @ApiOperation({ summary: 'Get all admin-role assignments with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated admin-role assignments',
  })
  findAll(@Query() queryDto: QueryAdminRoleDto) {
    return this.adminRoleService.findAll(queryDto);
  }

  @Get('search/filter')
  @RequirePermission('read', 'AdminRole')
  @ApiOperation({ summary: 'Filter admin-role assignments by criteria' })
  @ApiResponse({
    status: 200,
    description: 'Returns filtered admin-role assignments',
  })
  filter(@Query() filterDto: FilterAdminRoleDto) {
    return this.adminRoleService.filter(filterDto);
  }

  @Get('admin/:adminId')
  @RequirePermission('read', 'AdminRole')
  @ApiOperation({ summary: 'Get all roles assigned to a specific admin' })
  @ApiResponse({ status: 200, description: 'Returns all roles for the admin' })
  findByAdminId(@Param('adminId', ParseUUIDPipe) adminId: Uuid) {
    return this.adminRoleService.findByAdminId(adminId);
  }

  @Get('role/:roleId')
  @RequirePermission('read', 'AdminRole')
  @ApiOperation({ summary: 'Get all admins assigned to a specific role' })
  @ApiResponse({ status: 200, description: 'Returns all admins with the role' })
  findByRoleId(@Param('roleId', ParseUUIDPipe) roleId: Uuid) {
    return this.adminRoleService.findByRoleId(roleId);
  }

  @Get(':id')
  @RequirePermission('read', 'AdminRole')
  @ApiOperation({ summary: 'Get admin-role assignment by ID' })
  @ApiResponse({ status: 200, description: 'Returns admin-role assignment' })
  @ApiResponse({ status: 404, description: 'Admin-role assignment not found' })
  findOne(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.adminRoleService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('update', 'AdminRole')
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Admin-Role assignment UUID',
  })
  @ApiOperation({ summary: 'Update admin-role assignment' })
  @ApiResponse({
    status: 200,
    description: 'Admin-role assignment updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Role already assigned to this admin',
  })
  update(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() updateAdminRoleDto: UpdateAdminRoleDto,
  ) {
    return this.adminRoleService.update(id, updateAdminRoleDto);
  }

  @Delete(':id')
  @RequirePermission('delete', 'AdminRole')
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Admin-Role assignment UUID',
  })
  @ApiOperation({ summary: 'Remove role from admin by assignment ID' })
  @ApiResponse({ status: 200, description: 'Role removed successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  remove(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.adminRoleService.remove(id);
  }

  @Delete('admin/:adminId/role/:roleId')
  @ApiParam({
    name: 'adminId',
    type: 'string',
    format: 'uuid',
    description: 'Admin UUID',
  })
  @ApiParam({
    name: 'roleId',
    type: 'string',
    format: 'uuid',
    description: 'Role UUID',
  })
  @ApiOperation({ summary: 'Remove specific role from admin' })
  @ApiResponse({ status: 200, description: 'Role removed successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  removeByAdminAndRole(
    @Param('adminId', ParseUUIDPipe) adminId: Uuid,
    @Param('roleId', ParseUUIDPipe) roleId: Uuid,
  ) {
    return this.adminRoleService.removeByAdminAndRole(adminId, roleId);
  }
}
