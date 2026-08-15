import { Injectable, Inject, NotFoundException, BadRequestException, HttpException, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { PromptExtractorService } from './prompt-extractor.service';
import { InfographicsService } from './infographics.service';
import { AiOrchestrator } from '../../ai-generation/services/ai-orchestrator.service';
import { TemplatesService } from '../../templates/services/templates.service';
import { UsageAlertService } from './usage-alert.service';
import { UsageLimitService, EditableRequiresUpgradeException } from './usage-limit.service';
import { composeCacheKey } from '../../ai-generation/services/ai-orchestrator.service';
import { GenerationProgressGateway } from '../gateways/generation-progress.gateway';
import { GenerateFromChatDto } from '../dto/generate-from-chat.dto';
import { ComposedDesign } from '../../ai-generation/types/composed-design.types';

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
    @Inject(UsageLimitService) private usageLimitService: UsageLimitService,
    @Inject(forwardRef(() => GenerationProgressGateway)) private progressGateway: GenerationProgressGateway,
    @Inject(PrismaService) private prisma: PrismaService,
  ) {}

  async generateFromChat(
    dto: GenerateFromChatDto,
    userId: string,
    organizationId: string | null,
  ): Promise<{ id: string; status: string; conversationId?: string }> {
    console.log(`🚀 [GenerationsService] Starting chat-based generation for user ${userId}`);

    const resolvedOrgId = await this.usageLimitService.assertCanGenerateForUser(userId, 1);

    try {
      let extractedData;
      
      // If extractionId provided, fetch from database
      // Otherwise, extract from prompt
      if (dto.extractionId) {
        try {
          const extraction = await this.extractorService.getExtraction(dto.extractionId, userId);
          extractedData = extraction.extractedData;
          
          // Optionally link extraction to conversation if conversationId provided and exists in DB
          if (dto.conversationId && !extraction.conversationId && this.prisma && typeof (this.prisma as any).extraction !== 'undefined') {
            const convExists = await this.prisma.conversation.findUnique({
              where: { id: dto.conversationId },
              select: { id: true },
            }).catch(() => null);

            if (convExists) {
              await this.prisma.extraction.update({
                where: { id: dto.extractionId },
                data: { conversationId: dto.conversationId },
              }).catch((err) => {
                console.warn(`⚠️ [GenerationsService] Failed to link extraction to conversation:`, err);
              });
            }
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

      /* 
      // Original strict validation disabled for testing
      if (!extractedData.address || !extractedData.price) {
        const missing = [];
        if (!extractedData.address) missing.push('address');
        if (!extractedData.price) missing.push('price');
        throw new BadRequestException(
          `Missing required fields: ${missing.join(', ')}. Please provide at least address and price in your prompt.`
        );
      }
      */

    // Convert extracted data to GenerateInfographicDto format
    // dto.agent overrides extractor results — enables AgentInfoForm values to reach generation
    const extractedAgent = extractedData.agent || {};
    const dtoAgent = dto.agent || {};
    const agentData = {
      name: dtoAgent.name || extractedAgent.name || 'Agent',
      brokerage: dtoAgent.brokerage ?? extractedAgent.brokerage ?? '',
      phone: dtoAgent.phone ?? extractedAgent.phone ?? '',
      email: dtoAgent.email ?? extractedAgent.email ?? '',
      // dto.agent.brandColors (from sidebar palette) > extracted > hardcoded defaults
      brandColors:
        (dtoAgent.brandColors && dtoAgent.brandColors.length > 0)
          ? dtoAgent.brandColors
          : (extractedAgent.brandColors && extractedAgent.brandColors.length > 0)
            ? extractedAgent.brandColors
            : ['#1F448B', '#FFFFFF'],
    };

    const propertyData = {
      propertyType: extractedData.propertyType || 'residential',
      listingType: extractedData.listingType || 'for_sale',
      address: extractedData.address,
      price: extractedData.price,
      beds: extractedData.beds || 0,
      baths: extractedData.baths || 0,
      sqft: extractedData.sqft || 0,
      features: extractedData.features || [],
      agent: agentData,
      aiModel: dto.model || 'ideogram-turbo',
      orientation: dto.orientation || 'landscape',
      // undefined = no user headline → orchestrator will call LLM to generate one
      headline: dto.headline?.trim() || undefined,
      // US-GEN-003: output formatting only — resolved client-side, never derived from
      // billing. Both undefined = passthrough (echo what the user typed, invent nothing).
      locale: dto.locale,
      currencyToken: dto.currencyToken,
    };

    // Generate infographic using existing service
    // Note: We'll need to modify InfographicsService to support variations
    // For now, create infographic record and trigger generation with variations
    const templateId = await this.templatesService.selectBestTemplate(propertyData);
    
    const infographic = await this.prisma.infographic.create({
      data: {
        userId,
        organizationId: resolvedOrgId,
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
              orientation: dto.orientation || 'landscape',
              photoReference: dto.photoReference,
              // US-AI-051: thread renderMode so the orchestrator can select the
              // text-free prompt variant when editable + real-photo are combined.
              renderMode: dto.renderMode,
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
          await this.usageAlertService.checkAndAlert(resolvedOrgId);
        } catch (error: any) {
          console.error(`❌ [GenerationsService] Background generation failed:`, error);
          let errorMessage = error?.message || 'Generation failed';

          // Handle specific API errors
          if (error instanceof HttpException) {
            // Photo-unreadable and other HttpExceptions carry user-actionable messages
            // from the orchestrator (AC4 — surfaces the photo error distinctly).
            const response = error.getResponse();
            errorMessage = typeof response === 'string' ? response : error.message;
          } else if (error?.status === 429 || error?.code === 'insufficient_quota') {
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

  /**
   * Return a ComposedDesign for a specific variation when the user clicks "Edit" (AC2).
   *
   * Lazy extraction: this is the ONLY path that calls LayerExtractionService. The generate
   * path (generateFromChat) is untouched — extraction runs exclusively here (AC2, AC7).
   *
   * Metering is handled inside AiOrchestrator.composeDesignForEdit(), which increments
   * costUsd on the existing UsageRecord without touching creditsUsed (STORY.md §Metering).
   *
   * US-LAUNCH-015: this is also where editable-design monetization gates live —
   * FREE tier's lifetime trial (AC1/AC2) and paid tiers' extra-compose credit
   * (AC3/AC4). Both checks happen BEFORE the (possibly $0.09) extraction call,
   * not after, so a blocked request never spends provider money. Cache hits
   * bypass both gates entirely — they cost nothing and were already paid for.
   *
   * @param infographicId   The generation whose variation the user is editing
   * @param variationImageUrl  The flat composition URL chosen by the user
   */
  async getComposedDesign(
    infographicId: string,
    variationImageUrl: string,
  ): Promise<ComposedDesign> {
    const infographic = await this.prisma.infographic.findUnique({
      where: { id: infographicId },
      select: { id: true, propertyData: true, status: true, organizationId: true, composedDesigns: true },
    });

    if (!infographic) {
      throw new NotFoundException(`Generation ${infographicId} not found`);
    }

    const existingCache = (infographic.composedDesigns as Record<string, ComposedDesign> | null) ?? {};
    const cacheKey = composeCacheKey(variationImageUrl);
    const isCacheHit = cacheKey in existingCache;
    // A distinct compose already exists on THIS generation — the next one (if
    // allowed at all) is an "extra" one. Meaningless on the cache-hit path
    // (no new compose happens) and always false on a passing FREE-tier path
    // (see below), so it only ever drives a real charge on paid tiers.
    const isExtraCompose = !isCacheHit && Object.keys(existingCache).length > 0;

    // Cache hits are free and already paid for — no gate, no credit, on any tier.
    if (!isCacheHit) {
      const { planTier } = await this.usageLimitService.getEffectiveTier(infographic.organizationId);
      const tier = (planTier || 'free').toLowerCase();

      if (tier === 'free') {
        // AC1/AC2: FREE gets exactly one compose, ever, org-wide — not per
        // generation. hasUsedEditableTrial is org-wide, so if it's false here,
        // no infographic in the org has a cache entry yet — isExtraCompose
        // (computed from THIS infographic's cache) is therefore also false;
        // a passing FREE request never reaches the extra-credit charge below.
        if (await this.usageLimitService.hasUsedEditableTrial(infographic.organizationId)) {
          throw new EditableRequiresUpgradeException();
        }
      } else if (isExtraCompose) {
        // AC3/AC4: paid tiers get the first distinct variation per generation
        // free; each additional distinct variation on the same generation
        // costs a credit, subject to the same monthly limit the generate
        // path enforces. Checked BEFORE extraction so a blocked request
        // never spends the $0.09.
        await this.usageLimitService.assertCanGenerate(infographic.organizationId, 1);
      }
    }

    return this.aiOrchestrator.composeDesignForEdit(
      variationImageUrl,
      infographic.propertyData as any,
      infographicId,
      { chargeCredit: isExtraCompose },
    );
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

    if (original.organizationId) {
      await this.usageLimitService.assertCanGenerate(original.organizationId, 1);
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

    this.progressGateway.emitProgress(newGeneration.id, {
      status: 'processing',
      step: 0,
      stepLabel: 'Starting regeneration...',
      progress: 0,
    });

    Promise.resolve().then(async () => {
      try {
        await this.aiOrchestrator.generateInfographic(
          newGeneration.id,
          propertyData,
          { style },
          this.progressGateway,
        );

        this.progressGateway.emitProgress(newGeneration.id, {
          status: 'completed',
          step: 5,
          stepLabel: 'Regeneration complete!',
          progress: 100,
        });
      } catch (error: any) {
        await this.prisma.infographic.update({
          where: { id: newGeneration.id },
          data: {
            status: 'failed',
            errorMessage: error?.message || 'Regeneration failed',
          },
        });

        this.progressGateway.emitProgress(newGeneration.id, {
          status: 'failed',
          errorMessage: error?.message || 'Regeneration failed',
        });
      }
    });

    return {
      id: newGeneration.id,
      status: 'processing',
    };
  }
}

