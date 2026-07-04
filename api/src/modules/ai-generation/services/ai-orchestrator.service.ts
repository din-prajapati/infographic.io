import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { OpenAiService } from './openai.service';
import { IdeogramService } from './ideogram.service';
import { getTotalCost } from '../../../config/ai-models.config';
import { normalizeImageModel } from '../../../config/image-generation.config';
import { logGen, elapsed } from '../../../common/utils/ai-gen-logger';
import {
  buildImagePrompt,
  buildExpectedTexts,
  verifyAndRepairV4JsonPrompt,
  applyStylePreset,
  getVariationModifier,
} from './infographic-prompt.builder';

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

    // Look up plan tier for LLM routing (must happen before gen:start log so textModel is accurate)
    let planTier = '';
    try {
      const inf = await this.prisma.infographic.findUnique({
        where: { id: infographicId },
        select: { organizationId: true },
      });
      if (inf?.organizationId) {
        const org = await this.prisma.organization.findUnique({
          where: { id: inf.organizationId },
          select: { planTier: true },
        });
        if (org?.planTier) planTier = org.planTier.toLowerCase();
      }
    } catch {
      // non-fatal — fall back to empty string → GPT-4o safe default
    }

    const GEMINI_TIERS = new Set(['free', 'solo', 'team']);
    const textModel = GEMINI_TIERS.has(planTier) ? 'gemini-2.5-flash' : 'gpt-4o';

    console.log('\n🔵 ========== ORCHESTRATOR START ==========');
    console.log(`[Orchestrator] id=${infographicId} model=${imageModel} orient=${orientation} variations=${variations} demo=${isDemoMode}`);
    console.log('==========================================\n');

    logGen({
      generationId: infographicId,
      event: 'gen:start',
      textModel,
      imageModel,
      planTier: planTier || 'unknown',
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
        // ────────────────────────────────────────────────────────────────
        // STEP 1 — Headline
        // User-typed headline → used verbatim, FREE (no AI call).
        // Otherwise → 💰 AI CALL: LLM headline generation, tier-routed
        // (FREE/SOLO/TEAM → Gemini 2.5 Flash, BROKERAGE → GPT-4o).
        // ────────────────────────────────────────────────────────────────
        const t1 = Date.now();
        if (propertyData.headline) {
          headline = propertyData.headline;
          logGen({ generationId: infographicId, event: 'gen:headline:user-provided', value: headline });
        } else {
          logGen({ generationId: infographicId, event: 'gen:headline:start', textModel });
          try {
            headline = await this.openAiService.analyzeProperty(propertyData, planTier);
            logGen({ generationId: infographicId, event: 'gen:headline:ok', textModel, durationMs: elapsed(t1) });
          } catch (err: any) {
            logGen({ generationId: infographicId, event: 'gen:headline:error', textModel, durationMs: elapsed(t1), error: err?.message }, 'error');
            progressGateway?.emitProgress(infographicId, { status: 'failed', errorMessage: 'Generation failed — please try again.' });
            throw new Error(`OpenAI generation failed: ${err?.message || 'Unknown error'}`);
          }
        }

        progressGateway?.emitProgress(infographicId, {
          status: 'processing',
          step: 2,
          stepLabel: 'Creating image prompt...',
        });

        // ────────────────────────────────────────────────────────────────
        // STEP 2 — Build the canonical text prompt (pure TypeScript — FREE)
        // Single source of truth for ALL model families. This exact format
        // is production-proven to render clean text on every Ideogram model.
        // ────────────────────────────────────────────────────────────────
        const isV4 = imageModel.startsWith('ideogram-4');
        const t2 = Date.now();
        logGen({ generationId: infographicId, event: 'gen:prompt:start', textModel, isV4 });
        try {
          const imagePrompt = applyStylePreset(buildImagePrompt(propertyData, headline), style);
          logGen({ generationId: infographicId, event: 'gen:prompt:ok', durationMs: elapsed(t2) });

          // ────────────────────────────────────────────────────────────────
          // STEP 3 (V4 only) — Convert text prompt → art-directed json_prompt
          //   3a. 💰 AI CALL: Ideogram magic-prompt-v4 (1 call, shared by all
          //       variations). Returns layout scaffolding + typography + exact
          //       colors — the structure V4 was trained on. Hand-built JSON
          //       causes garbled filler panels (see experiment 2026-07-03).
          //   3b. Verify/repair (FREE): confirm our exact strings survived
          //       conversion; conservatively fix only what drifted.
          //   Fallback: conversion failure → V3 text path (proven quality)
          //   instead of failing the generation.
          // ────────────────────────────────────────────────────────────────
          let v4JsonPrompt: Record<string, any> | null = null;
          if (isV4) {
            try {
              const converted = await this.ideogramService.convertTextPromptToV4Json(imagePrompt, orientation, infographicId);
              const { jsonPrompt, repairs } = verifyAndRepairV4JsonPrompt(converted, buildExpectedTexts(propertyData, headline));
              if (repairs.length > 0) {
                logGen({ generationId: infographicId, event: 'v4:jsonprompt:repaired', repairs }, 'warn');
              }
              v4JsonPrompt = jsonPrompt;
            } catch (convErr: any) {
              logGen({ generationId: infographicId, event: 'v4:magicprompt:fallback-v3', error: convErr?.message }, 'warn');
              // v4JsonPrompt stays null → V3 text path below
            }
          }

          progressGateway?.emitProgress(infographicId, {
            status: 'processing',
            step: 3,
            stepLabel: `Generating ${variations} image${variations > 1 ? 's' : ''}...`,
          });

          // ────────────────────────────────────────────────────────────────
          // STEP 4 — 💰 AI CALL(s): generate images (per-image cost × variations)
          //   V4:    same json_prompt for every variation — diffusion seeds
          //          differ per call, so photo/background vary while the
          //          verified layout and exact text stay intact.
          //   V2/V3: text prompt + per-variation style modifier, magic
          //          prompt OFF (prompt rendered verbatim).
          // ────────────────────────────────────────────────────────────────
          const t3 = Date.now();
          logGen({ generationId: infographicId, event: 'gen:image:start', imageModel, variations, orientation });

          const generationPromises = [];
          for (let i = 0; i < variations; i++) {
            if (v4JsonPrompt) {
              generationPromises.push(
                this.ideogramService.generateImageV4(v4JsonPrompt, imageModel, orientation, infographicId),
              );
            } else {
              // V2/V3 — or V4 whose magic-prompt conversion failed (falls back
              // to the proven V3 endpoint via generateImage's model routing)
              const effectiveModel = isV4 ? 'ideogram-3' : imageModel;
              const variationPrompt = variations > 1
                ? `${imagePrompt}\n- Variation style: ${getVariationModifier(i)}`
                : imagePrompt;
              generationPromises.push(
                this.ideogramService.generateImage(variationPrompt, effectiveModel, orientation, infographicId),
              );
            }
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
      const costUsd = isDemoMode ? 0 : getTotalCost(imageModel, variations);

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
