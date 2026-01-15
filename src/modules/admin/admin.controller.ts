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
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { QueryAdminDto } from './dto/query-admin.dto';
import { FilterAdminDto } from './dto/filter-admin.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@Controller('admin')
@ApiTags('Admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
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
  @ApiOperation({ summary: 'Get all admins with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated admins' })
  findAll(@Query() queryDto: QueryAdminDto) {
    return this.adminService.findAll(queryDto);
  }

  @Get('search/filter')
  @ApiOperation({ summary: 'Filter admins by criteria' })
  @ApiResponse({ status: 200, description: 'Returns filtered admins' })
  filter(@Query() filterDto: FilterAdminDto) {
    return this.adminService.filter(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get admin by ID' })
  @ApiResponse({ status: 200, description: 'Returns admin' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  findOne(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.adminService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update admin' })
  @ApiResponse({ status: 200, description: 'Admin updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    return this.adminService.update(id, updateAdminDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete admin' })
  @ApiResponse({ status: 204, description: 'Admin deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.adminService.remove(id);
  }

  @Post(':id/assign-role')
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
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove role from admin' })
  @ApiResponse({ status: 204, description: 'Role removed successfully' })
  removeRole(
    @Param('adminId', ParseUUIDPipe) adminId: Uuid,
    @Param('roleId', ParseUUIDPipe) roleId: Uuid,
  ) {
    return this.adminService.removeRole(adminId, roleId);
  }
}
