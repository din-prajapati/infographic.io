/**
 * templates.spec.ts — US-AI-043 T1/T2
 *
 * T1: Region type shape tests + the regionsOverlap utility.
 * T2: Full template registry validation — regions in bounds, no overlaps,
 *     valid SlotIds, complete coverage of the 7 listing slots.
 *
 * Non-overlap in the template data is the prerequisite for AC4's structural
 * guarantee: disjoint regions → disjoint output elements, by construction.
 */
import { describe, it, expect } from 'vitest';
import type { Region } from '@/lib/layout/types';
import { SLOT_IDS } from '@/lib/slotIds';
import { templateRegistry, LISTING_SLOTS } from '@/lib/layout/templates';

// ---------------------------------------------------------------------------
// Utility: rectangle intersection test for fraction-based regions.
// Two regions overlap when their pixel rectangles share interior area.
// Adjacent edges (touching but not intersecting) are NOT considered overlap.
// ---------------------------------------------------------------------------
export function regionsOverlap(a: Region, b: Region): boolean {
  return !(
    a.x + a.w <= b.x || // a is entirely left of b
    b.x + b.w <= a.x || // b is entirely left of a
    a.y + a.h <= b.y || // a is entirely above b
    b.y + b.h <= a.y    // b is entirely above a
  );
}

// ---------------------------------------------------------------------------
// T1 — Region type shape and overlap utility correctness
// ---------------------------------------------------------------------------
describe('Region — type shape', () => {
  it('can be constructed with fraction values', () => {
    const r: Region = { x: 0.0, y: 0.0, w: 0.38, h: 0.82 };
    expect(r.x).toBe(0.0);
    expect(r.y).toBe(0.0);
    expect(r.w).toBe(0.38);
    expect(r.h).toBe(0.82);
  });

  it('right edge = x + w, bottom edge = y + h', () => {
    const r: Region = { x: 0.1, y: 0.2, w: 0.3, h: 0.4 };
    expect(r.x + r.w).toBeCloseTo(0.4);
    expect(r.y + r.h).toBeCloseTo(0.6);
  });
});

// ---------------------------------------------------------------------------
// T2 — Template registry validation
// ---------------------------------------------------------------------------
describe('templateRegistry', () => {
  it('exports at least 3 templates — AC1', () => {
    expect(Object.keys(templateRegistry).length).toBeGreaterThanOrEqual(3);
  });

  const templates = Object.values(templateRegistry);

  it('includes left-scrim-hero, bottom-band, corner-card', () => {
    const ids = Object.keys(templateRegistry);
    expect(ids).toContain('left-scrim-hero');
    expect(ids).toContain('bottom-band');
    expect(ids).toContain('corner-card');
  });

  describe.each(templates)('$name ($id)', (tpl) => {
    it('every region has x, y, w, h within 0..1', () => {
      for (const [name, region] of Object.entries(tpl.regions)) {
        expect(region.x, `${name}.x`).toBeGreaterThanOrEqual(0);
        expect(region.y, `${name}.y`).toBeGreaterThanOrEqual(0);
        expect(region.w, `${name}.w`).toBeGreaterThan(0);
        expect(region.h, `${name}.h`).toBeGreaterThan(0);
        expect(region.x + region.w, `${name} right edge`).toBeLessThanOrEqual(1.0 + 1e-9);
        expect(region.y + region.h, `${name} bottom edge`).toBeLessThanOrEqual(1.0 + 1e-9);
      }
    });

    it('no two regions overlap — prerequisite for AC4', () => {
      const entries = Object.entries(tpl.regions);
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const [nameA, a] = entries[i];
          const [nameB, b] = entries[j];
          expect(
            regionsOverlap(a, b),
            `Regions "${nameA}" and "${nameB}" must not overlap`,
          ).toBe(false);
        }
      }
    });

    it('every block.region resolves to a declared region', () => {
      for (const block of tpl.blocks) {
        expect(
          tpl.regions,
          `block.region "${block.region}" must exist in template.regions`,
        ).toHaveProperty(block.region);
      }
    });

    it('every slot in every block is a valid SlotId', () => {
      const validSet = new Set<string>(SLOT_IDS);
      for (const block of tpl.blocks) {
        for (const slot of block.slots) {
          expect(
            validSet.has(slot),
            `"${slot}" is not a registered SlotId`,
          ).toBe(true);
        }
      }
    });

    it('covers all 7 listing slots exactly once across blocks', () => {
      const seen = new Set<string>();
      for (const block of tpl.blocks) {
        for (const slot of block.slots) {
          expect(seen.has(slot), `slot "${slot}" appears more than once`).toBe(false);
          seen.add(slot);
        }
      }
      for (const required of LISTING_SLOTS) {
        expect(seen.has(required), `template must cover slot "${required}"`).toBe(true);
      }
    });

    it('typeScale has entries for every slot used in blocks', () => {
      for (const block of tpl.blocks) {
        for (const slot of block.slots) {
          expect(
            tpl.typeScale[slot],
            `typeScale missing entry for slot "${slot}"`,
          ).toBeDefined();
        }
      }
    });
  });
});

describe('regionsOverlap utility', () => {
  it('fully separated horizontally → false', () => {
    const a: Region = { x: 0.00, y: 0.00, w: 0.38, h: 1.00 };
    const b: Region = { x: 0.62, y: 0.00, w: 0.38, h: 1.00 };
    expect(regionsOverlap(a, b)).toBe(false);
  });

  it('fully separated vertically → false', () => {
    const a: Region = { x: 0.00, y: 0.00, w: 1.00, h: 0.50 };
    const b: Region = { x: 0.00, y: 0.50, w: 1.00, h: 0.50 };
    expect(regionsOverlap(a, b)).toBe(false);
  });

  it('touching edges (no shared interior) → false', () => {
    // scrim ends at x=0.38; another region starts at x=0.38 — adjacent only
    const a: Region = { x: 0.00, y: 0.00, w: 0.38, h: 0.82 };
    const b: Region = { x: 0.38, y: 0.00, w: 0.62, h: 0.82 };
    expect(regionsOverlap(a, b)).toBe(false);
  });

  it('partial horizontal overlap → true', () => {
    const a: Region = { x: 0.00, y: 0.00, w: 0.50, h: 1.00 };
    const b: Region = { x: 0.40, y: 0.00, w: 0.50, h: 1.00 };
    expect(regionsOverlap(a, b)).toBe(true);
  });

  it('partial vertical overlap → true', () => {
    const a: Region = { x: 0.00, y: 0.00, w: 1.00, h: 0.60 };
    const b: Region = { x: 0.00, y: 0.50, w: 1.00, h: 0.60 };
    expect(regionsOverlap(a, b)).toBe(true);
  });

  it('full containment → true', () => {
    const a: Region = { x: 0.00, y: 0.00, w: 1.00, h: 1.00 };
    const b: Region = { x: 0.20, y: 0.20, w: 0.60, h: 0.60 };
    expect(regionsOverlap(a, b)).toBe(true);
  });

  it('identical regions → true', () => {
    const r: Region = { x: 0.0, y: 0.0, w: 0.5, h: 0.5 };
    expect(regionsOverlap(r, r)).toBe(true);
  });
});
