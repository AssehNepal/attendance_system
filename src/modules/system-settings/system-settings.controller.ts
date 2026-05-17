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

import { AuthUser } from '../../decorators/auth-user.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { CreateSystemSettingDto } from './dto/create-system-setting.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { SystemSettingsService } from './system-settings.service';

@Controller('system-settings')
@ApiTags('System Settings')
@UseGuards(AuthGuard())
@ApiBearerAuth()
export class SystemSettingsController {
  constructor(private readonly settingsService: SystemSettingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string', example: 'site_logo' },
        value: { type: 'string', example: 'My Organisation' },
        image: { type: 'string', format: 'binary' },
      },
      required: ['key', 'value'],
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateSystemSettingDto,
    @AuthUser() user: any,
    @UploadedFile() file?: { originalname: string; buffer: Buffer },
  ) {
    const adminId = user.userType === 'staff' ? undefined : (user.id as Uuid);
    return this.settingsService.create(dto, adminId, file);
  }

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findById(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.settingsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string', example: 'site_logo' },
        value: { type: 'string', example: 'Updated Value' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  updateById(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() dto: UpdateSystemSettingDto,
    @AuthUser() user: any,
    @UploadedFile() file?: { originalname: string; buffer: Buffer },
  ) {
    const adminId = user.userType === 'staff' ? undefined : (user.id as Uuid);
    return this.settingsService.updateById(id, dto, adminId, file);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  removeById(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.settingsService.removeById(id);
  }
}
