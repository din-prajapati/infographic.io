import { Injectable, Inject, NotFoundException, BadRequestException, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { PromptExtractorService } from './prompt-extractor.service';
import { InfographicsService } from './infographics.service';
import { AiOrchestrator } from '../../ai-generation/services/ai-orchestrator.service';
import { TemplatesService } from '../../templates/services/templates.service';
import { UsageAlertService } from './usage-alert.service';
import { GenerationProgressGateway } from '../gateways/generation-progress.gateway';
import { GenerateFromChatDto } from '../dto/generate-from-chat.dto';

export interface GenerationStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  currentStep?: string;
  errorMessage?: string;
}

export interface ResultVariation {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
}

@Injectable()
export class GenerationsService {
  constructor(
    @Inject(PromptExtractorService) private extractorService: PromptExtractorService,
    @Inject(InfographicsService) private infographicsService: InfographicsService,
    @Inject(AiOrchestrator) private aiOrchestrator: AiOrchestrator,
    @Inject(TemplatesService) private templatesService: TemplatesService,
    @Inject(UsageAlertService) private usageAlertService: UsageAlertService,
    @Inject(forwardRef(() => GenerationProgressGateway)) private progressGateway: GenerationProgressGateway,
    private prisma: PrismaService,
  ) {}

  async generateFromChat(
    dto: GenerateFromChatDto,
    userId: string,
    organizationId: string,
  ): Promise<{ id: string; status: string; conversationId?: string }> {
    console.log(`🚀 [GenerationsService] Starting chat-based generation for user ${userId}`);

    try {
      let extractedData;
      
      // If extractionId provided, fetch from database
      // Otherwise, extract from prompt
      if (dto.extractionId) {
        try {
          const extraction = await this.extractorService.getExtraction(dto.extractionId, userId);
          extractedData = extraction.extractedData;
          
          // Optionally link extraction to conversation if conversationId provided
          if (dto.conversationId && !extraction.conversationId && this.prisma && typeof (this.prisma as any).extraction !== 'undefined') {
            await this.prisma.extraction.update({
              where: { id: dto.extractionId },
              data: { conversationId: dto.conversationId },
            }).catch((err) => {
              // Log but don't fail if update fails
              console.warn(`⚠️ [GenerationsService] Failed to link extraction to conversation:`, err);
            });
          }
        } catch (extractionError: any) {
          console.error(`❌ [GenerationsService] Extraction lookup failed:`, extractionError);
          throw new BadRequestException(
            `Failed to retrieve extraction: ${extractionError?.message || 'Extraction not found'}. Please provide a prompt instead.`
          );
        }
      } else {
        // Extract property data from prompt
        try {
          const extraction = await this.extractorService.extractPropertyData(
            dto.prompt,
            undefined, // context
            userId,
            organizationId,
            dto.conversationId, // Link to conversation if provided
          );
          extractedData = extraction.extractedData;
        } catch (extractionError: any) {
          console.error(`❌ [GenerationsService] Extraction failed:`, extractionError);
          throw new BadRequestException(
            `Failed to extract property data: ${extractionError?.message || 'Invalid prompt format'}. Please provide property details like address, price, beds, baths.`
          );
        }
      }

      // Validate extracted data has minimum required fields
      if (!extractedData.address || !extractedData.price) {
        const missing = [];
        if (!extractedData.address) missing.push('address');
        if (!extractedData.price) missing.push('price');
        throw new BadRequestException(
          `Missing required fields: ${missing.join(', ')}. Please provide at least address and price in your prompt.`
        );
      }

    // Convert extracted data to GenerateInfographicDto format
    const propertyData = {
      propertyType: extractedData.propertyType || 'residential',
      listingType: extractedData.listingType || 'for_sale',
      address: extractedData.address,
      price: extractedData.price,
      beds: extractedData.beds || 0,
      baths: extractedData.baths || 0,
      sqft: extractedData.sqft || 0,
      features: extractedData.features || [],
      agent: extractedData.agent || {
        name: 'Agent',
        brokerage: '',
        brandColors: ['#1F448B', '#FFFFFF'],
      },
      aiModel: dto.model || 'ideogram-turbo',
    };

    // Generate infographic using existing service
    // Note: We'll need to modify InfographicsService to support variations
    // For now, create infographic record and trigger generation with variations
    const templateId = await this.templatesService.selectBestTemplate(propertyData);
    
    const infographic = await this.prisma.infographic.create({
      data: {
        userId,
        organizationId,
        templateId,
        propertyData: propertyData as any,
        imageUrl: '',
        aiModel: dto.model || 'ideogram-turbo',
        status: 'processing',
      },
    });

      // Emit initial progress
      this.progressGateway.emitProgress(infographic.id, {
        status: 'processing',
        step: 0,
        stepLabel: 'Starting generation...',
        progress: 0,
      });

      // Trigger async generation with variations
      Promise.resolve().then(async () => {
        try {
          await this.aiOrchestrator.generateInfographic(
            infographic.id, 
            propertyData, 
            {
              variations: dto.variations || 3,
              style: dto.style,
            },
            this.progressGateway, // Pass gateway for progress updates
          );
          
          // Emit completion
          this.progressGateway.emitProgress(infographic.id, {
            status: 'completed',
            step: 5,
            stepLabel: 'Generation complete!',
            progress: 100,
          });
          
          // Check usage alerts after successful generation
          await this.usageAlertService.checkAndAlert(organizationId);
        } catch (error: any) {
          console.error(`❌ [GenerationsService] Background generation failed:`, error);
          let errorMessage = error?.message || 'Generation failed';
          
          // Handle specific API errors
          if (error?.status === 429 || error?.code === 'insufficient_quota') {
            errorMessage = 'AI service quota exceeded. Please try again later or contact support.';
          } else if (error?.code === 'invalid_api_key') {
            errorMessage = 'AI service configuration error. Please contact support.';
          } else if (error?.message?.includes('rate limit')) {
            errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
          }

          await this.prisma.infographic.update({
            where: { id: infographic.id },
            data: {
              status: 'failed',
              errorMessage,
            },
          });

          // Emit failure
          this.progressGateway.emitProgress(infographic.id, {
            status: 'failed',
            errorMessage,
          });
        }
      });

      return {
        id: infographic.id,
        status: 'processing',
        conversationId: dto.conversationId,
      };
    } catch (error: any) {
      // Re-throw BadRequestException and NotFoundException as-is
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      // Wrap other errors
      console.error(`❌ [GenerationsService] Generation failed:`, error);
      throw new BadRequestException(
        `Failed to start generation: ${error?.message || 'Unknown error'}`
      );
    }
  }

  async getStatus(generationId: string): Promise<GenerationStatus> {
    const infographic = await this.prisma.infographic.findUnique({
      where: { id: generationId },
    });

    if (!infographic) {
      throw new NotFoundException(`Generation ${generationId} not found`);
    }

    return {
      id: infographic.id,
      status: infographic.status as any,
      errorMessage: infographic.errorMessage || undefined,
    };
  }

  async getVariations(generationId: string): Promise<ResultVariation[]> {
    const infographic = await this.prisma.infographic.findUnique({
      where: { id: generationId },
    });

    if (!infographic) {
      throw new NotFoundException(`Generation ${generationId} not found`);
    }

    if (infographic.status !== 'completed') {
      return [];
    }

    // Check if variations are stored in propertyData
    const propertyData = infographic.propertyData as any;
    if (propertyData?.variations && Array.isArray(propertyData.variations)) {
      return propertyData.variations.map((v: any) => ({
        id: v.id || `${generationId}_var_${Math.random()}`,
        imageUrl: v.imageUrl,
        title: v.title || 'Generated Infographic',
        description: v.description || 'AI-generated property infographic',
      }));
    }

    // Fallback to single variation
    return [
      {
        id: `${generationId}_var_1`,
        imageUrl: infographic.imageUrl,
        title: 'Generated Infographic',
        description: 'AI-generated property infographic',
      },
    ];
  }

  async regenerate(
    generationId: string,
    modifications: string[],
    style?: string,
  ): Promise<{ id: string; status: string }> {
    const original = await this.prisma.infographic.findUnique({
      where: { id: generationId },
    });

    if (!original) {
      throw new NotFoundException(`Generation ${generationId} not found`);
    }

    // Create new generation with modifications
    // This is a simplified version - full implementation would apply modifications to property data
    const propertyData = original.propertyData as any;
    
    // Apply modifications (simplified - would need more sophisticated logic)
    if (modifications) {
      // Parse modifications and update propertyData accordingly
      // For now, just create a new generation
    }

    const newGeneration = await this.prisma.infographic.create({
      data: {
        userId: original.userId,
        organizationId: original.organizationId,
        templateId: original.templateId,
        propertyData: propertyData,
        imageUrl: '',
        aiModel: original.aiModel,
        status: 'processing',
      },
    });

    // Trigger generation
    Promise.resolve().then(async () => {
      try {
        await this.aiOrchestrator.generateInfographic(newGeneration.id, propertyData);
      } catch (error: any) {
        await this.prisma.infographic.update({
          where: { id: newGeneration.id },
          data: {
            status: 'failed',
            errorMessage: error?.message || 'Regeneration failed',
          },
        });
      }
    });

    return {
      id: newGeneration.id,
      status: 'processing',
    };
  }
}

