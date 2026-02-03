import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateConversationDto, UpdateConversationDto, AddMessageDto } from '../dto/create-conversation.dto';

export interface ConversationMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  templateId?: string;
  isLoading?: boolean;
  isGenerating?: boolean;
  generationSteps?: Array<{
    id: string;
    label: string;
    status: 'pending' | 'in-progress' | 'completed';
  }>;
  currentStep?: number;
  resultPreviews?: Array<{
    id: string;
    thumbnail: string;
    title: string;
  }>;
}

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    return conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      propertyType: conv.propertyType,
      priceRange: conv.priceRange,
      messages: conv.messages.map(this.mapMessage),
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      isFavorite: conv.isFavorite,
    }));
  }

  async create(userId: string, dto: CreateConversationDto) {
    const conversation = await this.prisma.conversation.create({
      data: {
        userId,
        title: dto.title,
        propertyType: dto.propertyType,
        priceRange: dto.priceRange,
        isFavorite: false,
      },
    });

    return {
      id: conversation.id,
      title: conversation.title,
      propertyType: conversation.propertyType,
      priceRange: conversation.priceRange,
      messages: [],
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      isFavorite: conversation.isFavorite,
    };
  }

  async findOne(id: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${id} not found`);
    }

    return {
      id: conversation.id,
      title: conversation.title,
      propertyType: conversation.propertyType,
      priceRange: conversation.priceRange,
      messages: conversation.messages.map(this.mapMessage),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      isFavorite: conversation.isFavorite,
    };
  }

  async update(id: string, userId: string, dto: UpdateConversationDto) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, userId },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${id} not found`);
    }

    const updated = await this.prisma.conversation.update({
      where: { id },
      data: {
        title: dto.title !== undefined ? dto.title : conversation.title,
        isFavorite: dto.isFavorite !== undefined ? dto.isFavorite : conversation.isFavorite,
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    return {
      id: updated.id,
      title: updated.title,
      propertyType: updated.propertyType,
      priceRange: updated.priceRange,
      messages: updated.messages.map(this.mapMessage),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      isFavorite: updated.isFavorite,
    };
  }

  async delete(id: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, userId },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${id} not found`);
    }

    await this.prisma.conversation.delete({
      where: { id },
    });
  }

  async getMessages(id: string, userId: string): Promise<ConversationMessage[]> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, userId },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${id} not found`);
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { timestamp: 'asc' },
    });

    return messages.map(this.mapMessage);
  }

  async addMessage(id: string, userId: string, dto: AddMessageDto): Promise<ConversationMessage> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, userId },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${id} not found`);
    }

    // Use transaction for atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId: id,
          type: dto.type,
          content: dto.content,
        },
      });

      await tx.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      return message;
    });

    return this.mapMessage(result);
  }

  private mapMessage(msg: any): ConversationMessage {
    // Handle Prisma Message format - JSON fields are already objects
    const generationSteps = msg.generationSteps 
      ? (typeof msg.generationSteps === 'string' ? JSON.parse(msg.generationSteps) : msg.generationSteps)
      : undefined;
    
    const resultPreviews = msg.resultPreviews
      ? (typeof msg.resultPreviews === 'string' ? JSON.parse(msg.resultPreviews) : msg.resultPreviews)
      : undefined;

    return {
      id: msg.id,
      type: msg.type as 'user' | 'ai',
      content: msg.content,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
      templateId: msg.templateId || undefined,
      isLoading: undefined, // Not stored in database, can be computed if needed
      isGenerating: undefined, // Not stored in database, can be computed if needed
      generationSteps: generationSteps as Array<{
        id: string;
        label: string;
        status: 'pending' | 'in-progress' | 'completed';
      }> | undefined,
      currentStep: msg.currentStep || undefined,
      resultPreviews: resultPreviews as Array<{
        id: string;
        thumbnail: string;
        title: string;
      }> | undefined,
    };
  }
}

