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
import { OfficeLocationService } from './office-location.service';
import { CreateOfficeLocationDto } from './dto/create-office-location.dto';
import { UpdateOfficeLocationDto } from './dto/update-office-location.dto';
import { QueryOfficeLocationDto } from './dto/query-office-location.dto';
import { AuthGuard } from '../../guards/auth.guard.ts';
import { RolesGuard } from '../../guards/roles.guard.ts';
import { PermissionsGuard } from '../../guards/permissions.guard.ts';
import { Roles } from '../../decorators/roles.decorator.ts';
import { RequirePermission } from '../../decorators/permission.decorator.ts';
import { RoleType } from '../../constants/role-type.ts';

@Controller('office-locations')
@ApiTags('Office Locations')
@ApiBearerAuth()
@UseGuards(AuthGuard(), RolesGuard, PermissionsGuard)
@Roles([RoleType.SUPER_ADMIN, RoleType.ADMIN])
export class OfficeLocationController {
  constructor(private readonly officeLocationService: OfficeLocationService) {}

  @Post()
  @RequirePermission('create', 'OfficeLocation')
  @ApiOperation({ summary: 'Create a new office location' })
  @ApiResponse({
    status: 201,
    description: 'Office location created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Name too short or too long',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Office location with same name already exists',
  })
  create(@Body() createOfficeLocationDto: CreateOfficeLocationDto) {
    return this.officeLocationService.create(createOfficeLocationDto);
  }

  @Get()
  @RequirePermission('read', 'OfficeLocation')
  @ApiOperation({ summary: 'Get all office locations with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated office locations',
  })
  findAll(@Query() queryDto: QueryOfficeLocationDto) {
    return this.officeLocationService.findAll(queryDto);
  }

  //   @Get('search/filter')
  //   @RequirePermission('read', 'OfficeLocation')
  //   @ApiOperation({ summary: 'Filter office locations by criteria' })
  //   @ApiResponse({
  //     status: 200,
  //     description: 'Returns filtered office locations',
  //   })
  //   filter(@Query() filterDto: FilterOfficeLocationDto) {
  //     return this.officeLocationService.filter(filterDto);
  //   }

  @Get(':id')
  @RequirePermission('read', 'OfficeLocation')
  @ApiOperation({ summary: 'Get office location by ID' })
  @ApiResponse({ status: 200, description: 'Returns office location' })
  @ApiResponse({ status: 404, description: 'Office location not found' })
  findOne(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.officeLocationService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('update', 'OfficeLocation')
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Office location UUID',
  })
  @ApiOperation({ summary: 'Update office location' })
  @ApiResponse({
    status: 200,
    description: 'Office location updated successfully',
  })
  update(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() updateOfficeLocationDto: UpdateOfficeLocationDto,
  ) {
    return this.officeLocationService.update(id, updateOfficeLocationDto);
  }

  @Delete(':id')
  @RequirePermission('delete', 'OfficeLocation')
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Office location UUID',
  })
  @ApiOperation({ summary: 'Delete office location' })
  @ApiResponse({
    status: 200,
    description: 'Office location deleted successfully',
  })
  remove(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.officeLocationService.remove(id);
  }
}
