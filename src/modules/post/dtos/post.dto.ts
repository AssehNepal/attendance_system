import { ApiProperty } from '@nestjs/swagger';

import { AbstractDto } from '../../../common/dto/abstract.dto.ts';

import type { PostEntity } from '../post.entity.ts';
import type { UserEntity } from 'modules/user/user.entity.ts';
import type { CommentsEntity } from 'modules/comments/comments.entity.ts';

export class PostDto extends AbstractDto {
  @ApiProperty()
  title?: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  users!: UserEntity;

  @ApiProperty()
  comments?: CommentsEntity[];

  constructor(postEntity: PostEntity) {
    super(postEntity);
    this.users = postEntity.user;
    this.comments = postEntity.comments;
    this.title = postEntity.title;
    this.description = postEntity.description;
    this.userId = postEntity.userId;
  }
}
