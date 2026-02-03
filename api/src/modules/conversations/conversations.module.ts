import { Module } from '@nestjs/common';
import { ConversationsController } from './controllers/conversations.controller';
import { ConversationService } from './services/conversation.service';

@Module({
  controllers: [ConversationsController],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationsModule {}

