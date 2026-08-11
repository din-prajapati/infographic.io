/**
 * Text-block mapper — pure domain logic, zero I/O, zero provider types.
 *
 * The highest-value code in EPIC-AI-06: this function survives every model swap
 * (tracked as B-17) because it is closed over the 6 known listing fields and
 * knows nothing about which provider produced the blocks.
 *
 * Binding priority (strict order):
 *   1. Fuzzy match detectedText against canonical values (primary signal)
 *   2. role hint from the provider (coarse tiebreak only)
 *   3. fontSize ranking (largest = headline, last resort)
 *
 * AC8: canonical values are NEVER sourced from model output. detectedText is used
 * solely to decide WHICH field a block is; the rendered string always comes from
 * the application's own listing record (the `canonical` parameter).
 *
 * AC4/Identity policy: unmatched blocks re-render their own detected text — EXCEPT
 * contact-shaped text (phone/email/URL), which is DROPPED. See the comment at
 * isContactShaped() for the rationale.
 *
 * AC5: canonical fields that no block matched are emitted with placement:'fallback'
 * and coarse geometry from inferFallbackGeometry().
 */

import {
  ExtractedTextBlock,
  ListingField,
  ComposedTextElement,
} from '../types/composed-design.types';

// ─── Normalisation ──────────────────────────────────────────────────────────

/**
 * Case/whitespace/linebreak-insensitive comparison form.
 * Mirrors normalize() in infographic-prompt.builder.ts:199-201 so the same
 * canonical strings that were fed to the composition prompt are comparable here.
 */
function normalize(s: string): string {
  return s.toUpperCase().replace(/[\n\s]+/g, ' ').replace(/\s*\|\s*/g, ' | ').trim();
}

// ─── Contact-pattern guard (Identity policy) ─────────────────────────────────

/**
 * Detects contact-shaped text: phone numbers, email addresses, and URLs.
 *
 * AC4 says preserve unmatched blocks. The Identity policy (STORY.md §"Identity policy")
 * carves out one exception: contact-shaped text is DROPPED, not preserved. An image model
 * can invent a plausible-looking phone number, email, or agent name that we have no
 * canonical counterpart for. Re-rendering those verbatim would publish fabricated contact
 * details on a real listing — precisely the liability EPIC-AI-06 exists to remove.
 *
 * Drops are observable: count `elements.filter(e => e.slot === null).length` vs
 * `blocksDetected` in the ComposedDesign.extraction envelope.
 */
const CONTACT_PATTERNS = [
  /\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4}/, // phone: (555) 123-4567 / 555-123-4567
  /\+?\d[\d\s\-\.]{6,}\d/,                    // phone: +1 555 1234 567 / intl formats
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/, // email
  /https?:\/\/\S+|www\.\S+/,                  // URL
];

function isContactShaped(text: string): boolean {
  return CONTACT_PATTERNS.some(p => p.test(text));
}

// ─── Fuzzy matching ──────────────────────────────────────────────────────────

/**
 * Score the match between a block's detected text and a canonical value.
 * Returns 0 if there is no meaningful overlap; >0 for progressively stronger matches.
 *
 * The composition prompt contained the canonical values, so Ideogram's rendering should
 * resemble them closely. Exact match is common; substring and word-overlap handle minor
 * drift (e.g. "$520K" rendered as "$520k" or "$520,000").
 */
function fuzzyScore(detected: string, canonical: string): number {
  if (!canonical.trim() || !detected.trim()) return 0;
  const nd = normalize(detected);
  const nc = normalize(canonical);
  if (nd === nc) return 100;
  if (nd.includes(nc) || nc.includes(nd)) return 80;
  // Word-overlap: useful for addresses and stats fields with separators
  const words1 = new Set(nd.split(' ').filter(w => w.length > 2));
  const words2 = nc.split(' ').filter(w => w.length > 2);
  if (words2.length === 0) return 0;
  const overlap = words2.filter(w => words1.has(w)).length;
  const ratio = overlap / words2.length;
  return ratio >= 0.6 ? ratio * 70 : 0;
}

// ─── Role tiebreak ───────────────────────────────────────────────────────────

/**
 * Coarse mapping from Ideogram's role taxonomy to listing fields.
 * Lower index = stronger signal (inspected in priority order).
 * role values from the provider: "heading" | "subheading" | "body" | "caption".
 */
const FIELD_ROLE_HINTS: Record<ListingField, string[]> = {
  headline:  ['heading'],
  price:     ['subheading', 'heading'],
  address:   ['subheading', 'body'],
  stats:     ['body', 'caption'],
  agentName: ['body', 'caption'],
  brokerage: ['body', 'caption'],
};

function roleScore(block: ExtractedTextBlock, field: ListingField): number {
  if (!block.role) return 0;
  const hints = FIELD_ROLE_HINTS[field];
  const idx = hints.indexOf(block.role);
  return idx === -1 ? 0 : (hints.length - idx) * 10;
}

// ─── Geometry helpers ────────────────────────────────────────────────────────

type Geometry = Pick<
  ExtractedTextBlock,
  'x' | 'y' | 'width' | 'height' | 'angle' | 'fontFamily' | 'fontSize' |
  'lineHeight' | 'color' | 'alignment'
>;

function blockGeometry(b: ExtractedTextBlock): Geometry {
  return {
    x: b.x, y: b.y, width: b.width, height: b.height, angle: b.angle,
    fontFamily: b.fontFamily, fontSize: b.fontSize, lineHeight: b.lineHeight,
    color: b.color, alignment: b.alignment,
  };
}

// ─── Fallback geometry (coarse field defaults) ───────────────────────────────

/**
 * Canvas dimensions used when the design orientation is unknown.
 * Portrait 1440×2560 matches the V4 default resolution for portrait designs.
 * Extracted from ideogram.service.ts V4_RESOLUTION.
 */
const DEFAULT_CANVAS = { width: 1440, height: 2560 };

/**
 * Infer coarse placement for a canonical field that no block matched.
 *
 * Uses field identity to produce a region that roughly matches typical real estate
 * infographic layouts (headline at top, price prominent, contact at bottom).
 * Deliberately approximate — the user can drag elements in US-AI-032. The guarantee
 * is that the VALUE is present and correct (AC5), not that it is pixel-perfect.
 *
 * No LLM call — deterministic, unit-testable.
 *
 * @param field       The canonical field to place
 * @param intentProse Optional design-intent prose (e.g. from buildImagePrompt) — may be
 *                    empty when called from the edit path. Currently used as tiebreak
 *                    for keyword-based region detection; defaults apply when empty.
 * @param canvasSize  Target canvas dimensions (px). Defaults to 1440×2560 (portrait).
 */
export function inferFallbackGeometry(
  field: ListingField,
  intentProse: string,
  canvasSize: { width: number; height: number } = DEFAULT_CANVAS,
): Geometry {
  const { width: W, height: H } = canvasSize;
  const pad = Math.round(W * 0.05); // 5% side padding

  // Detect gross orientation hints in the prose for optional override.
  // The prose vocabulary comes from buildImagePrompt() in infographic-prompt.builder.ts.
  const prose = intentProse.toLowerCase();
  const proseHintsUpper = /upper portion|top third|headline at top/.test(prose);
  const proseHintsLower = /lower portion|bottom third|footer/.test(prose);
  const proseCentered   = /centered|centred|centre/.test(prose);

  // Field-specific defaults: positions expressed as fractions of canvas height.
  // Values chosen to roughly match a photo-overlay listing infographic layout where
  // the headline sits in the upper third, price below, address below that, stats/
  // details in the middle, and agent/brokerage at the bottom.
  const DEFAULTS: Record<ListingField, Geometry> = {
    headline: {
      x: pad,
      y: proseHintsLower ? Math.round(H * 0.60) : Math.round(H * 0.08),
      width: W - 2 * pad,
      height: Math.round(H * 0.12),
      angle: 0,
      fontFamily: null,
      fontSize: Math.round(W * 0.05),
      lineHeight: null,
      color: '#FFFFFF',
      alignment: proseCentered ? 'center' : 'center',
    },
    price: {
      x: pad,
      y: Math.round(H * 0.24),
      width: W - 2 * pad,
      height: Math.round(H * 0.06),
      angle: 0,
      fontFamily: null,
      fontSize: Math.round(W * 0.040),
      lineHeight: null,
      color: '#FFFFFF',
      alignment: 'center',
    },
    address: {
      x: pad,
      y: Math.round(H * 0.32),
      width: W - 2 * pad,
      height: Math.round(H * 0.04),
      angle: 0,
      fontFamily: null,
      fontSize: Math.round(W * 0.025),
      lineHeight: null,
      color: '#FFFFFF',
      alignment: 'center',
    },
    stats: {
      x: pad,
      y: Math.round(H * 0.38),
      width: W - 2 * pad,
      height: Math.round(H * 0.04),
      angle: 0,
      fontFamily: null,
      fontSize: Math.round(W * 0.022),
      lineHeight: null,
      color: '#FFFFFF',
      alignment: 'center',
    },
    agentName: {
      x: pad,
      y: proseHintsUpper ? Math.round(H * 0.40) : Math.round(H * 0.82),
      width: Math.round(W * 0.55),
      height: Math.round(H * 0.03),
      angle: 0,
      fontFamily: null,
      fontSize: Math.round(W * 0.022),
      lineHeight: null,
      color: '#FFFFFF',
      alignment: 'left',
    },
    brokerage: {
      x: pad,
      y: proseHintsUpper ? Math.round(H * 0.44) : Math.round(H * 0.86),
      width: Math.round(W * 0.65),
      height: Math.round(H * 0.025),
      angle: 0,
      fontFamily: null,
      fontSize: Math.round(W * 0.019),
      lineHeight: null,
      color: '#FFFFFF',
      alignment: 'left',
    },
  };

  return DEFAULTS[field];
}

// ─── Main export ─────────────────────────────────────────────────────────────

const ALL_FIELDS: ListingField[] = ['headline', 'address', 'price', 'stats', 'agentName', 'brokerage'];

/**
 * Bind recovered text blocks to canonical listing fields.
 *
 * Pure function — no I/O, no provider types in signature. The mapper is the component
 * with the longest life expectancy in this epic: it must survive B-17 (provider swap)
 * without modification. Its input and output are our own types.
 *
 * @param blocks    Geometry recovered from the extraction provider. NEVER the source
 *                  of truth for rendered text — only used for identification and placement.
 * @param canonical Canonical values from the application's own listing record.
 *                  Empty-string values are ignored (field is optional or not provided).
 * @returns         One ComposedTextElement per canonical field (all mandatory) plus one
 *                  per unmatched decorative block (excluding contact-shaped text).
 */
export function mapBlocksToFields(
  blocks: ExtractedTextBlock[],
  canonical: Record<ListingField, string>,
): ComposedTextElement[] {
  // Only include canonical fields that have a non-empty value
  const unmatchedCanonical = new Set<ListingField>(
    ALL_FIELDS.filter(f => Boolean(canonical[f]?.trim())),
  );
  const matchedBlockIndices = new Set<number>();
  const elements: ComposedTextElement[] = [];

  // ── Pass 1: fuzzy match ──────────────────────────────────────────────────
  // Repeatedly find the highest-scoring (block, field) pair and commit it.
  // This greedy approach ensures the best global assignment without backtracking.
  let progress = true;
  while (progress && unmatchedCanonical.size > 0) {
    progress = false;
    let bestScore = 0;
    let bestBlockIdx = -1;
    let bestField: ListingField | null = null;

    for (let i = 0; i < blocks.length; i++) {
      if (matchedBlockIndices.has(i)) continue;
      for (const field of unmatchedCanonical) {
        const score = fuzzyScore(blocks[i].detectedText, canonical[field]);
        if (score > bestScore) {
          bestScore = score;
          bestBlockIdx = i;
          bestField = field;
        }
      }
    }

    if (bestBlockIdx >= 0 && bestField !== null && bestScore > 0) {
      const block = blocks[bestBlockIdx];
      elements.push({
        slot: bestField,
        // AC8: canonical value always wins — detectedText is only the identification signal.
        // If detected "$520K" but canonical is "$2,450,000", we render "$2,450,000".
        text: canonical[bestField],
        geometry: blockGeometry(block),
        placement: 'measured',
      });
      matchedBlockIndices.add(bestBlockIdx);
      unmatchedCanonical.delete(bestField);
      progress = true;
    }
  }

  // ── Pass 2: role + fontSize tiebreak ────────────────────────────────────
  // For remaining unmatched canonical fields, try the coarser role/fontSize signals.
  // Sort blocks by fontSize descending: largest is most likely the headline.
  if (unmatchedCanonical.size > 0) {
    const remainingFields = [...unmatchedCanonical];
    const remainingBlocks = blocks
      .map((b, i) => ({ b, i }))
      .filter(({ i }) => !matchedBlockIndices.has(i))
      .sort((a, z) => (z.b.fontSize ?? 0) - (a.b.fontSize ?? 0));

    for (const { b: block, i: idx } of remainingBlocks) {
      if (remainingFields.length === 0) break;
      let topField: ListingField | null = null;
      let topRole = -1;
      for (const field of remainingFields) {
        const rs = roleScore(block, field);
        if (rs > topRole) { topRole = rs; topField = field; }
      }
      if (topField !== null && topRole > 0) {
        elements.push({
          slot: topField,
          text: canonical[topField],
          geometry: blockGeometry(block),
          placement: 'measured',
        });
        matchedBlockIndices.add(idx);
        remainingFields.splice(remainingFields.indexOf(topField), 1);
      }
    }

    // Sync unmatchedCanonical with what role pass bound
    for (const f of ALL_FIELDS) {
      if (!remainingFields.includes(f)) unmatchedCanonical.delete(f);
    }
  }

  // ── Pass 3: unmatched canonical → fallback geometry (AC5) ───────────────
  // Never drop a canonical value. Every field that extraction missed gets placed
  // via coarse inferred geometry so the editor always has something to show.
  for (const field of unmatchedCanonical) {
    elements.push({
      slot: field,
      text: canonical[field],
      geometry: inferFallbackGeometry(field, ''),
      placement: 'fallback',
    });
  }

  // ── Pass 4: unmatched blocks ─────────────────────────────────────────────
  for (let i = 0; i < blocks.length; i++) {
    if (matchedBlockIndices.has(i)) continue;
    const block = blocks[i];

    // Identity policy (STORY.md §"Identity policy"): contact-shaped text is DROPPED.
    // AC4 says preserve unmatched blocks; the Identity policy carves out contact patterns
    // as the one exception: publishing a plausible-but-fabricated phone number or email
    // on a real listing is the exact liability EPIC-AI-06 exists to remove. The drop is
    // observable through the extraction.blocksDetected vs matched counts in ComposedDesign.
    if (isContactShaped(block.detectedText)) {
      continue;
    }

    // Decorative / unrecognised block — re-render its own detected text (AC4).
    // Extraction erases every detected block from the background; dropping unmatched
    // ones would leave blank plates where decorative text was.
    elements.push({
      slot: null,
      text: block.detectedText,
      geometry: blockGeometry(block),
      placement: 'measured',
    });
  }

  return elements;
}
