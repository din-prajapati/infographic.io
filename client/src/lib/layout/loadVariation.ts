/**
 * Shared variation → canvas loader — US-AI-047
 *
 * Both generation surfaces (the AI chat panel and Quick Generate in the right
 * sidebar) need the identical decision: flat raster, or composed editable
 * design? Before this module, only AIChatBox implemented it, which is why the
 * editable feature was unreachable from the more prominent button.
 *
 * Implementing it once here means the two surfaces cannot drift apart — a
 * second copy would inevitably diverge the moment either path changed.
 */
import { generationsApi } from '@/lib/api';
import type { ComposedDesign } from '@/lib/api';
import { composeFromCanonicalValues, orientationToCanvasSize } from './connectLayout';

export interface VariationLike {
  id: string;
  imageUrl: string;
  title?: string | null;
}

export interface LoadPlan {
  /** 'editable' only when a composed design was actually produced. */
  mode: 'flat' | 'editable';
  composedDesign?: ComposedDesign;
  /** Why we fell back, for logging and for the toast the user sees. */
  reason?: string;
}

/**
 * Decide what to load for a variation.
 *
 * Returns a plan rather than performing the load, so each caller can hand the
 * result to whichever canvas entry point it already uses — the chat panel goes
 * through onTemplateLoad, the sidebar calls the loader directly.
 *
 * Never throws. Any failure degrades to flat with a reason attached: a user who
 * asked for an editable design should still get their design.
 */
export async function planVariationLoad(input: {
  generationId: string | null;
  variation: VariationLike;
  renderMode: 'flat' | 'editable';
  orientation?: string;
}): Promise<LoadPlan> {
  const { generationId, variation, renderMode, orientation } = input;

  if (renderMode !== 'editable') return { mode: 'flat' };
  if (!generationId) return { mode: 'flat', reason: 'no generation id' };

  try {
    // Server returns canonical listing values alongside whatever layer
    // extraction found (US-AI-046).
    const composed = await generationsApi.getComposedDesign(
      generationId,
      variation.imageUrl,
    );

    // Extraction leads when it actually detected text on the background: the
    // erased background + measured blocks reproduce the exact design the user
    // chose, which no re-layout can match. (Extraction failed 100% of the time
    // until 2026-08-13 — a 415 swallowed inside the service — which is why the
    // engine was ever put first. See layer-extraction.service.ts.)
    if (composed?.elements?.length && (composed.extraction?.blocksDetected ?? 0) > 0) {
      return { mode: 'editable', composedDesign: composed, reason: 'used extracted layers' };
    }

    // Background carries no text (the photo-flow case, per OQ-2) — compose a
    // layout from our own listing data instead. Deterministic, offline, free.
    const laidOut = composeFromCanonicalValues({
      canonicalValues: composed?.canonicalValues,
      backgroundUrl: composed?.backgroundUrl ?? variation.imageUrl,
      canvas: orientationToCanvasSize(orientation),
    });

    if (laidOut) return { mode: 'editable', composedDesign: laidOut };

    // Last resort: extraction produced fallback-placed elements without
    // detected blocks. Better than losing the user's editable intent.
    if (composed?.elements?.length) {
      return { mode: 'editable', composedDesign: composed, reason: 'used extracted layers' };
    }

    return { mode: 'flat', reason: 'no listing values and no extracted layers' };
  } catch (err: any) {
    console.error('[loadVariation] compose failed — falling back to flat', err);
    return { mode: 'flat', reason: err?.message ?? 'compose failed' };
  }
}
