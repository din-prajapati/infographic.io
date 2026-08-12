/**
 * templates.spec.ts — US-AI-043 T1/T2
 *
 * T1 (this commit): Region type shape tests + the regionsOverlap utility.
 * T2 (extended):   Full template registry validation — regions in bounds,
 *                   no overlaps, valid SlotIds, coverage of 7 listing slots.
 *
 * Non-overlap is the structural property that AC4 depends on.
 * These tests verify the TEMPLATE DATA, not the engine algorithm.
 */
import { describe, it, expect } from 'vitest';
import type { Region } from '@/lib/layout/types';

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
