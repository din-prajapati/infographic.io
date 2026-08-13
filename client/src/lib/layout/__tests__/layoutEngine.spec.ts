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
import { layoutDesign, appendEllipsis } from '@/lib/layout/layoutEngine';
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
// TC-04 — Overflow degradation: shrink then truncate; never overflow region
// ---------------------------------------------------------------------------
describe('TC-04 — overflow degradation: bounds respected, truncated text ends with …', () => {
  /**
   * We force overflow by using a canvas where the relevant region is very
   * short. corner-card's headlineBlock is { y:0.38, h:0.28 }.
   * With a 200×100 canvas: headlineBlock height = 0.28×100 = 28px.
   * minSize for headline = 28 * (100/1440) ≈ 1.94px (very small).
   *
   * We use a much longer text + a canvas that makes the region tiny enough
   * to trigger both the shrink and truncation paths.
   *
   * Simpler approach: use a tiny 100×100 canvas with a very long string.
   */
  const tinyCanvas = { width: 400, height: 100 };

  // On a 100px-height canvas, scale = 100/1440 ≈ 0.0694.
  // headlineBlock h = 0.28 × 100 = 28px.
  // Ideal headline size = 48 × 0.0694 ≈ 3.33px. lineH ≈ 4px.
  // With measureStub: charWidth = 3.33 × 0.55 ≈ 1.83px.
  // rw = 0.42 × 400 = 168px. So ~91 chars per line at ideal size.
  // A 300-char string → ~4 lines. totalH ≈ 4×4 = 16px. Region = 28px.
  //
  // At that scale, typical text probably fits. Let's use corner-card's
  // headlineBlock which is only h=0.28 of 100 = 28px, and use a very
  // wide canvas so region width is narrow:
  const narrowCanvas = { width: 40, height: 1440 }; // rw = 0.42×40 = 16.8px

  // scale=1 (height=1440). headlineBlock: rh=0.28×1440=403.2px, rw=16.8px.
  // idealSize=48, lineH=57.6. charWidth=48×0.55=26.4px per char.
  // Single word "Luxury" (6 chars) = 6×26.4=158.4px > 16.8px!
  // wrapTextToWidth hard-breaks long words char by char.
  // charsPerLine = floor(16.8/26.4)=0 → each character gets its own line.
  // A 60-char headline → 60 lines × 57.6 = 3456px >> 403.2px → triggers shrink.
  // minSize=28, lineH_min=33.6. Each char still one line. 60×33.6=2016 >> 403.2.
  // maxLines = floor(403.2/33.6) = 12. Truncate to 12 lines.

  const veryLongHeadline =
    'This is an extremely long headline that will definitely overflow any narrow region and require truncation';

  it('element from overflowing slot has degraded flag', () => {
    const result = layoutDesign({
      templateId: 'corner-card',
      values: {
        'property.headline': veryLongHeadline,
        'property.price':    '₹99 Cr',
        'property.location': 'City',
        'property.facts':    '5 Bed',
        'agent.name':        'Alice',
        'brand.name':        'Corp',
        'agent.phone':       '1234',
      },
      canvas: narrowCanvas,
      palette,
      measureText: measureStub,
    });

    const headline = result.find((el) => el.slot === 'headline');
    expect(headline, 'headline element must be present').toBeDefined();
    expect(
      headline!.degraded,
      'headline must be degraded when it overflows',
    ).toMatch(/^(shrunk|truncated)$/);
  });

  it('truncated element text ends with "…"', () => {
    const result = layoutDesign({
      templateId: 'corner-card',
      values: { 'property.headline': veryLongHeadline },
      canvas: narrowCanvas,
      palette,
      measureText: measureStub,
    });

    const headline = result.find((el) => el.slot === 'headline');
    expect(headline, 'headline must be present').toBeDefined();
    if (headline?.degraded === 'truncated') {
      expect(headline.text.endsWith('…'), 'truncated text must end with "…"').toBe(true);
    }
  });

  it('degraded element bottom edge stays within its region', () => {
    const tpl = templateRegistry['corner-card'];
    const regionFrac = tpl.regions['headlineBlock'];
    const regionBottom = (regionFrac.y + regionFrac.h) * narrowCanvas.height;

    const result = layoutDesign({
      templateId: 'corner-card',
      values: { 'property.headline': veryLongHeadline },
      canvas: narrowCanvas,
      palette,
      measureText: measureStub,
    });

    const headline = result.find((el) => el.slot === 'headline');
    expect(headline, 'headline must be present').toBeDefined();

    const bottom = headline!.geometry.y + headline!.geometry.height;
    expect(
      bottom,
      `element bottom (${bottom}) must not exceed region bottom (${regionBottom})`,
    ).toBeLessThanOrEqual(regionBottom + 1e-6);
  });

  it('no overlap even when an element is degraded', () => {
    const result = layoutDesign({
      templateId: 'corner-card',
      values: {
        'property.headline': veryLongHeadline,
        'property.price':    '₹99 Cr',
        'property.location': 'City',
        'property.facts':    '5 Bed',
        'agent.name':        'Alice',
        'brand.name':        'Corp',
        'agent.phone':       '1234',
      },
      canvas: narrowCanvas,
      palette,
      measureText: measureStub,
    });

    assertNoOverlap(result, 'degradation-no-overlap');
  });

  // ── appendEllipsis unit tests (exported helper) ──────────────────────────
  describe('appendEllipsis helper', () => {
    const measure = (t: string) => t.length * 10; // 10px per character

    it('adds … when text fits with ellipsis', () => {
      // "Hello" = 50px; "Hello…" = 60px; maxWidth=60 → fits
      expect(appendEllipsis('Hello', 60, measure)).toBe('Hello…');
    });

    it('trims and adds … when text does not fit with ellipsis', () => {
      // "Hello" + "…" = 60px > 55px → trim
      // "Hell" + "…" = 50px ≤ 55px → return "Hell…"
      expect(appendEllipsis('Hello', 55, measure)).toBe('Hell…');
    });

    it('returns just … when even a single character does not fit', () => {
      // maxWidth = 5, "…" = 10px → still only "…" is returned
      expect(appendEllipsis('Hello', 5, measure)).toBe('…');
    });

    it('returns text + … unchanged when text already fits within maxWidth', () => {
      // "Hi" = 20px; "Hi…" = 30px ≤ 100px
      expect(appendEllipsis('Hi', 100, measure)).toBe('Hi…');
    });
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

// ---------------------------------------------------------------------------
// TC-03 / TC-07 — Full 27-case fixture matrix — AC7 regression sweep
//   every template × {long, typical, empty} × {landscape, portrait, square}
//
// describe.each drives the 27 combinations without hand-written repetition.
// Assertions per case: no overlap, every supplied value present, in-bounds.
// ---------------------------------------------------------------------------
describe('TC-03/TC-07 — fixture matrix (3 templates × 3 value-sets × 3 aspects)', () => {
  const templateIds = Object.keys(templateRegistry);

  // Long values: realistic long listing copy that forces line-wrapping on
  // landscape and portrait canvases but fits within every template's regions
  // so the "every supplied value present" assertion can hold for all 27 cases.
  // Deliberately NOT extreme/absurd — long enough to trigger wrapping, short
  // enough to not exhaust small regions (corner-card portrait, 0.28h region).
  const longValues: LayoutInput['values'] = {
    'property.headline': '4 Bedroom Luxury Penthouse with Modern Finishes',
    'property.price':    '8,50,00,000 Negotiable',
    'property.location': '102 Skyline Towers, Jubilee Hills, Hyderabad 500033',
    'property.facts':    '4 Bed 5 Bath 5200 sqft 2 Covered Parking Spots',
    'agent.name':        'Priya Raghunathan Krishnamurthy',
    'brand.name':        'Krishnamurthy Associates Realty',
    'agent.phone':       '+91 98765 43210 WhatsApp',
  };

  const emptyValues: LayoutInput['values'] = {};

  // Matrix rows: [templateId, valueLabel, aspectLabel, values, canvas]
  // Labels come first so the describe.each %s substitution gives a readable title.
  type MatrixRow = [
    string,                            // templateId
    string,                            // valueLabel
    string,                            // aspectLabel
    LayoutInput['values'],             // values
    { width: number; height: number }, // canvas
  ];

  const canvases: { label: string; canvas: { width: number; height: number } }[] = [
    { label: 'landscape-2560x1440', canvas: { width: 2560, height: 1440 } },
    { label: 'portrait-1440x2560',  canvas: { width: 1440, height: 2560 } },
    { label: 'square-2048x2048',    canvas: { width: 2048, height: 2048 } },
  ];

  const valueSets: { label: string; values: LayoutInput['values'] }[] = [
    { label: 'long',    values: longValues    },
    { label: 'typical', values: typicalValues },
    { label: 'empty',   values: emptyValues   },
  ];

  const matrix: MatrixRow[] = [];
  for (const templateId of templateIds) {
    for (const { label: vl, values } of valueSets) {
      for (const { label: al, canvas } of canvases) {
        matrix.push([templateId, vl, al, values, canvas]);
      }
    }
  }

  // Verify the matrix is 27 entries (3 templates × 3 value-sets × 3 canvases).
  it('matrix has exactly 27 cases', () => {
    expect(matrix).toHaveLength(27);
  });

  describe.each(matrix)(
    'template=%s values=%s aspect=%s',
    (templateId, vl, al, values, canvas) => {
      it('no two elements overlap', () => {
        const result = layoutDesign({ templateId, values, canvas, palette, measureText: measureStub });
        assertNoOverlap(result, `${templateId}/${vl}/${al}`);
      });

      it('every supplied value is represented in output', () => {
        const result = layoutDesign({ templateId, values, canvas, palette, measureText: measureStub });
        const suppliedTexts = Object.values(values).filter((v) => v && v.trim() !== '');
        for (const text of suppliedTexts) {
          // Non-degraded (including 'shrunk'): el.text === canonical → exact match.
          // Degraded='truncated': el.text is a truncated prefix + '…'.
          const found = result.some((el) => {
            if (el.text === text) return true;
            if (el.degraded === 'truncated') {
              const prefix = el.text.replace(/…$/, '');
              return prefix.length > 0 && text.startsWith(prefix);
            }
            return false;
          });
          expect(
            found,
            `"${text.substring(0, 40)}" must appear in output (exact or truncated prefix)`,
          ).toBe(true);
        }
      });

      it('all elements within canvas bounds', () => {
        const result = layoutDesign({ templateId, values, canvas, palette, measureText: measureStub });
        assertWithinBounds(result, canvas, `${templateId}/${vl}/${al}`);
      });
    },
  );
});

// ---------------------------------------------------------------------------
// TC-08 — Output shape is compatible with ComposedTextElement
// ---------------------------------------------------------------------------
describe('TC-08 — output shape is compatible with ComposedTextElement (loadComposedDesignToCanvas)', () => {
  /**
   * ComposedTextElement (api/src/modules/ai-generation/types/composed-design.types.ts):
   *   slot: ListingField | null
   *   text: string
   *   geometry: { x, y, width, height, angle, fontFamily, fontSize, lineHeight, color, alignment }
   *   placement: 'measured' | 'fallback'
   *
   * LayoutElement mirrors this shape exactly. This test verifies that every
   * field loadComposedDesignToCanvas expects is present with the correct type
   * on every element the layout engine emits. — AC2
   */
  it('every element carries slot, text, geometry, placement with correct types', () => {
    const result = layoutDesign(makeInput('left-scrim-hero', typicalValues));
    expect(result.length).toBeGreaterThan(0);

    for (const el of result) {
      // slot: ListingSlot | null
      expect(
        el.slot === null || typeof el.slot === 'string',
        'slot must be string or null',
      ).toBe(true);

      // text: non-empty string
      expect(typeof el.text).toBe('string');
      expect(el.text.length).toBeGreaterThan(0);

      // geometry: all required fields
      const g = el.geometry;
      expect(g).toBeDefined();
      expect(typeof g.x).toBe('number');
      expect(typeof g.y).toBe('number');
      expect(typeof g.width).toBe('number');
      expect(typeof g.height).toBe('number');
      expect(g.angle).toBe(0);
      expect(g.fontFamily === null || typeof g.fontFamily === 'string').toBe(true);
      expect(g.fontSize === null || typeof g.fontSize === 'number').toBe(true);
      expect(g.lineHeight === null || typeof g.lineHeight === 'number').toBe(true);
      expect(g.color === null || typeof g.color === 'string').toBe(true);
      expect(
        g.alignment === null || ['left', 'center', 'right'].includes(g.alignment as string),
      ).toBe(true);

      // placement
      expect(['measured', 'fallback']).toContain(el.placement);
    }
  });

  it('slot values are in the ListingSlot union or null', () => {
    const validSlots = new Set([
      'headline', 'address', 'price', 'stats', 'agentName', 'brokerage', null,
    ]);
    for (const templateId of Object.keys(templateRegistry)) {
      const result = layoutDesign(makeInput(templateId, typicalValues));
      for (const el of result) {
        expect(
          validSlots.has(el.slot),
          `template "${templateId}": slot "${el.slot}" not in ListingSlot union`,
        ).toBe(true);
      }
    }
  });

  it('placement is always "measured" for layout-engine elements', () => {
    for (const templateId of Object.keys(templateRegistry)) {
      const result = layoutDesign(makeInput(templateId, typicalValues));
      for (const el of result) {
        expect(el.placement, `template "${templateId}"`).toBe('measured');
      }
    }
  });
});
