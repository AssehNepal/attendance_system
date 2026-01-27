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
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { QueryAdminDto } from './dto/query-admin.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { AuthGuard } from '../../guards/auth.guard.ts';
import { RolesGuard } from '../../guards/roles.guard.ts';
import { PermissionsGuard } from '../../guards/permissions.guard.ts';
import { Roles } from '../../decorators/roles.decorator.ts';
import { RequirePermission } from '../../decorators/permission.decorator.ts';
import { RoleType } from '../../constants/role-type.ts';

@Controller('admin')
@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard(), RolesGuard, PermissionsGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @Roles([RoleType.SUPER_ADMIN, RoleType.ADMIN])
  @RequirePermission('create', 'Admin')
  @ApiOperation({ summary: 'Create a new admin (super admin only)' })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Invalid CID format, password too short, invalid UUID format, invalid email format, or invalid mobile number format',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Office location or agency does not exist',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Admin with CID already exists',
  })
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Get()
  @Roles([RoleType.SUPER_ADMIN, RoleType.ADMIN])
  @RequirePermission('read', 'Admin')
  @ApiOperation({
    summary: 'Get all admins with optional pagination and filters',
  })
  @ApiResponse({ status: 200, description: 'Returns paginated admins' })
  findAll(@Query() queryDto: QueryAdminDto) {
    return this.adminService.findAll(queryDto);
  }

  @Get('all/list')
  @Roles([RoleType.SUPER_ADMIN, RoleType.ADMIN])
  @RequirePermission('read', 'Admin')
  @ApiOperation({ summary: 'Get all admins without filters or pagination' })
  @ApiResponse({ status: 200, description: 'Returns all admins' })
  getAllAdmins() {
    return this.adminService.getAllAdmins();
  }

  @Get(':id')
  @Roles([RoleType.SUPER_ADMIN, RoleType.ADMIN])
  @RequirePermission('read', 'Admin')
  @ApiOperation({ summary: 'Get admin by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Admin UUID',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Returns admin' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  findOne(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.adminService.findOne(id);
  }

  @Patch(':id')
  @Roles([RoleType.SUPER_ADMIN, RoleType.ADMIN])
  @RequirePermission('update', 'Admin')
  @ApiOperation({ summary: 'Update admin by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Admin UUID',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Admin updated successfully' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  update(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    return this.adminService.update(id, updateAdminDto);
  }

  @Delete(':id')
  @Roles([RoleType.SUPER_ADMIN, RoleType.ADMIN])
  @RequirePermission('delete', 'Admin')
  @ApiOperation({ summary: 'Delete admin by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Admin UUID',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Admin deleted successfully' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  remove(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.adminService.remove(id);
  }

  @Post(':id/assign-role')
  @Roles([RoleType.SUPER_ADMIN, RoleType.ADMIN])
  @RequirePermission('update', 'Admin')
  @ApiOperation({ summary: 'Assign role to admin' })
  @ApiResponse({ status: 201, description: 'Role assigned successfully' })
  @ApiResponse({ status: 409, description: 'Role already assigned' })
  assignRole(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() assignRoleDto: AssignRoleDto,
  ) {
    return this.adminService.assignRole(id, assignRoleDto);
  }

  @Delete(':adminId/remove-role/:roleId')
  @ApiOperation({ summary: 'Remove role from admin' })
  @ApiParam({
    name: 'adminId',
    type: 'string',
    description: 'Admin UUID',
    format: 'uuid',
  })
  @ApiParam({
    name: 'roleId',
    type: 'string',
    description: 'Role UUID',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Role removed successfully' })
  @ApiResponse({ status: 404, description: 'Admin or role not found' })
  removeRole(
    @Param('adminId', ParseUUIDPipe) adminId: Uuid,
    @Param('roleId', ParseUUIDPipe) roleId: Uuid,
  ) {
    return this.adminService.removeRole(adminId, roleId);
  }
}
