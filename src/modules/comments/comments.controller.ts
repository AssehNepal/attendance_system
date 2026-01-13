import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../../decorators/http.decorators';
import { CreateCommentsDto } from './dtos/create-comments.dto.ts';
import { CommentsDto } from './dtos/comments.dto.ts';
import { PageOptionsCommentsDto } from './dtos/page-options-comments.dto.ts';
import { UpdateCommentsDto } from './dtos/update-comments.dto.ts';
import { CommentsService } from './comments.service.ts';
import { UserEntity } from '../user/user.entity.ts';
import { RoleType } from '../../constants/role-type.ts';
import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { ApiPageResponse } from '../../decorators/api-page-response.decorator.ts';

@Controller('comments')
@ApiTags('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  @Auth([RoleType.USER])
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: CommentsDto })
  async create(
    @Body() createCommentsDto: CreateCommentsDto,
    @AuthUser() user: UserEntity,
  ) {
    const entity = await this.commentsService.createComments(
      user.id,
      createCommentsDto,
    );
    return entity.toDto();
  }

  @Get()
  @Auth([RoleType.USER])
  @ApiPageResponse({ type: CommentsDto })
  @HttpCode(HttpStatus.OK)
  async getAll(@Query() pageOptionsCommentsDto: PageOptionsCommentsDto) {
    return this.commentsService.getAllComments(pageOptionsCommentsDto);
  }

  @Get(':id')
  @Auth([])
  @HttpCode(HttpStatus.OK)
  async getSingle(@Param('id') id: string): Promise<CommentsDto> {
    const entity = await this.commentsService.getSingle(id as Uuid);
    return entity.toDto();
  }

  @Patch(':id')
  @HttpCode(HttpStatus.ACCEPTED)
  update(
    @Param('id') id: string,
    @Body() updateCommentsDto: UpdateCommentsDto,
  ): Promise<void> {
    return this.commentsService.update(id as Uuid, updateCommentsDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.ACCEPTED)
  async delete(@Param('id') id: string): Promise<void> {
    await this.commentsService.delete(id as Uuid);
  }
}
