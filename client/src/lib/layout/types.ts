/**
 * Layout engine type definitions — US-AI-043
 *
 * Adding a template is a data change in templates.ts only.
 * The renderer (layoutEngine.ts) requires no edits for new templates. — AC8
 *
 * Regions are fractions (0..1) of canvas dimensions, never pixels.
 * This is what lets one template serve landscape, portrait and square. — AC7
 */
import type { SlotId } from '../slotIds';

/**
 * A named sub-area of a template, expressed as fractions of canvas size.
 *
 * All four fields must lie in [0, 1] and the rectangle they define must
 * not overlap any other region in the same template. Both invariants are
 * verified automatically in __tests__/templates.spec.ts.
 */
export interface Region {
  /** Left edge as a fraction of canvas width. */
  x: number;
  /** Top edge as a fraction of canvas height. */
  y: number;
  /** Width as a fraction of canvas width. */
  w: number;
  /** Height as a fraction of canvas height. */
  h: number;
}

/**
 * One content block within a template.
 *
 * A block owns exactly one region. Its slots are stacked in order using a
 * monotonically advancing cursor — the structural guarantee that no two
 * elements within the block ever overlap. — AC4
 */
export interface TemplateBlock {
  /** Key in the parent Template.regions map. */
  region: string;
  /** SlotIds to render inside this region, top to bottom. */
  slots: SlotId[];
  /** Text alignment applied to every slot in this block. */
  align: 'left' | 'right' | 'center';
  /** Vertical gap between consecutive slots, in px at 1440 reference height. */
  gap: number;
}

/**
 * A named, resolution-independent layout template.
 *
 * Data contract: adding a template is a pure data change (new const + one
 * registry entry in templates.ts). The renderer never needs to change. — AC8
 */
export interface Template {
  id: string;
  name: string;
  /**
   * Named regions as fractions (0..1). Must be mutually non-overlapping.
   * Verified by templates.spec.ts at commit time.
   */
  regions: Record<string, Region>;
  /** One block per region that contains text. */
  blocks: TemplateBlock[];
  /**
   * Scrim declaration for the compositor.
   * Region key + direction tell the compositor where to draw the gradient.
   */
  scrim?: { region: string; direction: 'left' | 'right' | 'bottom' };
  /**
   * Font sizes in px at 1440 reference height.
   * Scaled at runtime by (canvas.height / 1440) — AC7.
   * Only slots used in blocks need entries; undefined falls back to 16/12.
   */
  typeScale: Partial<Record<SlotId, { min: number; ideal: number; weight: number }>>;
}

/**
 * Canonical listing-slot identifiers.
 *
 * Mirrors ListingField from api/src/modules/ai-generation/types/composed-design.types.ts.
 * Defined locally so the client package has no runtime dependency on the API package.
 * Kept in sync manually — this is the closed set that loadComposedDesignToCanvas understands.
 */
export type ListingSlot =
  | 'headline'
  | 'address'
  | 'price'
  | 'stats'
  | 'agentName'
  | 'brokerage';

/**
 * A positioned text element returned by layoutDesign().
 *
 * Shape-compatible with ComposedTextElement (composed-design.types.ts):
 * same fields, same types, so loadComposedDesignToCanvas can consume it
 * without translation. — AC2
 *
 * Extended with an optional `degraded` marker for the UI hinting path. — AC5
 */
export interface LayoutElement {
  /**
   * Canonical listing field, or null for supplementary slots (e.g. agent.phone)
   * that have no corresponding ListingField entry.
   */
  slot: ListingSlot | null;
  /**
   * Display text.
   * - Non-degraded: canonical value from the caller's `values` map.
   * - degraded='truncated': truncated string ending with '…'.
   */
  text: string;
  /** Pixel geometry in canvas coordinate space. */
  geometry: {
    x: number;
    y: number;
    width: number;
    /** Allocated vertical space. Renderer must stay within this. */
    height: number;
    /** Always 0 for layout-engine elements. */
    angle: number;
    fontFamily: string | null;
    /** Effective font size in px after any shrink degradation. */
    fontSize: number | null;
    /** Line-height multiplier (e.g. 1.2). */
    lineHeight: number | null;
    color: string | null;
    alignment: 'left' | 'center' | 'right' | null;
  };
  /** Always 'measured' — the engine derives geometry from font metrics. */
  placement: 'measured' | 'fallback';
  /** Present only when text was degraded to fit its region. — AC5 */
  degraded?: 'shrunk' | 'truncated';
}

/** Input contract for layoutDesign(). */
export interface LayoutInput {
  templateId: string;
  /**
   * Caller supplies any subset of the SlotId vocabulary.
   * Missing or empty entries collapse their slot — no reserved space. — AC6
   */
  values: Partial<Record<SlotId, string>>;
  canvas: { width: number; height: number };
  palette: { scrim: string; accent: string; text: string; muted: string };
  /**
   * Injected text-width measurer — the same seam wrapTextToWidth already uses.
   *
   * Production: wraps a real CanvasRenderingContext2D.measureText().
   * Tests: proportional stub — no canvas context required. — AC3
   *
   * @param text    The text to measure.
   * @param fontSize Font size in px.
   * @param weight  Font weight (e.g. 400, 700).
   * @returns       Width in px.
   */
  measureText: (text: string, fontSize: number, weight: number) => number;
}
