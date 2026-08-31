import { Injectable, Inject } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { prisma } from '../../../database/prisma.client';
import { OpenAiService } from './openai.service';
import { IdeogramService } from './ideogram.service';
import { StorageService } from '../../storage/services/storage.service';
import { getTotalCost } from '../../../config/ai-models.config';
import { normalizeImageModel } from '../../../config/image-generation.config';
import { buildImagePrompt } from './infographic-prompt.builder';

@Processor('infographic-generation')
@Injectable()
export class InfographicProcessor {
  constructor(
    @Inject(OpenAiService) private openAiService: OpenAiService,
    @Inject(IdeogramService) private ideogramService: IdeogramService,
    /** Optional for the same reason as in AiOrchestrator — existing specs construct with 2 args. */
    @Inject(StorageService) private storageService?: StorageService,
  ) {}

  /**
   * US-INFRA-002 — same upload-then-fall-back contract as `AiOrchestrator.uploadAndFallback()`.
   *
   * This legacy Bull-queue path writes `Infographic.imageUrl` exactly like the orchestrator does,
   * so leaving it out would mean rows created through this route keep rotting after the story
   * ships — a durability hole that would look fixed everywhere it was tested.
   *
   * Kept as a local copy rather than shared: the two live in different classes with different
   * logging conventions (this one uses console, the orchestrator uses logGen), and a shared
   * helper would have to abstract over both for eight lines of body.
   */
  private async uploadAndFallback(sourceUrl: string, storageKey: string): Promise<string> {
    if (!this.storageService || !sourceUrl) return sourceUrl;
    try {
      const res = await fetch(sourceUrl);
      if (!res.ok) throw new Error(`fetch ${res.status} from provider CDN`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = /\.png(\?|$)/i.test(sourceUrl) ? 'image/png' : 'image/jpeg';
      return await this.storageService.upload(buffer, storageKey, contentType);
    } catch (err: any) {
      // Non-fatal, exactly as in the orchestrator: the Ideogram fee is already spent, so failing
      // here would bill for a deliverable and then discard it.
      console.warn(`⚠️ [Processor] R2 upload failed for ${storageKey}, keeping provider URL: ${err?.message}`);
      return sourceUrl;
    }
  }

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

        // Build canonical text prompt (pure TS — FREE, no AI call)
        const imagePrompt = buildImagePrompt(propertyData, headline);
        console.log(`🎨 [Processor] Calling Ideogram for ${infographicId}...`);
        const aiModel = normalizeImageModel(propertyData.aiModel || 'ideogram-turbo');
        const orientation = propertyData.orientation || 'landscape';
        // 💰 AI CALL — Ideogram image generation (text-prompt path)
        imageUrl = await this.ideogramService.generateImage(imagePrompt, aiModel, orientation);
        console.log(`🖼️ [Processor] Got image URL: ${imageUrl.substring(0, 80)}...`);

        // US-INFRA-002 — re-host in R2 before the DB write, so the row never holds a URL we
        // intended to replace. Key matches the orchestrator's single-variation convention.
        imageUrl = await this.uploadAndFallback(imageUrl, `infographics/${infographicId}/image-v0.jpg`);
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
