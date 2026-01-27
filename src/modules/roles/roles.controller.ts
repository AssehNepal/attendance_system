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
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { AuthGuard } from '../../guards/auth.guard.ts';
import { RolesGuard } from '../../guards/roles.guard.ts';
import { PermissionsGuard } from '../../guards/permissions.guard.ts';
import { Roles } from '../../decorators/roles.decorator.ts';
import { RequirePermission } from '../../decorators/permission.decorator.ts';
import { RoleType } from '../../constants/role-type.ts';

@Controller('roles')
@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(AuthGuard(), RolesGuard, PermissionsGuard)
@Roles([RoleType.SUPER_ADMIN, RoleType.ADMIN])
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermission('create', 'Role')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Name too short or too long',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Role with same name already exists',
  })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @RequirePermission('read', 'Role')
  @ApiOperation({
    summary: 'Get all roles with optional pagination and search',
  })
  @ApiResponse({ status: 200, description: 'Returns paginated roles' })
  findAll(@Query() queryDto: QueryRoleDto) {
    return this.rolesService.findAll(queryDto);
  }

  @Get(':id')
  @RequirePermission('read', 'Role')
  @ApiOperation({ summary: 'Get role by ID with permissions' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Role UUID',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Returns role' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  findOne(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('update', 'Role')
  @ApiOperation({ summary: 'Update role by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Role UUID',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  update(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @RequirePermission('delete', 'Role')
  @ApiOperation({ summary: 'Delete role by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Role UUID',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  remove(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.rolesService.remove(id);
  }
}
