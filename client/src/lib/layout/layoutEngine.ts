/**
 * Layout engine — US-AI-043
 *
 * Pure, deterministic renderer: given a template id, listing values, canvas
 * size and colour palette, returns positioned non-overlapping LayoutElements
 * ready for loadComposedDesignToCanvas (US-AI-032).
 *
 * No LLM call. No network request. No canvas context required. — STORY scope
 *
 * ══════════════════════════════════════════════════════════════════════════
 * Non-overlap guarantee (AC4)
 * ══════════════════════════════════════════════════════════════════════════
 * Collision is impossible by construction — not detected-and-fixed:
 *
 *   1. Each TemplateBlock owns exactly one Region.
 *   2. All regions in a template are mutually disjoint (enforced by
 *      templates.spec.ts, which runs on every commit to this branch).
 *   3. Within a block, slots are laid out with a monotonically advancing
 *      cursor. Advancing a cursor cannot reverse it, so consecutive slots
 *      in the same region cannot overlap.
 *
 *   ∴ Elements in different blocks live in disjoint pixel rectangles.
 *     Elements in the same block are stacked without backtracking.
 *     → No two output elements can ever overlap.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * Overflow degradation (AC5) — added in T4
 * ══════════════════════════════════════════════════════════════════════════
 * See the comment block below layoutDesign() for the three-step algorithm.
 */
import { wrapTextToWidth } from '../canvasExport';
import type { SlotId } from '../slotIds';
import { templateRegistry } from './templates';
import type { LayoutElement, LayoutInput, ListingSlot } from './types';

// ---------------------------------------------------------------------------
// Mapping from SlotId to the ListingSlot identifier understood by
// loadComposedDesignToCanvas. Slots not in this map emit slot:null (treated
// as supplementary / decorative by the consumer).
// ---------------------------------------------------------------------------
const SLOT_TO_LISTING: Partial<Record<SlotId, ListingSlot>> = {
  'property.headline': 'headline',
  'property.price':    'price',
  'property.location': 'address',
  'property.facts':    'stats',
  'agent.name':        'agentName',
  'brand.name':        'brokerage',
};

const LINE_HEIGHT_RATIO = 1.2;
const FONT_FAMILY       = 'Inter';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal object that satisfies the ctx.measureText() contract that
 * wrapTextToWidth uses. The injected measureFn is called with the current
 * slot's font size and weight so the wrap matches the rendered appearance.
 *
 * jsdom provides no real canvas context; this adapter is what makes the
 * layout engine testable without one. — AC3
 */
function buildMeasureCtx(
  measureFn: (text: string, fontSize: number, weight: number) => number,
  fontSize: number,
  weight: number,
): CanvasRenderingContext2D {
  return {
    measureText: (t: string) => ({ width: measureFn(t, fontSize, weight) }),
  } as unknown as CanvasRenderingContext2D;
}

/**
 * Wrap text using the injected measureFn.
 * Delegates to wrapTextToWidth from canvasExport — not reimplemented. — AC3
 */
function wrapSlot(
  text: string,
  maxWidth: number,
  fontSize: number,
  weight: number,
  measureFn: (text: string, fontSize: number, weight: number) => number,
): string[] {
  const ctx = buildMeasureCtx(measureFn, fontSize, weight);
  return wrapTextToWidth(ctx, text, maxWidth);
}

/**
 * Append the ellipsis character to `text`, trimming from the right until the
 * whole string fits within maxWidth. Returns at minimum just '…'.
 *
 * Used in the T4 truncation path.
 */
function appendEllipsis(
  text: string,
  maxWidth: number,
  measureFn: (t: string) => number,
): string {
  const ell = '…';
  let trimmed = text;
  while (trimmed.length > 0 && measureFn(trimmed + ell) > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed + ell;
}

/** Choose a foreground colour from the palette based on slot importance. */
function pickColor(slot: ListingSlot | null, palette: LayoutInput['palette']): string {
  if (slot === 'price') return palette.accent;
  if (slot === null)    return palette.muted;
  return palette.text;
}

/** Construct a LayoutElement from its individual components. */
function makeElement(
  slotId: SlotId,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  align: 'left' | 'right' | 'center',
  palette: LayoutInput['palette'],
  degraded: 'shrunk' | 'truncated' | undefined,
): LayoutElement {
  const slot = SLOT_TO_LISTING[slotId] ?? null;
  return {
    slot,
    text,
    geometry: {
      x,
      y,
      width,
      height,
      angle: 0,
      fontFamily: FONT_FAMILY,
      fontSize,
      lineHeight: LINE_HEIGHT_RATIO,
      color: pickColor(slot, palette),
      alignment: align,
    },
    placement: 'measured',
    ...(degraded !== undefined ? { degraded } : {}),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Pure layout engine — AC2, AC3, AC4, AC5, AC6.
 *
 * Algorithm (T3 — basic flow):
 *   1. Resolve each region from fractions × canvas pixel dimensions.
 *   2. For each block, initialise a cursor at the region's top pixel edge.
 *   3. Walk block.slots in order:
 *      a. Skip absent / empty values (AC6).
 *      b. Wrap the text at ideal font size using wrapSlot() (which delegates
 *         to wrapTextToWidth from canvasExport — not reimplemented). (AC3)
 *      c. Compute totalHeight = lines.length × lineHeight.
 *      d. If totalHeight > remaining space → degradation path (AC5, added T4).
 *      e. Emit LayoutElement at cursor, advance cursor by height + gap.
 *   4. typeScale and gap are scaled by (canvas.height / 1440) so the engine
 *      is resolution-independent. (AC7)
 *
 * Non-overlap is structural (AC4) — see module doc above.
 *
 * @param input.templateId   Must exist in templateRegistry (templates.ts).
 * @param input.values       Partial — missing or empty entries collapse silently.
 * @param input.canvas       Width × height in logical pixels.
 * @param input.palette      Four named colour strings for the compositor.
 * @param input.measureText  Injected font-metric function (no ctx needed).
 * @returns                  Positioned, non-overlapping LayoutElements.
 */
export function layoutDesign(input: LayoutInput): LayoutElement[] {
  const { templateId, values, canvas, palette, measureText } = input;

  const template = templateRegistry[templateId];
  if (!template) {
    throw new Error(
      `[layoutDesign] Unknown templateId: "${templateId}". ` +
      'Register the template in client/src/lib/layout/templates.ts.',
    );
  }

  // Step 4: scale factor for all px-at-1440 values.
  const scale = canvas.height / 1440;

  const results: LayoutElement[] = [];

  for (const block of template.blocks) {
    const region = template.regions[block.region];
    if (!region) {
      // Template data error — should be caught by templates.spec.ts.
      throw new Error(
        `[layoutDesign] Block references unknown region "${block.region}" ` +
        `in template "${templateId}".`,
      );
    }

    // Step 1: pixels from fractions.
    const rx = region.x * canvas.width;
    const ry = region.y * canvas.height;
    const rw = region.w * canvas.width;
    const rh = region.h * canvas.height;
    const regionBottom = ry + rh;

    const gap = block.gap * scale;

    // Step 2: cursor starts at the top of this region.
    let cursor = ry; // monotonically non-decreasing — the AC4 guarantee.

    for (const slotId of block.slots) {
      // Step 3a: skip absent or empty values. — AC6
      const rawText = values[slotId];
      if (!rawText || rawText.trim() === '') continue;

      // Remaining vertical space in this region.
      const remaining = regionBottom - cursor;
      if (remaining <= 0) break; // region exhausted

      const typeSpec = template.typeScale[slotId];
      const idealSize = (typeSpec?.ideal ?? 16) * scale;
      const minSize   = (typeSpec?.min   ?? 12) * scale;
      const weight    = typeSpec?.weight ?? 400;

      // Step 3b–c: wrap at ideal size, compute height.
      let fontSize = idealSize;
      let lines    = wrapSlot(rawText, rw, fontSize, weight, measureText);
      let lineH    = fontSize * LINE_HEIGHT_RATIO;
      let totalH   = lines.length * lineH;
      let degraded: 'shrunk' | 'truncated' | undefined;
      let displayText = rawText;

      // Step 3d: overflow degradation (AC5) — three-step:
      //   1. Shrink toward typeScale.min.
      //   2. Truncate the last line with '…' if still overflowing.
      //   3. Clamp height to remaining so the element never exits its region.
      if (totalH > remaining) {
        // Attempt 2 — shrink to min.
        fontSize = minSize;
        lines    = wrapSlot(rawText, rw, fontSize, weight, measureText);
        lineH    = fontSize * LINE_HEIGHT_RATIO;
        totalH   = lines.length * lineH;
        degraded = 'shrunk';

        if (totalH > remaining) {
          // Attempt 3 — truncate to the available number of lines.
          const maxLines = Math.max(1, Math.floor(remaining / lineH));
          lines = lines.slice(0, maxLines);
          totalH = lines.length * lineH;

          // Add ellipsis to the last retained line. — AC5
          const boundMeasure = (t: string) => measureText(t, fontSize, weight);
          lines[lines.length - 1] = appendEllipsis(
            lines[lines.length - 1],
            rw,
            boundMeasure,
          );

          displayText = lines.join('\n');
          // Guarantee the output string ends with '…' even if join introduces
          // extra whitespace somehow (defensive).
          if (!displayText.endsWith('…')) {
            displayText = displayText.trimEnd() + '…';
          }
          degraded = 'truncated';
        }
      }

      // Step 3e: emit element at cursor, advance cursor.
      const height = Math.min(totalH, remaining); // belt-and-suspenders cap

      results.push(makeElement(
        slotId,
        displayText,
        rx,
        cursor,
        rw,
        height,
        fontSize,
        block.align,
        palette,
        degraded,
      ));

      cursor += height + gap; // monotonically advancing — AC4
    }
  }

  return results;
}
