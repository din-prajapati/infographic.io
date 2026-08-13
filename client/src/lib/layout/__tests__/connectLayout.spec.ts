/**
 * US-AI-046 — layout connector
 *
 * Verifies the engine leads and layer extraction remains a genuine fallback.
 */
import { describe, it, expect } from 'vitest';
import {
  composeFromCanonicalValues,
  createMeasureText,
  orientationToCanvasSize,
  DEFAULT_TEMPLATE_ID,
} from '@/lib/layout/connectLayout';

const landscape = { width: 2560, height: 1440 };

const canonical = {
  headline:  'SPACIOUS 3 BHK VILLA',
  price:     '₹ 1,85,00,000',
  address:   'Shela, Ahmedabad',
  stats:     '3 Beds | 3 Baths | 2450 sq ft',
  agentName: 'Rajesh Patel',
  brokerage: 'Shela Realty',
};

describe('orientationToCanvasSize', () => {
  it('maps each orientation to the matching generation resolution', () => {
    expect(orientationToCanvasSize('landscape')).toEqual({ width: 2560, height: 1440 });
    expect(orientationToCanvasSize('portrait')).toEqual({ width: 1440, height: 2560 });
    expect(orientationToCanvasSize('square')).toEqual({ width: 2048, height: 2048 });
  });

  it('defaults to landscape for unknown or missing orientation', () => {
    expect(orientationToCanvasSize(undefined)).toEqual({ width: 2560, height: 1440 });
    expect(orientationToCanvasSize('nonsense')).toEqual({ width: 2560, height: 1440 });
  });
});

describe('createMeasureText', () => {
  it('returns a usable measurer even without a real canvas context', () => {
    // jsdom returns null from getContext('2d'); the proportional fallback must
    // still produce sane, monotonically increasing widths.
    const measure = createMeasureText();
    expect(typeof measure).toBe('function');
    const short = measure('ab', 100, 700);
    const long = measure('abcdefgh', 100, 700);
    expect(short).toBeGreaterThan(0);
    expect(long).toBeGreaterThan(short);
  });
});

describe('composeFromCanonicalValues', () => {
  it('composes every supplied value into positioned elements', () => {
    const result = composeFromCanonicalValues({
      canonicalValues: canonical,
      backgroundUrl: 'https://example.test/bg.png',
      canvas: landscape,
    });

    expect(result, 'engine path must produce a design').not.toBeNull();
    expect(result!.backgroundUrl).toBe('https://example.test/bg.png');

    for (const value of Object.values(canonical)) {
      const found = result!.elements.some((el) => el.text === value);
      expect(found, `"${value}" must appear in composed output`).toBe(true);
    }
  });

  it('marks the design as self-composed, not extracted', () => {
    // attempted:false is how a reader tells "we laid this out" apart from
    // "layer extraction ran and found things".
    const result = composeFromCanonicalValues({
      canonicalValues: canonical,
      backgroundUrl: 'bg',
      canvas: landscape,
    });
    expect(result!.extraction.attempted).toBe(false);
    expect(result!.extraction.matched).toBe(result!.elements.length);
  });

  it('places elements inside the canvas, not at the origin', () => {
    // The defect this story exists downstream of: text flush at x=0,y=0.
    const result = composeFromCanonicalValues({
      canonicalValues: canonical,
      backgroundUrl: 'bg',
      canvas: landscape,
    });
    for (const el of result!.elements) {
      expect(el.geometry.x).toBeGreaterThan(0);
      expect(el.geometry.y).toBeGreaterThan(0);
      expect(el.geometry.x + el.geometry.width).toBeLessThanOrEqual(landscape.width);
    }
  });

  // ── Fallback conditions — each must return null so the caller can fall back
  //    to layer extraction rather than render an empty canvas. ──────────────

  it('returns null when canonicalValues is absent', () => {
    expect(composeFromCanonicalValues({
      canonicalValues: undefined,
      backgroundUrl: 'bg',
      canvas: landscape,
    })).toBeNull();
  });

  it('returns null when every value is empty or whitespace', () => {
    expect(composeFromCanonicalValues({
      canonicalValues: { headline: '', price: '   ' },
      backgroundUrl: 'bg',
      canvas: landscape,
    })).toBeNull();
  });

  it('returns null for an unknown template rather than throwing', () => {
    expect(composeFromCanonicalValues({
      canonicalValues: canonical,
      backgroundUrl: 'bg',
      canvas: landscape,
      templateId: 'no-such-template',
    })).toBeNull();
  });

  it('composes from a partial record without inventing the missing fields', () => {
    const partial = { headline: 'JUST THE HEADLINE' };
    const result = composeFromCanonicalValues({
      canonicalValues: partial,
      backgroundUrl: 'bg',
      canvas: landscape,
    });
    expect(result).not.toBeNull();
    expect(result!.elements.some((el) => el.text === 'JUST THE HEADLINE')).toBe(true);
    // No placeholder text for absent fields.
    expect(result!.elements.every((el) => el.text.trim().length > 0)).toBe(true);
  });

  it('uses the default template when none is given', () => {
    const explicit = composeFromCanonicalValues({
      canonicalValues: canonical, backgroundUrl: 'bg', canvas: landscape,
      templateId: DEFAULT_TEMPLATE_ID,
    });
    const implicit = composeFromCanonicalValues({
      canonicalValues: canonical, backgroundUrl: 'bg', canvas: landscape,
    });
    expect(implicit).toEqual(explicit);
  });
});
