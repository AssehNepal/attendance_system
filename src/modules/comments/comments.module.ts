
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreateCommentsHandler } from './commands/create-comments.command.ts';
import { CommentsController } from './comments.controller.ts';
import { CommentsEntity } from './comments.entity.ts';
import { CommentsService } from './comments.service.ts';


@Module({
  imports: [
    TypeOrmModule.forFeature([CommentsEntity]),
  ],
  providers: [CommentsService, CreateCommentsHandler],
  controllers: [CommentsController],
})
export class CommentsModule {}