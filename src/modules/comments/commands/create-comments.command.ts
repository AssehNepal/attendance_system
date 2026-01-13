import type { ICommandHandler } from '@nestjs/cqrs';
import { CommandHandler } from '@nestjs/cqrs';
import { CreateCommentsDto } from '../dtos/create-comments.dto.ts';
import { CommentsEntity } from '../comments.entity.ts';
import { CommentsService } from '../comments.service.ts';

export class CreateCommentsCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: CreateCommentsDto,
  ) {}
}

@CommandHandler(CreateCommentsCommand)
export class CreateCommentsHandler
  implements ICommandHandler<CreateCommentsCommand>
{
  constructor(private readonly service: CommentsService) {}

  async execute(command: CreateCommentsCommand): Promise<CommentsEntity> {
    return this.service.createComments(command.userId, command.dto);
  }
}
