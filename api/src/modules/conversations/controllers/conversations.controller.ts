import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConversationService } from '../services/conversation.service';
import { CreateConversationDto, UpdateConversationDto, AddMessageDto } from '../dto/create-conversation.dto';

@ApiTags('conversations')
@Controller('conversations')
export class ConversationsController {
  constructor(
    @Inject(ConversationService) private readonly conversationService: ConversationService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all conversations for current user' })
  async findAll(@Req() req: any) {
    const userId = req.user.id;
    return this.conversationService.findAll(userId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new conversation' })
  async create(@Body() dto: CreateConversationDto, @Req() req: any) {
    const userId = req.user.id;
    return this.conversationService.create(userId, dto);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get conversation by ID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.conversationService.findOne(id, userId);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update conversation' })
  async update(@Param('id') id: string, @Body() dto: UpdateConversationDto, @Req() req: any) {
    const userId = req.user.id;
    return this.conversationService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete conversation' })
  async delete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    await this.conversationService.delete(id, userId);
    return { message: 'Conversation deleted successfully' };
  }

  @Get(':id/messages')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all messages in a conversation' })
  async getMessages(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.conversationService.getMessages(id, userId);
  }

  @Post(':id/messages')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a message to a conversation' })
  async addMessage(@Param('id') id: string, @Body() dto: AddMessageDto, @Req() req: any) {
    const userId = req.user.id;
    return this.conversationService.addMessage(id, userId, dto);
  }
}

