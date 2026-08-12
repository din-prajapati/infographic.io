/**
 * Template registry — US-AI-043
 *
 * Data only. No logic in this file.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * How to add a template (AC8 — data change only)
 * ──────────────────────────────────────────────────────────────────────────
 * 1. Create a const that satisfies the Template interface (types.ts).
 *    - Use fraction values (0..1) for all region coordinates.
 *    - Ensure no two regions overlap (run the templates.spec.ts tests to verify).
 *    - Cover every slot in LISTING_SLOTS.
 *    - Add typeScale entries for every slot used in blocks.
 * 2. Add the const to the templateRegistry object below.
 *
 * layoutEngine.ts reads this registry and requires NO edits for new templates.
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Region coordinate system:
 *   { x, y }           = top-left corner as fractions of (canvas.width, canvas.height)
 *   { w, h }           = size as fractions of (canvas.width, canvas.height)
 *   right edge  = x + w  (must be ≤ 1)
 *   bottom edge = y + h  (must be ≤ 1)
 *
 * Non-overlap invariant:
 *   For every pair of regions (A, B) in a template:
 *     A.x + A.w ≤ B.x  OR  B.x + B.w ≤ A.x  OR
 *     A.y + A.h ≤ B.y  OR  B.y + B.h ≤ A.y
 *   (verified automatically by __tests__/templates.spec.ts)
 */
import type { Template } from './types';

// ---------------------------------------------------------------------------
// The seven listing slots every template in this registry must cover.
// Used in templates.spec.ts to verify coverage.
// ---------------------------------------------------------------------------
export const LISTING_SLOTS = [
  'property.headline',
  'property.price',
  'property.location',
  'property.facts',
  'agent.name',
  'brand.name',
  'agent.phone',
] as const satisfies readonly import('../slotIds').SlotId[];

// ---------------------------------------------------------------------------
// Shared typeScale at 1440px reference height.
// Covers every slot in LISTING_SLOTS. Values scale at runtime by
// (canvas.height / 1440) — see layoutEngine.ts step 4.
// ---------------------------------------------------------------------------
const defaultTypeScale: Template['typeScale'] = {
  'property.headline': { min: 28, ideal: 48, weight: 700 },
  'property.price':    { min: 22, ideal: 36, weight: 700 },
  'property.location': { min: 14, ideal: 20, weight: 400 },
  'property.facts':    { min: 14, ideal: 18, weight: 400 },
  'agent.name':        { min: 12, ideal: 16, weight: 600 },
  'brand.name':        { min: 10, ideal: 14, weight: 400 },
  'agent.phone':       { min: 10, ideal: 14, weight: 400 },
};

// ---------------------------------------------------------------------------
// Template 1 — left-scrim-hero
//
// Ported from the proven a1-composite.html spike composite (2026-08-12).
// A vertical scrim covers the left 38% of the canvas. Headline, price and
// address are stacked inside the scrim. A stats bar runs full-width at the
// bottom. Agent info sits in the bottom-right corner above the stats bar.
//
// Regions (fractions — non-overlapping by design):
//
//   scrim:      [0.00, 0.00] → [0.38, 0.82]   left 38%, top 82%
//   statsBar:   [0.00, 0.82] → [1.00, 1.00]   full-width bottom 18%
//   agentBlock: [0.62, 0.58] → [1.00, 0.82]   right 38%, rows 58%–82%
//
//   scrim  and statsBar share x=0..0.38, but y-ranges are disjoint.
//   scrim  and agentBlock share y=0.58..0.82, but x-ranges are disjoint
//          (scrim ends at x=0.38, agentBlock starts at x=0.62).
//   statsBar and agentBlock share x=0.62..1.0, but y-ranges are disjoint
//          (statsBar starts at y=0.82, agentBlock ends at y=0.82).
// ---------------------------------------------------------------------------
const leftScrimHero: Template = {
  id: 'left-scrim-hero',
  name: 'Left Scrim Hero',
  regions: {
    scrim:      { x: 0.00, y: 0.00, w: 0.38, h: 0.82 },
    statsBar:   { x: 0.00, y: 0.82, w: 1.00, h: 0.18 },
    agentBlock: { x: 0.62, y: 0.58, w: 0.38, h: 0.24 },
  },
  blocks: [
    {
      region: 'scrim',
      slots: ['property.headline', 'property.price', 'property.location'],
      align: 'left',
      gap: 8,
    },
    {
      region: 'statsBar',
      slots: ['property.facts'],
      align: 'left',
      gap: 0,
    },
    {
      region: 'agentBlock',
      slots: ['agent.name', 'brand.name', 'agent.phone'],
      align: 'right',
      gap: 4,
    },
  ],
  scrim: { region: 'scrim', direction: 'left' },
  typeScale: defaultTypeScale,
};

// ---------------------------------------------------------------------------
// Template 2 — bottom-band
//
// A full-width band occupies the lower 35% of the canvas. The photo shows
// above the band without any side scrim. Copy (headline, price, address,
// facts) fills the left 62% of the band; agent info occupies the right 32%.
// A 4% horizontal gap between the two blocks prevents touch.
//
// Regions (fractions — non-overlapping by design):
//
//   copyBlock:  [0.02, 0.63] → [0.64, 0.98]   left copy area
//   agentBlock: [0.66, 0.63] → [0.98, 0.98]   right agent area
//
//   x-ranges are disjoint: copyBlock ends at 0.64, agentBlock starts at 0.66.
//   y-ranges are identical but x-ranges don't overlap → no overlap.
// ---------------------------------------------------------------------------
const bottomBand: Template = {
  id: 'bottom-band',
  name: 'Bottom Band',
  regions: {
    copyBlock:  { x: 0.02, y: 0.63, w: 0.62, h: 0.35 },
    agentBlock: { x: 0.66, y: 0.63, w: 0.32, h: 0.35 },
  },
  blocks: [
    {
      region: 'copyBlock',
      slots: ['property.headline', 'property.price', 'property.location', 'property.facts'],
      align: 'left',
      gap: 6,
    },
    {
      region: 'agentBlock',
      slots: ['agent.name', 'brand.name', 'agent.phone'],
      align: 'right',
      gap: 4,
    },
  ],
  typeScale: defaultTypeScale,
};

// ---------------------------------------------------------------------------
// Template 3 — corner-card
//
// A solid card panel anchors the lower-left corner and holds all copy.
// The photo is otherwise unobstructed. Copy is split across three vertically
// adjacent sub-regions: headline/price at top, address/facts in the middle,
// agent info at the bottom.
//
// Regions (fractions — non-overlapping by design):
//
//   headlineBlock: [0.03, 0.38] → [0.45, 0.66]   rows 38%–66%, left 45%
//   detailBlock:   [0.03, 0.66] → [0.45, 0.81]   rows 66%–81%, left 45%
//   agentBlock:    [0.03, 0.81] → [0.45, 0.97]   rows 81%–97%, left 45%
//
//   All share x=[0.03, 0.45]. y-ranges are strictly adjacent: each bottom
//   edge equals the next region's top edge — no shared interior.
// ---------------------------------------------------------------------------
const cornerCard: Template = {
  id: 'corner-card',
  name: 'Corner Card',
  regions: {
    headlineBlock: { x: 0.03, y: 0.38, w: 0.42, h: 0.28 },
    detailBlock:   { x: 0.03, y: 0.66, w: 0.42, h: 0.15 },
    agentBlock:    { x: 0.03, y: 0.81, w: 0.42, h: 0.16 },
  },
  blocks: [
    {
      region: 'headlineBlock',
      slots: ['property.headline', 'property.price'],
      align: 'left',
      gap: 8,
    },
    {
      region: 'detailBlock',
      slots: ['property.location', 'property.facts'],
      align: 'left',
      gap: 4,
    },
    {
      region: 'agentBlock',
      slots: ['agent.name', 'brand.name', 'agent.phone'],
      align: 'left',
      gap: 3,
    },
  ],
  typeScale: defaultTypeScale,
};

// ---------------------------------------------------------------------------
// Registry — keyed by template.id. No logic.
// ---------------------------------------------------------------------------
export const templateRegistry: Record<string, Template> = {
  [leftScrimHero.id]: leftScrimHero,
  [bottomBand.id]:    bottomBand,
  [cornerCard.id]:    cornerCard,
};
