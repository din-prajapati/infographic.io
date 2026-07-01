import { Injectable, Inject } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { prisma } from '../../../database/prisma.client';
import { OpenAiService } from './openai.service';
import { IdeogramService } from './ideogram.service';
import { getTotalCost } from '../../../config/ai-models.config';
import { normalizeImageModel } from '../../../config/image-generation.config';

@Processor('infographic-generation')
@Injectable()
export class InfographicProcessor {
  constructor(
    @Inject(OpenAiService) private openAiService: OpenAiService,
    @Inject(IdeogramService) private ideogramService: IdeogramService,
  ) {}

  @Process()
  async handleInfographicGeneration(job: Job<{ infographicId: string; propertyData: any }>): Promise<void> {
    const { infographicId, propertyData } = job.data;
    const startTime = Date.now();

    // Look up plan tier for LLM routing
    let planTier = '';
    try {
      const inf = await prisma.infographic.findUnique({
        where: { id: infographicId },
        select: { organizationId: true },
      });
      if (inf?.organizationId) {
        const org = await prisma.organization.findUnique({
          where: { id: inf.organizationId },
          select: { planTier: true },
        });
        if (org?.planTier) planTier = org.planTier.toLowerCase();
      }
    } catch {
      // non-fatal — fall back to empty string → GPT-4o safe default
    }

    try {
      console.log(`📝 [Processor] Starting generation for ${infographicId}`);
      
      const isDemoMode = process.env.DEMO_MODE === 'true';
      let headline: string;
      let imageUrl: string;

      if (isDemoMode) {
        console.log(`🎭 [Processor] Demo mode - generating mock`);
        headline = this.generateDemoHeadline(propertyData);
        imageUrl = this.generateDemoImageUrl(propertyData);
      } else {
        console.log(`📊 [Processor] Calling OpenAI for ${infographicId}...`);
        headline = await this.openAiService.analyzeProperty(propertyData, planTier);
        console.log(`✍️ [Processor] Generated headline: ${headline}`);

        const imagePrompt = await this.openAiService.generateImagePrompt(propertyData, headline);
        console.log(`🎨 [Processor] Calling Ideogram for ${infographicId}...`);
        const aiModel = normalizeImageModel(propertyData.aiModel || 'ideogram-turbo');
        const orientation = propertyData.orientation || 'landscape';
        imageUrl = await this.ideogramService.generateImage(imagePrompt, aiModel, orientation);
        console.log(`🖼️ [Processor] Got image URL: ${imageUrl.substring(0, 80)}...`);
      }

      console.log(`💾 [Processor] Updating DB for ${infographicId}...`);
      await prisma.infographic.update({
        where: { id: infographicId },
        data: {
          imageUrl,
          status: 'completed',
        },
      });
      console.log(`✅ [Processor] Updated status to completed for ${infographicId}`);

      const aiModel = propertyData.aiModel || 'ideogram-turbo';
      const costUsd = isDemoMode ? 0 : getTotalCost(aiModel);

      const infographic = await prisma.infographic.findUnique({
        where: { id: infographicId },
      });

      console.log(`📊 [Processor] Creating usage record...`);
      await prisma.usageRecord.create({
        data: {
          userId: infographic.userId,
          organizationId: infographic.organizationId,
          infographicId,
          aiModel,
          costUsd,
          creditsUsed: 1,
        },
      });

      const elapsed = Date.now() - startTime;
      console.log(`✅ [Processor] COMPLETE in ${elapsed}ms - ${infographicId}`);
    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      console.error(`❌ [Processor] FAILED after ${elapsed}ms:`, error?.message || error);

      let errorMessage = error?.message || 'Unknown error';
      if (error?.message?.includes('connection') || error?.code === 'FATAL') {
        errorMessage = 'Database connection error during generation';
      }

      try {
        await prisma.infographic.update({
          where: { id: infographicId },
          data: {
            status: 'failed',
            errorMessage,
          },
        });
        console.log(`✅ [Processor] Set status to failed for ${infographicId}`);
      } catch (dbError: any) {
        console.error(`❌ [Processor] Failed to update error status:`, dbError?.message);
      }

      throw error;
    }
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

  private generateDemoImageUrl(propertyData: any): string {
    return `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=1000&fit=crop&q=80`;
  }
}
