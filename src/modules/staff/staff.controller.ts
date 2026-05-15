import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { AuthUser } from '../../decorators/auth-user.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffService } from './staff.service';

@Controller('staff')
@ApiTags('Staff')
@UseGuards(AuthGuard())
@ApiBearerAuth()
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        departmentId: {
          type: 'string',
          format: 'uuid',
          example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        },
        employeeId: { type: 'string', example: 'EMP-001' },
        cidNo: { type: 'string', example: '11501000001' },
        name: { type: 'string', example: 'Dorji Wangchuk' },
        contactNo: { type: 'string', example: '17123456' },
        email: { type: 'string', example: 'dorji@gov.bt' },
        password: { type: 'string', example: 'P@ssw0rd123' },
        employmentType: {
          type: 'string',
          enum: ['regular', 'contract', 'deputation'],
          example: 'regular',
        },
        isActive: { type: 'boolean', example: true },
        photo: { type: 'string', format: 'binary' },
      },
      required: ['departmentId', 'employeeId', 'name', 'contactNo'],
    },
  })
  @UseInterceptors(FileInterceptor('photo'))
  create(
    @Body() dto: CreateStaffDto,
    @AuthUser() user: any,
    @UploadedFile() file?: { originalname: string; buffer: Buffer },
  ) {
    return this.staffService.create(dto, user.officeId, file);
  }

  @Get()
  findAll(@Query() pageOptionsDto: PageOptionsDto) {
    return this.staffService.findAll(pageOptionsDto);
  }

  @Get('office/:officeId')
  @ApiParam({ name: 'officeId', type: 'string', format: 'uuid' })
  findByOffice(@Param('officeId', ParseUUIDPipe) officeId: Uuid) {
    return this.staffService.findByOffice(officeId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  update(@Param('id', ParseUUIDPipe) id: Uuid, @Body() dto: UpdateStaffDto) {
    return this.staffService.update(id, dto);
  }

  @Patch(':id/photo')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { photo: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('photo'))
  uploadPhoto(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @UploadedFile() file: { originalname: string; buffer: Buffer },
  ) {
    return this.staffService.uploadPhoto(id, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.staffService.remove(id);
  }
}
