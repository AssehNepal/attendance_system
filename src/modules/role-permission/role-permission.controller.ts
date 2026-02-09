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
import { RolePermissionService } from './role-permission.service';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { QueryRolePermissionDto } from './dto/query-role-permission.dto';
import { AuthGuard } from '../../guards/auth.guard.ts';
import { RolesGuard } from '../../guards/roles.guard.ts';
import { PermissionsGuard } from '../../guards/permissions.guard.ts';
import { Roles } from '../../decorators/roles.decorator.ts';
import { RequirePermission } from '../../decorators/permission.decorator.ts';
import { RoleType } from '../../constants/role-type.ts';
import { UpdateRolePermissionDto } from './dto/update-role-permission.dto';

@Controller('role-permission')
@ApiTags('Role-Permission Assignments')
@ApiBearerAuth()
@UseGuards(AuthGuard(), RolesGuard, PermissionsGuard)
@Roles([RoleType.SUPER_ADMIN, RoleType.ADMIN])
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Post()
  @RequirePermission('update', 'RolePermission')
  @ApiOperation({ summary: 'Assign permission to role' })
  @ApiResponse({ status: 201, description: 'Permission assigned successfully' })
  @ApiResponse({
    status: 409,
    description: 'Permission already assigned to this role',
  })
  create(@Body() createRolePermissionDto: CreateRolePermissionDto) {
    return this.rolePermissionService.create(createRolePermissionDto);
  }

  @Get()
  @RequirePermission('read', 'RolePermission')
  @ApiOperation({
    summary:
      'Get all role-permission assignments with optional pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated role-permission assignments',
  })
  findAll(@Query() queryDto: QueryRolePermissionDto) {
    return this.rolePermissionService.findAll(queryDto);
  }

  @Get('all')
  @RequirePermission('read', 'RolePermission')
  @ApiOperation({
    summary: 'Get ALL role-permission assignments without pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all role-permission assignments',
  })
  findAllWithoutPagination() {
    return this.rolePermissionService.findAllWithoutPagination();
  }

  @Patch(':id')
  @RequirePermission('update', 'RolePermission')
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Role-Permission assignment UUID',
  })
  @ApiOperation({ summary: 'Update role-permission assignment' })
  @ApiResponse({
    status: 200,
    description: 'Role-permission assignment updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Permission already assigned to this role',
  })
  update(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() updateRolePermissionDto: UpdateRolePermissionDto,
  ) {
    return this.rolePermissionService.update(id, updateRolePermissionDto);
  }

  @Delete(':id')
  @RequirePermission('delete', 'RolePermission')
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Role-Permission assignment UUID',
  })
  @ApiOperation({ summary: 'Remove permission from role by assignment ID' })
  @ApiResponse({ status: 200, description: 'Permission removed successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  remove(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.rolePermissionService.remove(id);
  }

  @Delete('role/:roleId/permission/:permissionId')
  @ApiParam({
    name: 'roleId',
    type: 'string',
    format: 'uuid',
    description: 'Role UUID',
  })
  @ApiParam({
    name: 'permissionId',
    type: 'string',
    format: 'uuid',
    description: 'Permission UUID',
  })
  @ApiOperation({ summary: 'Remove specific permission from role' })
  @ApiResponse({ status: 200, description: 'Permission removed successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  removeByRoleAndPermission(
    @Param('roleId', ParseUUIDPipe) roleId: Uuid,
    @Param('permissionId', ParseUUIDPipe) permissionId: Uuid,
  ) {
    return this.rolePermissionService.removeByRoleAndPermission(
      roleId,
      permissionId,
    );
  }
}
