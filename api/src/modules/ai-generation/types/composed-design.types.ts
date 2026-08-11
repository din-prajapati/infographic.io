/**
 * Shared contract for the hybrid real-photo pipeline.
 *
 * US-AI-031b owns these types; US-AI-032 (editable canvas) builds against them.
 * Change them here only — never in a consuming story without updating this file first.
 *
 * Deliberately provider-free: no Ideogram-shaped fields, no raw payload passthrough.
 * The adapter seam (layer-extraction.service.ts) is the only file that knows the
 * provider; everything downstream sees only these types.
 *
 * ListingField mirrors the keys of buildExpectedTexts() in infographic-prompt.builder.ts:119-123.
 */

/** One text region recovered from a flat composition. Geometry only — never truth. */
export interface ExtractedTextBlock {
  detectedText: string;          // what the model rendered. Identification signal ONLY.
  x: number; y: number;          // top-left, px, in source-image space
  width: number; height: number;
  angle: number;                 // degrees
  fontFamily: string | null;     // provider's best guess; may not resolve locally
  fontSize: number | null;
  lineHeight: number | null;
  color: string | null;          // hex
  alignment: 'left' | 'center' | 'right' | null;
  role: string | null;           // provider hint, e.g. "heading" — coarse, tiebreak only
}

/** Canonical listing field ids. Closed set — mirrors buildExpectedTexts(). */
export type ListingField =
  | 'headline' | 'address' | 'price' | 'stats' | 'agentName' | 'brokerage';

/** Result of binding recovered geometry to canonical truth. */
export interface ComposedTextElement {
  slot: ListingField | null;     // null = decorative block we do not own
  text: string;                  // canonical value when slot is set; detectedText when null
  geometry: Pick<ExtractedTextBlock,
    'x' | 'y' | 'width' | 'height' | 'angle' | 'fontFamily' | 'fontSize' |
    'lineHeight' | 'color' | 'alignment'>;
  placement: 'measured' | 'fallback';   // provenance — drives UI hinting and metrics
}

/** What this story hands to US-AI-032. */
export interface ComposedDesign {
  backgroundUrl: string;         // text-erased composition
  elements: ComposedTextElement[];
  extraction: { attempted: boolean; blocksDetected: number; matched: number };
}
