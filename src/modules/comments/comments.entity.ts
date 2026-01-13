import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { AbstractEntity } from '../../common/abstract.entity.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { CommentsDto } from './dtos/comments.dto.ts';
import { PostEntity } from '../post/post.entity.ts';
import { UserEntity } from '../user/user.entity.ts';

@Entity({ name: 'comments' })
@UseDto(CommentsDto)
export class CommentsEntity extends AbstractEntity<CommentsDto> {
  @Column({ type: 'uuid', name: 'post_id', nullable: false })
  postId!: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: false })
  userId!: string;

  @Column({ type: 'varchar', length: 255, nullable: false, name: 'comments' })
  comments!: string;

  @ManyToOne(() => PostEntity, (postEntity) => postEntity.comments, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'post_id' })
  post!: Relation<PostEntity>;

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.comments, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<UserEntity>;
}
