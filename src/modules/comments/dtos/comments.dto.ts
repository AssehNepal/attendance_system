import { ApiProperty } from '@nestjs/swagger';
import { AbstractDto } from '../../../common/dto/abstract.dto';
import type { CommentsEntity } from '../comments.entity';
import type { UserEntity } from 'modules/user/user.entity';
import type { PostEntity } from 'modules/post/post.entity';

export class CommentsDto extends AbstractDto {
  @ApiProperty()
  postId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  comments: string;

  @ApiProperty()
  users!: UserEntity;

  @ApiProperty()
  posts!: PostEntity;

  constructor(commentEntity: CommentsEntity) {
    super(commentEntity);

    this.postId = commentEntity.postId;
    this.userId = commentEntity.userId;
    this.users = commentEntity.user;
    this.posts = commentEntity.post;
    this.comments = commentEntity.comments;
  }
}
