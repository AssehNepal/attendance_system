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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { AuthUser } from '../../decorators/auth-user.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { OfficesService } from './offices.service';

@Controller('offices')
@ApiTags('Offices')
@UseGuards(AuthGuard())
@ApiBearerAuth()
export class OfficesController {
  constructor(private readonly officesService: OfficesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new office' })
  create(@Body() dto: CreateOfficeDto, @AuthUser() user: any) {
    return this.officesService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all offices with pagination' })
  findAll(@Query() pageOptionsDto: PageOptionsDto) {
    return this.officesService.findAll(pageOptionsDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get office by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.officesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update office by ID (partial update)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  update(@Param('id', ParseUUIDPipe) id: Uuid, @Body() dto: UpdateOfficeDto) {
    return this.officesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete office by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async remove(@Param('id', ParseUUIDPipe) id: Uuid) {
    await this.officesService.remove(id);

    return {
      success: true,
      statusCode: 200,
      message: `Office with ID ${id} has been successfully deleted`,
    };
  }
}
