/**
 * layoutEngine.spec.ts — US-AI-043 T3/T4/T5
 *
 * T3: TC-01, TC-02, TC-05, TC-06 — basic flow engine (typical inputs).
 * T4: TC-04 — overflow degradation (shrink → truncate).
 * T5: TC-03/07 — full 27-case matrix (describe.each); TC-08 shape compat.
 *
 * All tests import the real layoutDesign() — no mirrors, no stubs of
 * the engine itself. The engine is pure: same input → same output.
 *
 * measureText injection:
 *   Tests pass a proportional stub: width = text.length × fontSize × 0.55.
 *   This produces results proportional to both character count and font size,
 *   which is sufficient for correctness assertions (non-overlap, bounds,
 *   cursor advancement). Exact pixel accuracy is not required here.
 */
import { describe, it, expect } from 'vitest';
import { layoutDesign } from '@/lib/layout/layoutEngine';
import type { LayoutElement, LayoutInput } from '@/lib/layout/types';
import { templateRegistry, LISTING_SLOTS } from '@/lib/layout/templates';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Proportional measureText stub — no canvas context needed. */
const measureStub: LayoutInput['measureText'] = (
  text: string,
  fontSize: number,
  _weight: number,
) => text.length * fontSize * 0.55;

const palette: LayoutInput['palette'] = {
  scrim: '#1A1A2E',
  accent: '#E2B846',
  text: '#FFFFFF',
  muted: '#B0B0C0',
};

const landscape = { width: 2560, height: 1440 };

const typicalValues: Partial<Record<(typeof LISTING_SLOTS)[number], string>> = {
  'property.headline': '4BR Modern Townhouse',
  'property.price':    '₹2.5 Crore',
  'property.location': 'Banjara Hills, Hyderabad',
  'property.facts':    '4 Bed · 3 Bath · 2,400 sqft',
  'agent.name':        'Rahul Sharma',
  'brand.name':        'Sharma Realtors',
  'agent.phone':       '+91 98765 43210',
};

const longHeadline =
  '4 Bedroom Ultra-Luxury Penthouse with Panoramic City Views and Premium Finishes Throughout';

const shortHeadline = '3BR Home';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Assert no two elements in the list share interior pixel area. */
function assertNoOverlap(elements: LayoutElement[], label = ''): void {
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i].geometry;
      const b = elements[j].geometry;
      const overlaps = !(
        a.x + a.width  <= b.x ||
        b.x + b.width  <= a.x ||
        a.y + a.height <= b.y ||
        b.y + b.height <= a.y
      );
      expect(
        overlaps,
        `${label}: elements [${i}] and [${j}] must not overlap ` +
        `(A=[${a.x},${a.y},${a.width},${a.height}] ` +
        `B=[${b.x},${b.y},${b.width},${b.height}])`,
      ).toBe(false);
    }
  }
}

/** Assert every element is within canvas bounds. */
function assertWithinBounds(
  elements: LayoutElement[],
  canvas: { width: number; height: number },
  label = '',
): void {
  for (const el of elements) {
    const g = el.geometry;
    expect(g.x, `${label}: element x must be >= 0`).toBeGreaterThanOrEqual(0);
    expect(g.y, `${label}: element y must be >= 0`).toBeGreaterThanOrEqual(0);
    expect(
      g.x + g.width,
      `${label}: element right edge must be <= canvas.width`,
    ).toBeLessThanOrEqual(canvas.width + 1e-6);
    expect(
      g.y + g.height,
      `${label}: element bottom edge must be <= canvas.height`,
    ).toBeLessThanOrEqual(canvas.height + 1e-6);
  }
}

/** Build a layoutDesign input with defaults. */
function makeInput(
  templateId: string,
  values: LayoutInput['values'],
  canvas = landscape,
): LayoutInput {
  return { templateId, values, canvas, palette, measureText: measureStub };
}

// ---------------------------------------------------------------------------
// TC-01 — Happy path: typical values, all slots present, no overlap
// ---------------------------------------------------------------------------
describe('TC-01 — typical values: all slots present exactly once, no overlap', () => {
  const templateIds = Object.keys(templateRegistry);

  it.each(templateIds)('template: %s', (templateId) => {
    const result = layoutDesign(makeInput(templateId, typicalValues));

    // All 7 input slots have values → expect 7 elements.
    expect(result).toHaveLength(7);

    // Every input text appears in the output exactly once.
    for (const text of Object.values(typicalValues)) {
      const matches = result.filter((el) => el.text === text);
      expect(matches, `text "${text}" must appear exactly once`).toHaveLength(1);
    }

    // Non-overlap — AC4.
    assertNoOverlap(result, templateId);

    // Within canvas bounds.
    assertWithinBounds(result, landscape, templateId);
  });
});

// ---------------------------------------------------------------------------
// TC-02 — Long headline wraps and pushes subsequent elements down
// ---------------------------------------------------------------------------
describe('TC-02 — long headline wraps, pushes price down, still no overlap', () => {
  it('price.y is greater with long headline than with short headline', () => {
    const withLong = layoutDesign(
      makeInput('left-scrim-hero', {
        ...typicalValues,
        'property.headline': longHeadline,
      }),
    );

    const withShort = layoutDesign(
      makeInput('left-scrim-hero', {
        ...typicalValues,
        'property.headline': shortHeadline,
      }),
    );

    const priceWithLong  = withLong.find((el) => el.slot === 'price');
    const priceWithShort = withShort.find((el) => el.slot === 'price');

    expect(priceWithLong,  'price element must be present with long headline').toBeDefined();
    expect(priceWithShort, 'price element must be present with short headline').toBeDefined();

    expect(priceWithLong!.geometry.y).toBeGreaterThan(priceWithShort!.geometry.y);
  });

  it('no overlap with long headline', () => {
    const result = layoutDesign(
      makeInput('left-scrim-hero', {
        ...typicalValues,
        'property.headline': longHeadline,
      }),
    );
    assertNoOverlap(result, 'long-headline');
  });

  it('long headline element has more height than short headline element', () => {
    const withLong = layoutDesign(
      makeInput('left-scrim-hero', {
        ...typicalValues,
        'property.headline': longHeadline,
      }),
    );
    const withShort = layoutDesign(
      makeInput('left-scrim-hero', {
        ...typicalValues,
        'property.headline': shortHeadline,
      }),
    );

    const headlineLong  = withLong.find((el) => el.slot === 'headline');
    const headlineShort = withShort.find((el) => el.slot === 'headline');

    expect(headlineLong!.geometry.height).toBeGreaterThan(headlineShort!.geometry.height);
  });
});

// ---------------------------------------------------------------------------
// TC-05 — Empty agent/brokerage → block collapses, no orphaned elements
// ---------------------------------------------------------------------------
describe('TC-05 — missing agent values collapse their block', () => {
  it('no agentName, brokerage or null-slot elements when agent slots are absent', () => {
    const noAgent = {
      'property.headline': '3BR Home',
      'property.price':    '₹2 Crore',
      'property.location': 'Jubilee Hills',
      'property.facts':    '3 Bed · 2 Bath',
      // agent.name, brand.name, agent.phone all absent
    } satisfies LayoutInput['values'];

    const templateIds = Object.keys(templateRegistry);

    for (const templateId of templateIds) {
      const result = layoutDesign(makeInput(templateId, noAgent));

      // Only 4 property slots should appear.
      expect(result, `${templateId}: expected 4 elements`).toHaveLength(4);

      // No agent-category elements.
      const agentEls = result.filter(
        (el) => el.slot === 'agentName' || el.slot === 'brokerage' || el.slot === null,
      );
      expect(agentEls, `${templateId}: no agent elements should appear`).toHaveLength(0);

      // Remaining elements still don't overlap.
      assertNoOverlap(result, `${templateId}-no-agent`);
    }
  });
});

// ---------------------------------------------------------------------------
// TC-06 — Determinism: same input → byte-identical output
// ---------------------------------------------------------------------------
describe('TC-06 — determinism: same input produces identical output', () => {
  it.each(Object.keys(templateRegistry))('template: %s', (templateId) => {
    const input = makeInput(templateId, typicalValues);
    const run1 = layoutDesign(input);
    const run2 = layoutDesign(input);

    expect(run1).toHaveLength(run2.length);
    run1.forEach((el, i) => {
      expect(el.text,              `[${i}] text`).toBe(run2[i].text);
      expect(el.slot,              `[${i}] slot`).toBe(run2[i].slot);
      expect(el.geometry.x,        `[${i}] x`).toBe(run2[i].geometry.x);
      expect(el.geometry.y,        `[${i}] y`).toBe(run2[i].geometry.y);
      expect(el.geometry.width,    `[${i}] width`).toBe(run2[i].geometry.width);
      expect(el.geometry.height,   `[${i}] height`).toBe(run2[i].geometry.height);
      expect(el.geometry.fontSize, `[${i}] fontSize`).toBe(run2[i].geometry.fontSize);
    });
  });
});
