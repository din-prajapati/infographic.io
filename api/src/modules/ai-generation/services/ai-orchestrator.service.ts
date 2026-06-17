import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { OpenAiService } from './openai.service';
import { IdeogramService } from './ideogram.service';
import { getTotalCost } from '../../../config/ai-models.config';
import { normalizeImageModel } from '../../../config/image-generation.config';
import { logGen, elapsed } from '../../../common/utils/ai-gen-logger';

@Injectable()
export class AiOrchestrator {
  constructor(
    @Inject(OpenAiService) private openAiService: OpenAiService,
    @Inject(IdeogramService) private ideogramService: IdeogramService,
    @Inject(PrismaService) private prisma: PrismaService,
  ) {}

  async generateInfographic(
    infographicId: string,
    propertyData: any,
    options?: { variations?: number; style?: string; orientation?: string },
    progressGateway?: any,
  ): Promise<void> {
    const t0 = Date.now();
    const variations = options?.variations || 1;
    const style = options?.style;
    const orientation = options?.orientation || propertyData.orientation || 'landscape';
    const isDemoMode = process.env.DEMO_MODE === 'true';
    const imageModel = normalizeImageModel(propertyData.aiModel || 'ideogram-turbo');
    const textModel = 'gpt-4o';

    logGen({
      generationId: infographicId,
      event: 'gen:start',
      textModel,
      imageModel,
      variations,
      orientation,
      isDemoMode,
    });

    try {
      let headline: string;
      let imageUrls: string[] = [];

      progressGateway?.emitProgress(infographicId, {
        status: 'processing',
        step: 1,
        stepLabel: 'Analyzing property details...',
      });

      if (isDemoMode) {
        logGen({ generationId: infographicId, event: 'gen:demo', variations });
        headline = this.generateDemoHeadline(propertyData);
        for (let i = 0; i < variations; i++) {
          imageUrls.push(this.generateDemoImageUrl(propertyData, i));
        }
      } else {
        // Step 1 — Property analysis (text model)
        const t1 = Date.now();
        logGen({ generationId: infographicId, event: 'gen:headline:start', textModel });
        try {
          headline = await this.openAiService.analyzeProperty(propertyData);
          logGen({ generationId: infographicId, event: 'gen:headline:ok', textModel, durationMs: elapsed(t1) });
        } catch (err: any) {
          logGen({ generationId: infographicId, event: 'gen:headline:error', textModel, durationMs: elapsed(t1), error: err?.message }, 'error');
          progressGateway?.emitProgress(infographicId, { status: 'failed', errorMessage: 'Generation failed — please try again.' });
          throw new Error(`OpenAI generation failed: ${err?.message || 'Unknown error'}`);
        }

        progressGateway?.emitProgress(infographicId, {
          status: 'processing',
          step: 2,
          stepLabel: 'Creating image prompt...',
        });

        // Step 2 — Build image prompt + generate images
        const t2 = Date.now();
        logGen({ generationId: infographicId, event: 'gen:prompt:start', textModel });
        try {
          let imagePrompt = await this.openAiService.generateImagePrompt(propertyData, headline);
          if (style) imagePrompt = this.applyStylePreset(imagePrompt, style);
          logGen({ generationId: infographicId, event: 'gen:prompt:ok', textModel, durationMs: elapsed(t2) });

          progressGateway?.emitProgress(infographicId, {
            status: 'processing',
            step: 3,
            stepLabel: `Generating ${variations} image${variations > 1 ? 's' : ''}...`,
          });

          const t3 = Date.now();
          logGen({ generationId: infographicId, event: 'gen:image:start', imageModel, variations, orientation });

          const generationPromises = [];
          for (let i = 0; i < variations; i++) {
            const variationPrompt = variations > 1
              ? `${imagePrompt} Variation ${i + 1}: ${this.getVariationModifier(i, style)}`
              : imagePrompt;
            generationPromises.push(this.ideogramService.generateImage(variationPrompt, imageModel, orientation, infographicId));
          }

          imageUrls = await Promise.all(generationPromises);
          logGen({ generationId: infographicId, event: 'gen:image:ok', imageModel, variations: imageUrls.length, orientation, durationMs: elapsed(t3) });

          progressGateway?.emitProgress(infographicId, {
            status: 'processing',
            step: 4,
            stepLabel: 'Processing images...',
          });
        } catch (err: any) {
          logGen({ generationId: infographicId, event: 'gen:image:error', imageModel, durationMs: elapsed(t2), error: err?.message }, 'error');
          progressGateway?.emitProgress(infographicId, { status: 'failed', errorMessage: 'Image generation failed — please try again.' });
          throw new Error(`Image generation failed: ${err?.message || 'Unknown error'}`);
        }
      }

      const imageUrl = imageUrls[0] || '';
      const costUsd = isDemoMode ? 0 : getTotalCost(imageModel);

      // Step 3 — Persist to DB
      progressGateway?.emitProgress(infographicId, { status: 'processing', step: 5, stepLabel: 'Finalizing...' });

      const tDb = Date.now();
      try {
        await this.prisma.infographic.update({
          where: { id: infographicId },
          data: { imageUrl, status: 'completed' },
        });
        logGen({ generationId: infographicId, event: 'gen:db:ok', durationMs: elapsed(tDb) });
      } catch (updateErr: any) {
        logGen({ generationId: infographicId, event: 'gen:db:error', durationMs: elapsed(tDb), error: updateErr?.message }, 'error');
        if (updateErr?.message?.includes('connection') || updateErr?.code === 'P1011') {
          logGen({ generationId: infographicId, event: 'gen:db:retry' }, 'warn');
          await new Promise(resolve => setTimeout(resolve, 500));
          try {
            await this.prisma.infographic.update({ where: { id: infographicId }, data: { imageUrl, status: 'completed' } });
            logGen({ generationId: infographicId, event: 'gen:db:retry:ok' });
          } catch (retryErr: any) {
            logGen({ generationId: infographicId, event: 'gen:db:retry:error', error: retryErr?.message }, 'error');
            throw new Error(`Database update failed after retry: ${retryErr?.message}`);
          }
        } else {
          throw new Error(`Database update failed: ${updateErr?.message}`);
        }
      }

      // Step 4 — Usage record
      const createUsageRecord = async () => {
        const infographic = await this.prisma.infographic.findUnique({ where: { id: infographicId } });
        await this.prisma.usageRecord.create({
          data: { userId: infographic.userId, organizationId: infographic.organizationId, infographicId, aiModel: imageModel, costUsd, creditsUsed: 1 },
        });
      };

      try {
        await createUsageRecord();
        logGen({ generationId: infographicId, event: 'gen:usage:ok', imageModel, costUsd });
      } catch (usageErr: any) {
        logGen({ generationId: infographicId, event: 'gen:usage:retry', error: usageErr?.message }, 'warn');
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          await createUsageRecord();
          logGen({ generationId: infographicId, event: 'gen:usage:retry:ok', imageModel, costUsd });
        } catch (retryErr: any) {
          // BILLING: generation succeeded but usage not recorded — quota not decremented.
          logGen({ generationId: infographicId, event: 'gen:usage:lost', imageModel, costUsd, error: retryErr?.message }, 'error');
        }
      }

      // Step 5 — Write variations
      const updatedPropertyData = {
        ...propertyData,
        variations: imageUrls.map((url, index) => ({
          id: `${infographicId}_var_${index + 1}`,
          imageUrl: url,
          title: `Variation ${index + 1}`,
          description: this.getVariationDescription(index, style),
        })),
      };
      try {
        await this.prisma.infographic.update({ where: { id: infographicId }, data: { propertyData: updatedPropertyData as any } });
      } catch (varErr: any) {
        // Non-fatal — status=completed and imageUrl already saved; getVariations() has fallback.
        logGen({ generationId: infographicId, event: 'gen:variations:write:warn', error: varErr?.message }, 'warn');
      }

      logGen({
        generationId: infographicId,
        event: 'gen:complete',
        textModel,
        imageModel,
        variations: imageUrls.length,
        orientation,
        costUsd,
        isDemoMode,
        totalDurationMs: elapsed(t0),
      });
    } catch (error: any) {
      logGen({ generationId: infographicId, event: 'gen:failed', error: error?.message, totalDurationMs: elapsed(t0) }, 'error');
      throw error;
    }
  }

  private applyStylePreset(prompt: string, style: string): string {
    const styleModifiers: Record<string, string> = {
      modern: 'Modern, minimalist design with clean lines and contemporary typography',
      classic: 'Classic, traditional design with elegant serif fonts and timeless aesthetics',
      luxury: 'Luxury, high-end design with premium materials and sophisticated color palette',
      minimal: 'Minimalist design with lots of white space and simple, clean elements',
      vibrant: 'Vibrant, colorful design with bold typography and energetic color scheme',
      professional: 'Professional, corporate design with formal typography and conservative colors',
    };

    const modifier = styleModifiers[style] || '';
    return modifier ? `${prompt}. Style: ${modifier}` : prompt;
  }

  private getVariationModifier(index: number, style?: string): string {
    const modifiers = [
      'slightly different color scheme',
      'alternative layout arrangement',
      'different typography emphasis',
      'varied visual hierarchy',
      'alternative composition',
    ];
    return modifiers[index % modifiers.length];
  }

  private getVariationDescription(index: number, style?: string): string {
    const descriptions = [
      'Classic layout with traditional styling',
      'Modern design with contemporary elements',
      'Bold layout with vibrant colors',
    ];
    return descriptions[index % descriptions.length];
  }

  private generateDemoHeadline(propertyData: any): string {
    const templates = [
      `Stunning ${propertyData.beds}BR Home in ${propertyData.address.split(',')[0]}`,
      `Luxury Living at ${propertyData.address.split(',')[0]}`,
      `Your Dream Home Awaits - ${propertyData.beds}BR/${propertyData.baths}BA`,
      `Modern ${propertyData.propertyType} - ${propertyData.sqft} sqft`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateDemoImageUrl(propertyData: any, variationIndex: number = 0): string {
    // Different Unsplash images for variations
    const demoImages = [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=1000&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=1000&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=1000&fit=crop&q=80',
    ];
    return demoImages[variationIndex % demoImages.length];
  }
}
