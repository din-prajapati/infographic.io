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
// Sizes are px at the 1440px reference height and scale with the canvas.
//
// These are the values proven in the a1-composite spike (2026-08-12), not
// web-page sizes. A 2560x1440 listing card is a billboard: the first pass
// shipped a 48px headline, which rendered as unreadable trim at full size.
// See docs/testing/reports/spike-pure-canvas-2026-08-12/ — `02-a1-composite.png`
// is the quality bar these numbers reproduce.
const defaultTypeScale: Template['typeScale'] = {
  'property.headline': { min: 56, ideal: 104, weight: 800 },
  'property.price':    { min: 48, ideal:  86, weight: 700 },
  'property.location': { min: 26, ideal:  40, weight: 400 },
  'property.facts':    { min: 24, ideal:  38, weight: 400 },
  'agent.name':        { min: 28, ideal:  44, weight: 700 },
  'brand.name':        { min: 20, ideal:  32, weight: 400 },
  'agent.phone':       { min: 18, ideal:  28, weight: 400 },
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
//   scrim:      [0.047, 0.26 ] → [0.377, 0.81]   copy column, inset from edges
//   statsBar:   [0.047, 0.918] → [0.953, 1.00]   near-full-width bottom band
//   agentBlock: [0.663, 0.58 ] → [0.963, 0.81]   right side, above the stats bar
//
//   ⚠️ Regions are INSET from the canvas edges on purpose. The first pass used
//   x=0, y=0, which flowed the headline flush into the top-left corner and put
//   the right-aligned agent block's edge at exactly 2560px, clipping it. A
//   region's origin IS the first element's origin — there is no separate
//   padding — so the inset has to live here in the data.
//
//   Non-overlap (AC4) still holds:
//     scrim × statsBar    — y disjoint (0.81 < 0.918)
//     scrim × agentBlock  — x disjoint (0.377 < 0.663)
//     statsBar × agentBlock — y disjoint (0.81 < 0.918)
// ---------------------------------------------------------------------------
const leftScrimHero: Template = {
  id: 'left-scrim-hero',
  name: 'Left Scrim Hero',
  regions: {
    scrim:      { x: 0.047, y: 0.260, w: 0.330, h: 0.550 },
    statsBar:   { x: 0.047, y: 0.918, w: 0.906, h: 0.082 },
    agentBlock: { x: 0.663, y: 0.580, w: 0.300, h: 0.230 },
  },
  blocks: [
    {
      region: 'scrim',
      slots: ['property.headline', 'property.price', 'property.location'],
      align: 'left',
      gap: 40,
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
      gap: 14,
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
    copyBlock:  { x: 0.047, y: 0.58, w: 0.580, h: 0.38 },
    agentBlock: { x: 0.660, y: 0.58, w: 0.290, h: 0.38 },
  },
  blocks: [
    {
      region: 'copyBlock',
      slots: ['property.headline', 'property.price', 'property.location', 'property.facts'],
      align: 'left',
      gap: 32,
    },
    {
      region: 'agentBlock',
      slots: ['agent.name', 'brand.name', 'agent.phone'],
      align: 'right',
      gap: 14,
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
    headlineBlock: { x: 0.047, y: 0.28, w: 0.400, h: 0.34 },
    detailBlock:   { x: 0.047, y: 0.64, w: 0.400, h: 0.14 },
    agentBlock:    { x: 0.047, y: 0.80, w: 0.400, h: 0.14 },
  },
  blocks: [
    {
      region: 'headlineBlock',
      slots: ['property.headline', 'property.price'],
      align: 'left',
      gap: 28,
    },
    {
      region: 'detailBlock',
      slots: ['property.location', 'property.facts'],
      align: 'left',
      gap: 14,
    },
    {
      region: 'agentBlock',
      slots: ['agent.name', 'brand.name', 'agent.phone'],
      align: 'left',
      gap: 10,
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
