/**
 * PlannerIntent — output contract for LayoutPlannerService (US-AI-044).
 *
 * The planner analyses a listing photo via GPT-4o Vision and selects:
 *   - which template fits the composition
 *   - which side the scrim should anchor
 *   - a colour palette that complements the photo
 *
 * Every field has a corresponding validation check in isValidPlannerIntent().
 * Any response that fails validation falls back to DEFAULT_INTENT — the
 * service never throws and never propagates a bad intent downstream.
 */

/** Template identifiers in the registry (templates.ts). Closed set. */
export type TemplateId = 'left-scrim-hero' | 'bottom-band' | 'corner-card';

/** Where to anchor the scrim gradient. Closed set. */
export type ScrimSide = 'left' | 'right' | 'bottom' | 'none';

/**
 * Colour palette — four named colour slots.
 * Directly consumable as LayoutInput.palette in layoutDesign() — same fields,
 * same types, no translation needed. — AC2
 */
export interface Palette {
  /** Semi-transparent overlay colour for the scrim region. rgba(...) or #hex. */
  scrim: string;
  /** Accent colour — applied to price / highlight text. Must be a 6-digit hex. */
  accent: string;
  /** Primary text colour. Must be a 6-digit hex. */
  text: string;
  /** Secondary / muted text colour. Must be a 6-digit hex. */
  muted: string;
}

/**
 * The planner's output — template selection + colour intent.
 *
 * Consumed by layoutDesign() (US-AI-043) to produce positioned elements.
 * `reasoning` is for logging / debug only — never use it in business logic.
 */
export interface PlannerIntent {
  templateId: TemplateId;
  scrimSide:  ScrimSide;
  palette:    Palette;
  /** GPT-4o's short explanation of the template choice. Debug/logging only. */
  reasoning:  string;
}

// ---------------------------------------------------------------------------
// Closed validation sets
// ---------------------------------------------------------------------------

export const VALID_TEMPLATE_IDS: readonly TemplateId[] = [
  'left-scrim-hero',
  'bottom-band',
  'corner-card',
];

export const VALID_SCRIM_SIDES: readonly ScrimSide[] = [
  'left',
  'right',
  'bottom',
  'none',
];

// ---------------------------------------------------------------------------
// Default intent — returned on any validation or network failure.
// Neutral palette, most-versatile template. — AC3, AC4, AC5, AC6, AC8
// ---------------------------------------------------------------------------

export const DEFAULT_INTENT: PlannerIntent = {
  templateId: 'left-scrim-hero',
  scrimSide:  'left',
  palette: {
    scrim:  'rgba(0,0,0,0.60)',
    accent: '#F5A623',
    text:   '#FFFFFF',
    muted:  '#CCCCCC',
  },
  reasoning: 'fallback — GPT-4o unavailable or response invalid',
};

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/** Accepts a 6-digit hex colour string. */
const HEX6_RE = /^#[0-9a-fA-F]{6}$/;

/** Accepts hex OR rgba(r,g,b,a) for the scrim field. */
const SCRIM_RE = /^(#[0-9a-fA-F]{6}|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\))$/;

/**
 * Returns true when the palette object has all four fields with valid formats.
 *
 * accent, text, muted must be 6-digit hex (#RRGGBB).
 * scrim may be hex or rgba(...) — the canvas scrim layer uses opacity.
 */
export function isPaletteValid(p: unknown): p is Palette {
  if (!p || typeof p !== 'object') return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.scrim  === 'string' && SCRIM_RE.test(o.scrim)  &&
    typeof o.accent === 'string' && HEX6_RE.test(o.accent)  &&
    typeof o.text   === 'string' && HEX6_RE.test(o.text)    &&
    typeof o.muted  === 'string' && HEX6_RE.test(o.muted)
  );
}

/**
 * Type guard — returns true only when `raw` is a fully-valid PlannerIntent.
 *
 * Used by LayoutPlannerService to validate the GPT-4o response before
 * returning it. Any field failure causes DEFAULT_INTENT to be used instead.
 */
export function isValidPlannerIntent(raw: unknown): raw is PlannerIntent {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;

  return (
    typeof o.templateId === 'string' &&
    (VALID_TEMPLATE_IDS as readonly string[]).includes(o.templateId) &&

    typeof o.scrimSide  === 'string' &&
    (VALID_SCRIM_SIDES as readonly string[]).includes(o.scrimSide) &&

    isPaletteValid(o.palette) &&

    typeof o.reasoning === 'string'
  );
}
