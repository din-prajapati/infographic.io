import { Injectable, Inject, HttpException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { OpenAiService } from './openai.service';
import { IdeogramService } from './ideogram.service';
import { LayerExtractionService } from './layer-extraction.service';
import { getTotalCost, LAYERIZE_COST_PER_IMAGE } from '../../../config/ai-models.config';
import { normalizeImageModel } from '../../../config/image-generation.config';
import { logGen, elapsed } from '../../../common/utils/ai-gen-logger';
import {
  buildImagePrompt,
  buildTextFreeImagePrompt,
  buildExpectedTexts,
  verifyAndRepairV4JsonPrompt,
  applyStylePreset,
  getVariationModifier,
} from './infographic-prompt.builder';
import { ComposedDesign, ListingField } from '../types/composed-design.types';
import { mapBlocksToFields } from './text-block.mapper';

/**
 * Return a stable cache key for a (generation, variation) pair.
 *
 * Signed CDN URLs (Ideogram, S3-compatible) carry ephemeral `exp` and `sig` query
 * params that rotate every ~24 h. Stripping them collapses all presigns of the
 * same underlying image to one key so the cache survives URL refresh. A plain
 * baseURL also resolves correctly — searchParams.delete() is a no-op when the
 * param is absent.
 *
 * If URL parsing fails (malformed input) we fall back to the raw string — the
 * cache may miss on signature rotation, but this is safer than throwing.
 */
export function composeCacheKey(imageUrl: string): string {
  try {
    const u = new URL(imageUrl);
    u.searchParams.delete('exp');
    u.searchParams.delete('sig');
    return u.toString();
  } catch {
    // Malformed URL — use as-is; misses are acceptable, errors are not.
    return imageUrl;
  }
}

@Injectable()
export class AiOrchestrator {
  constructor(
    @Inject(OpenAiService) private openAiService: OpenAiService,
    @Inject(IdeogramService) private ideogramService: IdeogramService,
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(LayerExtractionService) private layerExtractionService: LayerExtractionService,
  ) {}

  async generateInfographic(
    infographicId: string,
    propertyData: any,
    options?: {
      variations?: number;
      style?: string;
      orientation?: string;
      photoReference?: string;
      /** US-AI-051: 'editable' + real photo → text-free background prompt. */
      renderMode?: 'flat' | 'editable';
    },
    progressGateway?: any,
  ): Promise<void> {
    const t0 = Date.now();
    const variations = options?.variations || 1;
    const style = options?.style;
    const orientation = options?.orientation || propertyData.orientation || 'landscape';
    const photoReference = options?.photoReference;
    const renderMode = options?.renderMode;
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

          if (photoReference) {
            // ────────────────────────────────────────────────────────────────
            // PHOTO PATH — V4 Remix with source image (US-AI-031)
            //
            // STEP 3 (magic-prompt) is skipped entirely: no Ideogram endpoint
            // accepts both json_prompt and an input image (SPIKE-031 §4).
            // Text correctness is NOT required here — US-AI-031b extracts
            // geometry via layerize-text and re-renders canonical values as
            // canvas slots we control. The model only has to produce good
            // composition and layout.
            //
            // AC2 — clean-typography instruction: gives the downstream
            // layerize-text call the best detection surface. Curved or
            // decorative type degrades layer extraction.
            //
            // Cost: remix is priced at generate tier (see ai-models.config.ts
            // REMIX_COST comment) — this branch is cost-neutral vs. today.
            // ────────────────────────────────────────────────────────────────

            // ── US-AI-051: text-free variant for editable + real-photo path ─
            // Guard (AC7): renderMode must be exactly 'editable' AND photoReference
            // must be a non-empty string. Any other combination (flat, absent,
            // malformed, or empty-string photo) falls through to imagePrompt.
            let photoBasePrompt = imagePrompt;
            const useTextFree =
              renderMode === 'editable' &&
              typeof photoReference === 'string' &&
              photoReference.length > 0;
            if (useTextFree) {
              try {
                photoBasePrompt = applyStylePreset(
                  buildTextFreeImagePrompt(propertyData, headline),
                  style,
                );
                logGen({ generationId: infographicId, event: 'gen:prompt:textfree:ok' });
              } catch (tfErr: any) {
                // AC6 — builder failure is non-fatal; fall back to the existing
                // composed (text-baked) prompt. imagePrompt was already built above.
                logGen(
                  { generationId: infographicId, event: 'gen:prompt:textfree:fallback', error: tfErr?.message },
                  'warn',
                );
                // photoBasePrompt stays as imagePrompt (the composed variant)
              }
            }

            const cleanTypographyInstruction =
              '\n\nTypography: use clean, straight, standard sans-serif type at high contrast. ' +
              'Avoid curved, decorative or graphic-embedded text — downstream text-detection ' +
              'degrades on those styles.';
            const remixPrompt = photoBasePrompt + cleanTypographyInstruction;

            const t3 = Date.now();
            logGen({ generationId: infographicId, event: 'gen:image:start', imageModel, variations, orientation, mode: 'photo-remix' });

            const remixPromises = Array.from({ length: variations }, () =>
              this.ideogramService.composeWithSourceImage(
                remixPrompt, photoReference, imageModel, orientation, infographicId,
              ),
            );
            imageUrls = await Promise.all(remixPromises);
            logGen({ generationId: infographicId, event: 'gen:image:ok', imageModel, variations: imageUrls.length, orientation, durationMs: elapsed(t3) });
          } else {
            // ────────────────────────────────────────────────────────────────
            // NO-PHOTO PATH — existing V4 json_prompt pipeline (AC3: byte-identical)
            // Do NOT refactor this branch while in the file.
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

            // STEP 4 — 💰 AI CALL(s): generate images (per-image cost × variations)
            //   V4:    same json_prompt for every variation — diffusion seeds
            //          differ per call, so photo/background vary while the
            //          verified layout and exact text stay intact.
            //   V2/V3: text prompt + per-variation style modifier, magic
            //          prompt OFF (prompt rendered verbatim).
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
                  this.ideogramService.generateImage(variationPrompt, effectiveModel, orientation, infographicId, photoReference),
                );
              }
            }

            imageUrls = await Promise.all(generationPromises);
            logGen({ generationId: infographicId, event: 'gen:image:ok', imageModel, variations: imageUrls.length, orientation, durationMs: elapsed(t3) });
          }

          progressGateway?.emitProgress(infographicId, {
            status: 'processing',
            step: 4,
            stepLabel: 'Processing images...',
          });
        } catch (err: any) {
          logGen({ generationId: infographicId, event: 'gen:image:error', imageModel, durationMs: elapsed(t2), error: err?.message }, 'error');
          // Photo-unreadable HttpException carries a user-visible actionable message — preserve it (AC4).
          // All other errors get the generic user-facing text.
          if (err instanceof HttpException) {
            const response = err.getResponse();
            const userMessage = typeof response === 'string' ? response : err.message;
            progressGateway?.emitProgress(infographicId, { status: 'failed', errorMessage: userMessage });
            throw err;
          }
          progressGateway?.emitProgress(infographicId, { status: 'failed', errorMessage: 'Image generation failed — please try again.' });
          throw new Error(`Image generation failed: ${err?.message || 'Unknown error'}`);
        }
      }

      const imageUrl = imageUrls[0] || '';
      // costUsd applies to both photo-remix and no-photo paths: remix is priced at
      // generate tier (SPIKE-031 §5, https://ideogram.ai/api-pricing/), so the same
      // getTotalCost() formula applies. CLAUDE.md metering: creditsUsed=1 regardless
      // of path; costUsd is true provider spend, never zeroed.
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

  /**
   * Compose a `ComposedDesign` for the edit path — LAZY, never called during generate (AC2).
   *
   * Flow:
   *   1. Call LayerExtractionService to get text-erased background + detected geometry.
   *   2. If provider fails (returns null) → return the original flat image as a usable
   *      flat design with no overlay elements (AC6). creditsUsed stays at 1.
   *   3. Otherwise → bind detected blocks to canonical listing fields via mapBlocksToFields()
   *      and emit a ComposedDesign with measured/fallback elements (AC3, AC4, AC5, AC8).
   *   4. Increment costUsd on the existing UsageRecord (metering wrinkle — STORY.md §Metering).
   *      creditsUsed is NOT changed: it was set at generate time and counts generations, not
   *      edit actions. Per CLAUDE.md, costUsd is true provider spend and must never be zeroed.
   *
   * The no-photo path (generateInfographic without photoReference) is untouched — this method
   * is only invoked from GenerationsService.getComposedDesign() on user click (AC7 preserved).
   */
  async composeDesignForEdit(
    imageUrl: string,
    propertyData: any,
    infographicId: string,
  ): Promise<ComposedDesign> {
    const t0 = Date.now();
    logGen({ generationId: infographicId, event: 'edit:extract:start', imageUrl });

    // ── Cache check (AC1, AC2, AC3, AC6) ────────────────────────────────────
    // Fetch composedDesigns from DB. This is a single extra read that saves the
    // $0.09 layerize call and the 40–70 s wait on every re-compose of a variation
    // the user has already opened. Key is the stable base URL (exp/sig stripped).
    const cacheKey = composeCacheKey(imageUrl);
    const record = await this.prisma.infographic.findUnique({
      where: { id: infographicId },
      select: { composedDesigns: true },
    });
    const cachedDesigns = (record?.composedDesigns as Record<string, ComposedDesign> | null) ?? {};
    if (cacheKey in cachedDesigns) {
      logGen({
        generationId: infographicId,
        event: 'edit:compose:cache-hit',
        durationMs: elapsed(t0),
      });
      return cachedDesigns[cacheKey];
    }

    // Build canonical values from the application's own listing record (AC8).
    // headline may be absent if the user did not supply one and the LLM value was
    // not persisted — in that case the headline block will fall through to role/fallback.
    const headline = (propertyData.headline as string | undefined) ?? '';
    const expectedTexts = buildExpectedTexts(propertyData, headline);
    const canonical: Record<ListingField, string> = {
      headline: '', address: '', price: '', stats: '', agentName: '', brokerage: '',
    };
    for (const { key, value } of expectedTexts) {
      canonical[key as ListingField] = value;
    }

    // ── Extraction (lazy, on edit only — AC2) ───────────────────────────────
    const extractionResult = await this.layerExtractionService.extractTextGeometry(
      imageUrl,
      infographicId,
    );

    if (!extractionResult) {
      // Provider failed — degrade to usable flat design (AC6).
      // Background retains baked-in text; no overlay elements are emitted.
      logGen({ generationId: infographicId, event: 'edit:extract:degraded', durationMs: elapsed(t0) }, 'warn');
      return {
        backgroundUrl: imageUrl,
        elements: [],
        extraction: { attempted: true, blocksDetected: 0, matched: 0 },
        // Still return the listing values: the client can compose a layout from
        // them even though extraction found nothing. This is the common case —
        // extraction has nothing to find when the background carries no text.
        canonicalValues: canonical,
      };
    }

    const { backgroundUrl, blocks } = extractionResult;

    // ── Bind blocks to canonical fields (pure mapper — AC3, AC4, AC5, AC8) ──
    const elements = mapBlocksToFields(blocks, canonical);
    const matched = elements.filter(e => e.slot !== null && e.placement === 'measured').length;

    logGen({
      generationId: infographicId,
      event: 'edit:extract:mapped',
      blocksDetected: blocks.length,
      matched,
      fallback: elements.filter(e => e.placement === 'fallback').length,
      durationMs: elapsed(t0),
    });

    // ── Metering wrinkle (STORY.md §Metering, CLAUDE.md) ────────────────────
    // A lazy extraction call adds real provider spend ($0.09) to a generation record
    // that was already written and billed at generate time. Increment costUsd on the
    // existing UsageRecord; never touch creditsUsed (remains 1 from generate time).
    // Non-fatal if the update fails — the design is still usable.
    try {
      await this.prisma.usageRecord.update({
        where: { infographicId },
        data: { costUsd: { increment: LAYERIZE_COST_PER_IMAGE } },
      });
      logGen({ generationId: infographicId, event: 'edit:metering:ok', costIncrement: LAYERIZE_COST_PER_IMAGE });
    } catch (meteringErr: any) {
      logGen(
        { generationId: infographicId, event: 'edit:metering:error', error: meteringErr?.message },
        'warn',
      );
    }

    // ── Cache write (AC4, AC5, AC7) ─────────────────────────────────────────
    // Persist the freshly-extracted result so subsequent compose calls for the same
    // variation hit the cache instead of paying $0.09 again. The degraded path
    // (extractionResult null) already returned above — we never reach this point
    // on a failed extraction, so the null case is structurally excluded (AC5).
    //
    // Non-fatal: if the Prisma update fails the caller still receives the freshly
    // extracted design. The next request will re-extract and retry the write (AC7).
    const result: ComposedDesign = {
      backgroundUrl,
      elements,
      extraction: { attempted: true, blocksDetected: blocks.length, matched },
      canonicalValues: canonical,
    };
    try {
      const existingCache = (record?.composedDesigns as Record<string, ComposedDesign> | null) ?? {};
      await this.prisma.infographic.update({
        where: { id: infographicId },
        data: { composedDesigns: { ...existingCache, [cacheKey]: result } as any },
      });
    } catch (cacheWriteErr: any) {
      logGen(
        { generationId: infographicId, event: 'edit:compose:cache-write:error', error: cacheWriteErr?.message },
        'warn',
      );
    }

    return result;
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
