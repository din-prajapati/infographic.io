/**
 * Layout connector — US-AI-046
 *
 * Bridges the pure layout engine (US-AI-043) to the editable canvas
 * (US-AI-032). The engine produces geometry; this module supplies it with a
 * real text measurer and adapts its output into the ComposedDesign shape the
 * canvas loader already understands.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * Why the layout engine is primary and layer extraction is the fallback
 * ──────────────────────────────────────────────────────────────────────────
 * Layer extraction (US-AI-031b) recovers text geometry from a flat image by
 * asking the provider what it can see. That only works when the image has
 * legible text on it — and OQ-2 established that the composition step produces
 * images with no text at all at the shipped image_weight. Extraction therefore
 * finds nothing, every field falls to inferred placement, and the user gets a
 * bare photo.
 *
 * The layout engine has no such dependency: it composes from the application's
 * own listing values and is deterministic, offline and free. So it leads.
 *
 * Extraction is kept, not deleted. It remains the right tool when a background
 * genuinely carries text worth preserving — an imported flat design, or a
 * future composition step that bakes text deliberately. See US-AI-031b.
 */
import { layoutDesign } from './layoutEngine';
import { templateRegistry } from './templates';
import type { ComposedDesign, ComposedTextElement } from '@/lib/api';

/**
 * ListingField (server vocabulary) → SlotId (template vocabulary).
 *
 * The engine takes SlotId keys in and emits ListingSlot values out, so this map
 * is only needed on the way in. Keep in sync with LISTING_FIELD_TO_SLOT in
 * canvasState.ts, which performs the mirror-image conversion on the way out.
 */
const FIELD_TO_SLOT: Record<string, string> = {
  headline:  'property.headline',
  price:     'property.price',
  address:   'property.location',
  stats:     'property.facts',
  agentName: 'agent.name',
  brokerage: 'brand.name',
};

/** Palette used until the layout planner supplies one (that is a later story). */
export const DEFAULT_PALETTE = {
  scrim:  '#0B1A3A',
  accent: '#C9A227',
  text:   '#FFFFFF',
  muted:  '#D8DEEA',
};

export const DEFAULT_TEMPLATE_ID = 'left-scrim-hero';

/**
 * Orientation → canvas pixel size.
 *
 * Matches V4_RESOLUTION in api/src/.../ideogram.service.ts so the layout is
 * computed against the same dimensions the background image was produced at.
 * Templates are resolution-independent (regions are fractions), so these only
 * determine the absolute pixel values in the output.
 */
export function orientationToCanvasSize(
  orientation: string | undefined,
): { width: number; height: number } {
  switch (orientation) {
    case 'portrait': return { width: 1440, height: 2560 };
    case 'square':   return { width: 2048, height: 2048 };
    default:         return { width: 2560, height: 1440 };
  }
}

/**
 * Build a text measurer backed by a real 2D context.
 *
 * Falls back to a proportional estimate when no context is obtainable — jsdom
 * returns null from getContext('2d'), and a headless failure should degrade the
 * layout's precision, never break composition.
 */
export function createMeasureText(): (t: string, fontSize: number, weight: number) => number {
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = document.createElement('canvas').getContext('2d');
  } catch {
    ctx = null;
  }

  if (!ctx) {
    // 0.52 approximates Inter's average advance ratio. Same constant the
    // engine's own specs use, so behaviour stays consistent headless.
    return (t: string, fontSize: number) => t.length * fontSize * 0.52;
  }

  const context = ctx;
  return (t: string, fontSize: number, weight: number) => {
    context.font = `${weight} ${fontSize}px Inter, 'Segoe UI', system-ui, sans-serif`;
    return context.measureText(t).width;
  };
}

/**
 * Compose a design from canonical listing values using the layout engine.
 *
 * Returns null when there is nothing to lay out, so the caller can fall back to
 * whatever layer extraction produced rather than rendering an empty canvas.
 */
export function composeFromCanonicalValues(input: {
  canonicalValues: ComposedDesign['canonicalValues'];
  backgroundUrl: string;
  canvas: { width: number; height: number };
  templateId?: string;
  palette?: typeof DEFAULT_PALETTE;
}): ComposedDesign | null {
  const { canonicalValues, backgroundUrl, canvas } = input;
  if (!canonicalValues) return null;

  const values: Record<string, string> = {};
  for (const [field, value] of Object.entries(canonicalValues)) {
    if (!value || !value.trim()) continue;
    const slot = FIELD_TO_SLOT[field];
    if (slot) values[slot] = value;
  }
  // Nothing worth laying out — let the caller fall back.
  if (Object.keys(values).length === 0) return null;

  const templateId = input.templateId ?? DEFAULT_TEMPLATE_ID;
  if (!templateRegistry[templateId]) return null;

  const elements = layoutDesign({
    templateId,
    values: values as never,
    canvas,
    palette: input.palette ?? DEFAULT_PALETTE,
    measureText: createMeasureText(),
  } as never) as unknown as ComposedTextElement[];

  if (!elements || elements.length === 0) return null;

  return {
    backgroundUrl,
    elements,
    // attempted:false distinguishes "we composed this ourselves" from
    // "extraction ran" — useful when reading logs or debugging a design.
    extraction: { attempted: false, blocksDetected: 0, matched: elements.length },
    canonicalValues,
  };
}
