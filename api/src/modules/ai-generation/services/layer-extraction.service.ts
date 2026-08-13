/**
 * LayerExtractionService — the single adapter seam where the extraction provider is known.
 *
 * Everything downstream sees only our types (ExtractedTextBlock). Raw provider payloads
 * never escape this file. Capability is named for the operation, not the vendor — per
 * team rule feedback-generic-ai-naming. Swapping the underlying provider (tracked as B-17)
 * requires changing only this file.
 *
 * AC6: provider failure returns null; callers must degrade to a usable flat design.
 * AC2: this service is called on the EDIT action only, never at generate time.
 */

import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { logGen, elapsed } from '../../../common/utils/ai-gen-logger';
import { ExtractedTextBlock } from '../types/composed-design.types';

// POST /v1/ideogram-v3/layerize-text
// Source: https://developer.ideogram.ai/api-reference/api-reference/layerize-text-v3
// Cost: $0.09 per input image — recorded in ai-models.config.ts (LAYERIZE_COST_PER_IMAGE).
// Beta warning: "works best with clear, straight text in standard typography. Curved,
// highly stylized, decorative, or graphic-embedded text may not be detected."
// US-AI-031 AC2 asks the composition step for clean typography to maximise the hit rate here.
const LAYERIZE_ENDPOINT = 'https://api.ideogram.ai/v1/ideogram-v3/layerize-text';

// The provider publishes no latency SLO for this beta endpoint, and observed
// latency is far above generate calls: 15s, 39s on identical images minutes
// apart (measured live 2026-08-13 — the original 30s budget killed a call that
// returned 6 valid blocks at 39s). 90s trades a slower worst case for not
// discarding paid, successful extractions.
const LAYERIZE_TIMEOUT_MS = 90_000;
// Image download from the CDN — generously above the ~2-9s observed for ~4.5MB.
const DOWNLOAD_TIMEOUT_MS = 30_000;

/** The raw block shape returned by the Ideogram layerize-text endpoint (internal only). */
interface RawTextBlock {
  text?: unknown;
  role?: unknown;
  x?: unknown;
  y?: unknown;
  width?: unknown;
  height?: unknown;
  angle?: unknown;
  font_name?: unknown;
  font_size?: unknown;
  line_height?: unknown;
  alignment?: unknown;
  color?: unknown;
}

/**
 * Map a single raw provider block to our ExtractedTextBlock.
 * All type-coercion happens here — nothing leaks to the mapper layer.
 */
function mapRawBlock(b: RawTextBlock): ExtractedTextBlock {
  const alignment = b.alignment === 'left' || b.alignment === 'center' || b.alignment === 'right'
    ? b.alignment as 'left' | 'center' | 'right'
    : null;

  return {
    detectedText: String(b.text ?? ''),
    x: Number(b.x ?? 0),
    y: Number(b.y ?? 0),
    width: Number(b.width ?? 0),
    height: Number(b.height ?? 0),
    angle: Number(b.angle ?? 0),
    fontFamily: b.font_name != null ? String(b.font_name) : null,
    fontSize: b.font_size != null ? Number(b.font_size) : null,
    lineHeight: b.line_height != null ? Number(b.line_height) : null,
    color: b.color != null ? String(b.color) : null,
    alignment,
    role: b.role != null ? String(b.role) : null,
  };
}

@Injectable()
export class LayerExtractionService {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.IDEOGRAM_API_KEY || '';
    if (!this.apiKey) {
      console.warn(
        '⚠️ IDEOGRAM_API_KEY not configured. Layer extraction will fail with 401.',
      );
    }
  }

  /**
   * 💰 AI CALL — Ideogram Layerize Text ($0.09/image, see ai-models.config.ts).
   *
   * Sends a flat composition to the provider. On success:
   *   - backgroundUrl: the same composition with all text regions erased
   *   - blocks: geometry of each erased region, mapped to our types
   *
   * On any failure (network, timeout, 4xx/5xx, empty response): returns null.
   * Callers must degrade to a usable flat design — never an exception to the editor (AC6).
   *
   * Structured logGen events include blocksDetected so the beta endpoint's real-world
   * detection rate is measurable rather than assumed (Observability rules — CLAUDE.md).
   */
  async extractTextGeometry(
    imageUrl: string,
    generationId?: string,
  ): Promise<{ backgroundUrl: string; blocks: ExtractedTextBlock[] } | null> {
    const t0 = Date.now();
    const gid = generationId ?? 'unknown';

    logGen({ generationId: gid, event: 'extract:start', imageUrl });

    try {
      // The endpoint accepts ONLY multipart/form-data with the image binary —
      // a JSON { image_url } body is rejected with 415 before any processing.
      // The original implementation sent JSON, so every extraction since
      // US-AI-031b failed silently through the catch below (found live
      // 2026-08-13 by probing the endpoint directly). Download the composition
      // and forward the bytes, same idiom as ideogram.service.ts remix calls.
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: DOWNLOAD_TIMEOUT_MS,
      });
      const imageBlob = new Blob([imageResponse.data], { type: 'image/png' });

      const form = new FormData();
      form.append('image', imageBlob, 'composition.png');

      const response = await axios.post(LAYERIZE_ENDPOINT, form, {
        // Do NOT set Content-Type — axios must set the multipart boundary itself.
        headers: { 'Api-Key': this.apiKey },
        timeout: LAYERIZE_TIMEOUT_MS,
      });

      const backgroundUrl: string | undefined = response.data?.base_image_url;
      if (!backgroundUrl) {
        logGen(
          { generationId: gid, event: 'extract:no-background', durationMs: elapsed(t0) },
          'warn',
        );
        return null;
      }

      const rawBlocks: RawTextBlock[] = Array.isArray(response.data?.text_blocks)
        ? response.data.text_blocks
        : [];

      const blocks = rawBlocks.map(mapRawBlock);

      logGen({
        generationId: gid,
        event: 'extract:ok',
        blocksDetected: blocks.length,
        durationMs: elapsed(t0),
      });

      return { backgroundUrl, blocks };
    } catch (error: any) {
      logGen(
        {
          generationId: gid,
          event: 'extract:error',
          durationMs: elapsed(t0),
          error: error.response?.data?.message || error.message,
          httpStatus: error.response?.status,
        },
        'error',
      );
      // AC6: provider failure must degrade, not break. Return null so the caller can
      // fall back to the usable flat design from the generation step.
      return null;
    }
  }
}
