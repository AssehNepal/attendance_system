import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CommentsEntity } from './comments.entity.ts';
import type { CreateCommentsDto } from './dtos/create-comments.dto.ts';
import type { UpdateCommentsDto } from './dtos/update-comments.dto.ts';
import { PageOptionsCommentsDto } from './dtos/page-options-comments.dto.ts';
import { Transactional } from 'typeorm-transactional';
import type { UserEntity } from '../user/user.entity.ts';
import type { PageDto } from 'common/dto/page.dto.ts';
import type { CommentsDto } from './dtos/comments.dto.ts';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentsEntity)
    private readonly commentsRepository: Repository<CommentsEntity>,
  ) {}

  @Transactional()
  async createComments(
    userId: string,
    createDto: CreateCommentsDto,
  ): Promise<CommentsEntity> {
    const entity = this.commentsRepository.create({
      ...createDto,
      user: { id: userId } as UserEntity,
    });

    return this.commentsRepository.save(entity);
  }

  async getAllComments(
    pageOptionsCommentsDto: PageOptionsCommentsDto,
  ): Promise<PageDto<CommentsDto>> {
    const queryBuilder = this.commentsRepository
      .createQueryBuilder('comments')
      .leftJoinAndSelect('comments.user', 'user')
      .leftJoinAndSelect('comments.post', 'post');

    const [items, pageMetaDto] = await queryBuilder.paginate(
      pageOptionsCommentsDto,
    );

    return items.toPageDto(pageMetaDto);
  }

  async getSingle(id: string): Promise<CommentsEntity> {
    const entity = await this.commentsRepository.findOneBy({ id: id as Uuid });
    if (!entity) throw new NotFoundException();
    return entity;
  }

  async update(id: string, updateDto: UpdateCommentsDto): Promise<void> {
    await this.commentsRepository.update(id, updateDto);
  }

  async delete(id: string): Promise<void> {
    await this.commentsRepository.delete(id);
  }
}
