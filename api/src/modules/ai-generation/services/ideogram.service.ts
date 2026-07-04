import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';
import { getModelCost } from '../../../config/ai-models.config';
import {
  normalizeImageModel,
  orientationToIdeogramAspect,
  orientationToIdeogramAspectV3,
} from '../../../config/image-generation.config';
import { logGen, elapsed } from '../../../common/utils/ai-gen-logger';

// ─── Ideogram endpoints ──────────────────────────────────────────────────────
// V4 generate — multipart; json_prompt (magic prompt inherently OFF) XOR text_prompt (magic prompt forced ON)
const IDEOGRAM_V4_GENERATE_URL = 'https://api.ideogram.ai/v1/ideogram-v4/generate';
// V4 magic prompt — converts a text prompt into an art-directed V4JsonPrompt (objects, colors, typography)
const IDEOGRAM_V4_MAGIC_PROMPT_URL = 'https://api.ideogram.ai/v1/ideogram-v4/magic-prompt';
// V3 generate — multipart; supports text prompt with magic_prompt OFF (production-proven path)
const IDEOGRAM_V3_URL = 'https://api.ideogram.ai/v1/ideogram-v3/generate';
// Legacy V2 — JSON body; only valid for V_2 / V_2_TURBO model enums
const IDEOGRAM_V2_URL = 'https://api.ideogram.ai/generate';

// V4 takes pixel resolutions (24 documented options) instead of aspect-ratio strings
const V4_RESOLUTION: Record<string, string> = {
  landscape: '2560x1440',
  portrait:  '1440x2560',
  square:    '2048x2048',
};

// V4 magic-prompt endpoint takes aspect ratios, not resolutions
const V4_MAGIC_PROMPT_ASPECT: Record<string, string> = {
  landscape: '16x9',
  portrait:  '9x16',
  square:    '1x1',
};

/**
 * User-selected model tier → V4 rendering_speed.
 * DEFAULT is what the Ideogram web UI uses; never hardcode TURBO — the
 * 2026-07-03 experiment showed users picking the default model must get
 * DEFAULT-quality text rendering.
 */
const V4_RENDERING_SPEED: Record<string, string> = {
  'ideogram-4-turbo':   'TURBO',
  'ideogram-4':         'DEFAULT',
  'ideogram-4-quality': 'QUALITY',
};

const V2_MODEL_MAP: Record<string, string> = {
  'ideogram-2':       'V_2',
  'ideogram-2-turbo': 'V_2_TURBO',
};

@Injectable()
export class IdeogramService {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.IDEOGRAM_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ IDEOGRAM_API_KEY not configured. Image generation will fail with 401. Set IDEOGRAM_API_KEY environment variable to enable real generation.');
    }
  }

  /**
   * 💰 AI CALL — Ideogram V2/V3 image generation (per-image cost, see ai-models.config).
   *
   * Text-prompt path with magic_prompt OFF: the prompt is rendered verbatim.
   * Used by the V2 and V3 model families, and as the fallback when a V4
   * magic-prompt conversion fails.
   */
  async generateImage(
    prompt: string,
    model: string = 'ideogram-4',
    orientation?: string,
    generationId?: string,
  ): Promise<string> {
    const t0 = Date.now();
    const resolvedModel = normalizeImageModel(model);
    const isV2Legacy = resolvedModel in V2_MODEL_MAP;

    const aspectRatio = isV2Legacy
      ? orientationToIdeogramAspect(orientation)   // 'ASPECT_16_9' format (old API)
      : orientationToIdeogramAspectV3(orientation); // '16x9' format (V3 API)

    logGen({ generationId: generationId ?? 'unknown', event: 'image:api:start', imageModel: resolvedModel, aspectRatio });

    try {
      let imageUrl: string | undefined;

      if (isV2Legacy) {
        // Legacy path — old JSON endpoint, only supports V_2 / V_2_TURBO
        const response = await axios.post(
          IDEOGRAM_V2_URL,
          {
            image_request: {
              model: V2_MODEL_MAP[resolvedModel],
              prompt,
              aspect_ratio: aspectRatio,
              magic_prompt_option: 'OFF',
            },
          },
          { headers: { 'Api-Key': this.apiKey, 'Content-Type': 'application/json' } },
        );
        imageUrl = response.data?.data?.[0]?.url;
      } else {
        // V3 API — multipart/form-data; magic_prompt OFF sends the prompt verbatim
        const renderingSpeed = resolvedModel.includes('turbo') ? 'TURBO' : 'DEFAULT';

        const form = new FormData();
        form.append('prompt', prompt);
        form.append('magic_prompt', 'OFF');
        form.append('aspect_ratio', aspectRatio);
        form.append('style_type', 'DESIGN');
        form.append('rendering_speed', renderingSpeed);

        const response = await axios.post(IDEOGRAM_V3_URL, form, {
          // Do NOT set Content-Type here — axios must set the multipart boundary automatically
          headers: { 'Api-Key': this.apiKey },
        });
        imageUrl = response.data?.data?.[0]?.url;
      }

      if (imageUrl) {
        logGen({ generationId: generationId ?? 'unknown', event: 'image:api:ok', imageModel: resolvedModel, durationMs: elapsed(t0) });
        return imageUrl;
      }

      throw new Error('No image URL in response');
    } catch (error: any) {
      logGen({
        generationId: generationId ?? 'unknown',
        event: 'image:api:error',
        imageModel: resolvedModel,
        durationMs: elapsed(t0),
        error: error.response?.data?.message || error.message,
        httpStatus: error.response?.status,
      }, 'error');
      throw new HttpException(
        error.response?.data?.message || 'Failed to generate image',
        error.response?.status || 500,
      );
    }
  }

  /**
   * 💰 AI CALL — Ideogram V4 magic-prompt (one call per V4 generation, all variations share it).
   *
   * Converts our canonical text prompt into an art-directed V4JsonPrompt:
   * layout scaffolding (panels, rules, cards) as obj elements, exact hex
   * colors, per-element typography — the structure V4 was trained to consume.
   * Skipping this step and hand-building the JSON causes the model to invent
   * filler panels full of garbled pseudo-text (experiment 2026-07-03, E1/E2).
   */
  async convertTextPromptToV4Json(
    textPrompt: string,
    orientation?: string,
    generationId?: string,
  ): Promise<Record<string, any>> {
    const t0 = Date.now();
    const aspectRatio = V4_MAGIC_PROMPT_ASPECT[orientation || 'landscape'] || V4_MAGIC_PROMPT_ASPECT.landscape;

    logGen({ generationId: generationId ?? 'unknown', event: 'v4:magicprompt:start', aspectRatio });

    try {
      const response = await axios.post(
        IDEOGRAM_V4_MAGIC_PROMPT_URL,
        { text_prompt: textPrompt, aspect_ratio: aspectRatio },
        { headers: { 'Api-Key': this.apiKey, 'Content-Type': 'application/json' } },
      );

      const jsonPrompt = response.data?.json_prompt;
      if (!jsonPrompt) throw new Error('No json_prompt in magic-prompt response');

      logGen({ generationId: generationId ?? 'unknown', event: 'v4:magicprompt:ok', durationMs: elapsed(t0) });
      return jsonPrompt;
    } catch (error: any) {
      logGen({
        generationId: generationId ?? 'unknown',
        event: 'v4:magicprompt:error',
        durationMs: elapsed(t0),
        error: error.response?.data?.message || error.message,
        httpStatus: error.response?.status,
      }, 'error');
      // Caller falls back to the proven V3 text path — do not swallow silently
      throw new HttpException(
        error.response?.data?.message || 'Magic prompt conversion failed',
        error.response?.status || 500,
      );
    }
  }

  /**
   * 💰 AI CALL — Ideogram V4 image generation (per-image cost, see ai-models.config).
   *
   * json_prompt path: magic prompt is inherently OFF, every text element is
   * rendered verbatim. `model` selects rendering_speed — the quality lever
   * for text fidelity (TURBO only when the user explicitly picked the turbo tier).
   */
  async generateImageV4(
    jsonPrompt: Record<string, any>,
    model: string,
    orientation?: string,
    generationId?: string,
  ): Promise<string> {
    const t0 = Date.now();
    const resolution = V4_RESOLUTION[orientation || 'landscape'] || V4_RESOLUTION.landscape;
    const renderingSpeed = V4_RENDERING_SPEED[normalizeImageModel(model)] || 'DEFAULT';

    logGen({ generationId: generationId ?? 'unknown', event: 'image:api:start', imageModel: 'ideogram-4', aspectRatio: resolution, renderingSpeed });

    try {
      const form = new FormData();
      form.append('json_prompt', JSON.stringify(jsonPrompt));
      form.append('rendering_speed', renderingSpeed);
      form.append('resolution', resolution);

      const response = await axios.post(IDEOGRAM_V4_GENERATE_URL, form, {
        // Do NOT set Content-Type here — axios must set the multipart boundary automatically
        headers: { 'Api-Key': this.apiKey },
      });

      const imageUrl: string | undefined = response.data?.data?.[0]?.url;
      if (imageUrl) {
        logGen({ generationId: generationId ?? 'unknown', event: 'image:api:ok', imageModel: 'ideogram-4', durationMs: elapsed(t0) });
        return imageUrl;
      }

      throw new Error('No image URL in V4 response');
    } catch (error: any) {
      logGen({
        generationId: generationId ?? 'unknown',
        event: 'image:api:error',
        imageModel: 'ideogram-4',
        durationMs: elapsed(t0),
        error: error.response?.data?.message || error.message,
        httpStatus: error.response?.status,
      }, 'error');
      throw new HttpException(
        error.response?.data?.message || 'Failed to generate V4 image',
        error.response?.status || 500,
      );
    }
  }

  getCostPerImage(model: string): number {
    return getModelCost(normalizeImageModel(model));
  }
}
