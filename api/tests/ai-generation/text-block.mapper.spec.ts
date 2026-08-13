/**
 * US-AI-031b — Text-block mapper unit tests
 *
 * mapBlocksToFields() is a PURE function — no mocking needed. These tests drive
 * fixture geometry through the mapper and assert on ComposedTextElement[] output.
 *
 * This is the test suite with the longest expected lifespan in EPIC-AI-06: the mapper
 * must survive a provider swap (B-17) without modification, so these tests are the
 * regression net that makes that safe.
 *
 * TC-AI-031b-01  Fixture blocks + canonical data → every canonical value at measured geometry
 * TC-AI-031b-02  Detected text drifts from canonical → canonical value rendered, not detected
 * TC-AI-031b-03  Zero blocks → all canonical fields rendered via fallback geometry
 * TC-AI-031b-05  Unmatched decorative block → preserved with its own text
 * TC-AI-031b-06  Unmatched block matching phone/email/URL → dropped, not preserved
 * AC3            Fuzzy match beats role hint when both could apply
 * AC5            inferFallbackGeometry returns deterministic portrait/landscape positions
 */

import { describe, it, expect } from 'vitest';
import { mapBlocksToFields, inferFallbackGeometry } from '../../src/modules/ai-generation/services/text-block.mapper';
import { ExtractedTextBlock, ListingField } from '../../src/modules/ai-generation/types/composed-design.types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** Build a minimal ExtractedTextBlock for tests — every unspecified field is null/0. */
function block(
  detectedText: string,
  overrides: Partial<ExtractedTextBlock> = {},
): ExtractedTextBlock {
  return {
    detectedText,
    x: 100, y: 200, width: 800, height: 60,
    angle: 0,
    fontFamily: null, fontSize: null, lineHeight: null,
    color: null, alignment: null, role: null,
    ...overrides,
  };
}

/** Canonical values for a typical US listing. */
const CANONICAL: Record<ListingField, string> = {
  headline:  'Sleek Contemporary Oasis',
  address:   '123 Main St, Anytown',
  price:     '$520K',
  stats:     '3 BD | 2 BA | 1,800 SQ FT',
  agentName: 'John Smith',
  brokerage: 'RE/MAX Gold',
};

// ─── TC-AI-031b-01: all blocks match their canonical fields ──────────────────

describe('mapBlocksToFields — TC-AI-031b-01', () => {
  it('maps every fixture block to its canonical field at measured geometry', () => {
    const blocks = [
      block('Sleek Contemporary Oasis', { x: 72, y: 200, width: 1296, height: 100, role: 'heading', fontSize: 72 }),
      block('123 Main St, Anytown',     { x: 72, y: 330, width: 1296, height: 40,  role: 'body',    fontSize: 28 }),
      block('$520K',                    { x: 72, y: 640, width: 1296, height: 80,  role: 'subheading', fontSize: 56 }),
      block('3 BD | 2 BA | 1,800 SQ FT', { x: 72, y: 750, width: 1296, height: 40, role: 'body',   fontSize: 24 }),
      block('John Smith',               { x: 72, y: 2100, width: 700, height: 50,  role: 'body',    fontSize: 28 }),
      block('RE/MAX Gold',              { x: 72, y: 2200, width: 1000, height: 40, role: 'caption', fontSize: 22 }),
    ];

    const elements = mapBlocksToFields(blocks, CANONICAL);

    // Every canonical field must appear exactly once
    const slotCounts: Record<string, number> = {};
    for (const el of elements) {
      if (el.slot) slotCounts[el.slot] = (slotCounts[el.slot] ?? 0) + 1;
    }
    expect(slotCounts['headline']).toBe(1);
    expect(slotCounts['address']).toBe(1);
    expect(slotCounts['price']).toBe(1);
    expect(slotCounts['stats']).toBe(1);
    expect(slotCounts['agentName']).toBe(1);
    expect(slotCounts['brokerage']).toBe(1);

    // All slots should be 'measured' (block was detected)
    const measured = elements.filter(e => e.slot !== null && e.placement === 'measured');
    expect(measured).toHaveLength(6);

    // Geometry from the block, not the fallback defaults
    const headline = elements.find(e => e.slot === 'headline')!;
    expect(headline.geometry.x).toBe(72);
    expect(headline.geometry.y).toBe(200);
    expect(headline.geometry.fontSize).toBe(72);
  });
});

// ─── TC-AI-031b-02: canonical value wins even when detected text drifts ──────

describe('mapBlocksToFields — TC-AI-031b-02 (AC8)', () => {
  it('renders the canonical price even when the block detected "$520k" (wrong case)', () => {
    const blocks = [
      block('$520k', { role: 'subheading', fontSize: 56 }), // drifted — canonical is "$520K"
      block('Sleek Contemporary Oasis', { role: 'heading', fontSize: 72 }),
    ];

    const elements = mapBlocksToFields(blocks, CANONICAL);

    const priceEl = elements.find(e => e.slot === 'price');
    expect(priceEl).toBeDefined();
    // AC8: rendered value is canonical, never detected
    expect(priceEl!.text).toBe('$520K');
    expect(priceEl!.text).not.toBe('$520k');
    expect(priceEl!.placement).toBe('measured');
  });

  it('renders the canonical address even when detected text has an abbreviation', () => {
    const blocks = [
      block('123 Main Street', { role: 'body', fontSize: 28 }), // "Street" vs "St"
      block('Sleek Contemporary Oasis', { role: 'heading', fontSize: 72 }),
    ];

    const elements = mapBlocksToFields(blocks, CANONICAL);

    const addressEl = elements.find(e => e.slot === 'address');
    expect(addressEl).toBeDefined();
    // Canonical wins even if not an exact match (fuzzy word overlap)
    expect(addressEl!.text).toBe('123 Main St, Anytown');
    expect(addressEl!.placement).toBe('measured');
  });
});

// ─── TC-AI-031b-03: zero blocks → all-fallback ───────────────────────────────

describe('mapBlocksToFields — TC-AI-031b-03 (AC5)', () => {
  it('emits every canonical field with placement:fallback when blocks is empty', () => {
    const elements = mapBlocksToFields([], CANONICAL);

    // All 6 canonical fields must be present
    const slotNames = elements.map(e => e.slot).filter(Boolean);
    expect(slotNames).toContain('headline');
    expect(slotNames).toContain('address');
    expect(slotNames).toContain('price');
    expect(slotNames).toContain('stats');
    expect(slotNames).toContain('agentName');
    expect(slotNames).toContain('brokerage');

    // All must be fallback
    const nonFallback = elements.filter(e => e.slot !== null && e.placement !== 'fallback');
    expect(nonFallback).toHaveLength(0);
  });

  it('uses canonical text, not detectedText, for fallback elements (AC8)', () => {
    const elements = mapBlocksToFields([], CANONICAL);
    const headline = elements.find(e => e.slot === 'headline')!;
    expect(headline.text).toBe('Sleek Contemporary Oasis');
  });

  it('never emits a fallback element for an empty canonical value', () => {
    const partialCanonical: Record<ListingField, string> = {
      ...CANONICAL,
      agentName: '',  // not provided
      brokerage: '',
    };
    const elements = mapBlocksToFields([], partialCanonical);
    expect(elements.find(e => e.slot === 'agentName')).toBeUndefined();
    expect(elements.find(e => e.slot === 'brokerage')).toBeUndefined();
  });
});

// ─── TC-AI-031b-05: unmatched decorative block preserved (AC4) ───────────────

describe('mapBlocksToFields — TC-AI-031b-05 (AC4)', () => {
  it('preserves an unmatched decorative block with its own detectedText', () => {
    const blocks = [
      block('FOR SALE', { x: 500, y: 100, role: 'caption', fontSize: 14 }), // decorative
      block('Sleek Contemporary Oasis', { role: 'heading', fontSize: 72 }),
    ];

    const elements = mapBlocksToFields(blocks, {
      ...CANONICAL,
      address: '', price: '', stats: '', agentName: '', brokerage: '',
    });

    const decorative = elements.find(e => e.slot === null);
    expect(decorative).toBeDefined();
    expect(decorative!.text).toBe('FOR SALE');
    expect(decorative!.geometry.x).toBe(500);
    expect(decorative!.geometry.y).toBe(100);
    expect(decorative!.placement).toBe('measured');
  });
});

// ─── TC-AI-031b-06: contact-shaped block dropped (Identity policy) ───────────

describe('mapBlocksToFields — TC-AI-031b-06 (Identity policy)', () => {
  it('drops a phone number block that matches no canonical field', () => {
    const blocks = [
      block('(555) 123-4567', { role: 'caption', fontSize: 18 }),
      block('Sleek Contemporary Oasis', { role: 'heading', fontSize: 72 }),
    ];

    const elements = mapBlocksToFields(blocks, {
      ...CANONICAL,
      address: '', price: '', stats: '', agentName: '', brokerage: '',
    });

    // The phone block must NOT appear as a decorative element
    const decoratives = elements.filter(e => e.slot === null);
    expect(decoratives.map(e => e.text)).not.toContain('(555) 123-4567');
  });

  it('drops an email address block', () => {
    const blocks = [
      block('agent@realestate.com', { role: 'caption', fontSize: 16 }),
      block('Sleek Contemporary Oasis', { role: 'heading', fontSize: 72 }),
    ];

    const elements = mapBlocksToFields(blocks, {
      ...CANONICAL,
      address: '', price: '', stats: '', agentName: '', brokerage: '',
    });

    const decoratives = elements.filter(e => e.slot === null);
    expect(decoratives.map(e => e.text)).not.toContain('agent@realestate.com');
  });

  it('drops a URL block', () => {
    const blocks = [
      block('www.remaxgold.com', { role: 'caption', fontSize: 14 }),
      block('Sleek Contemporary Oasis', { role: 'heading', fontSize: 72 }),
    ];

    const elements = mapBlocksToFields(blocks, {
      ...CANONICAL,
      address: '', price: '', stats: '', agentName: '', brokerage: '',
    });

    const decoratives = elements.filter(e => e.slot === null);
    expect(decoratives.map(e => e.text)).not.toContain('www.remaxgold.com');
  });

  it('preserves a non-contact decorative block (AC4 baseline still holds)', () => {
    const blocks = [
      block('LUXURY LISTING', { role: 'caption', fontSize: 16 }),
      block('Sleek Contemporary Oasis', { role: 'heading', fontSize: 72 }),
    ];

    const elements = mapBlocksToFields(blocks, {
      ...CANONICAL,
      address: '', price: '', stats: '', agentName: '', brokerage: '',
    });

    const decoratives = elements.filter(e => e.slot === null);
    expect(decoratives.map(e => e.text)).toContain('LUXURY LISTING');
  });
});

// ─── AC3: fuzzy match priority over role hint ─────────────────────────────────

describe('mapBlocksToFields — AC3: fuzzy match beats role tiebreak', () => {
  it('assigns the price block by fuzzy match even when its role matches heading', () => {
    // Simulate a scenario where a large-font price block has role=heading (Ideogram
    // sees it as the dominant element). Fuzzy match against "$520K" should win.
    const blocks = [
      block('$520K', { role: 'heading', fontSize: 80 }), // role suggests headline, but text says price
      block('Sleek Contemporary Oasis', { role: 'subheading', fontSize: 40 }),
    ];

    const elements = mapBlocksToFields(blocks, CANONICAL);

    // The price canonical value should be matched to the "$520K" block, not the headline
    const priceEl = elements.find(e => e.slot === 'price');
    expect(priceEl).toBeDefined();
    expect(priceEl!.geometry.fontSize).toBe(80); // the "$520K" block's geometry

    // Headline should still be placed (possibly via fallback since no good block remains)
    const headlineEl = elements.find(e => e.slot === 'headline');
    expect(headlineEl).toBeDefined();
  });
});

// ─── AC5: inferFallbackGeometry positions ────────────────────────────────────

describe('inferFallbackGeometry — AC5', () => {
  it('returns deterministic positions for all fields in portrait canvas', () => {
    const canvas = { width: 1440, height: 2560 };
    const fields: ListingField[] = ['headline', 'address', 'price', 'stats', 'agentName', 'brokerage'];

    for (const field of fields) {
      const g = inferFallbackGeometry(field, '', canvas);
      expect(g.x).toBeGreaterThanOrEqual(0);
      expect(g.y).toBeGreaterThanOrEqual(0);
      expect(g.width).toBeGreaterThan(0);
      expect(g.height).toBeGreaterThan(0);
      expect(g.angle).toBe(0);
      // Positions must fit within the canvas
      expect(g.x + g.width).toBeLessThanOrEqual(canvas.width);
      expect(g.y + g.height).toBeLessThanOrEqual(canvas.height);
    }
  });

  it('places headline above price above address in portrait layout', () => {
    const canvas = { width: 1440, height: 2560 };
    const h = inferFallbackGeometry('headline', '', canvas);
    const p = inferFallbackGeometry('price',    '', canvas);
    const a = inferFallbackGeometry('address',  '', canvas);
    // headline y < price y < address y for typical portrait listing layout
    expect(h.y).toBeLessThan(p.y);
    expect(p.y).toBeLessThan(a.y);
  });

  it('places agentName above brokerage at the bottom', () => {
    const canvas = { width: 1440, height: 2560 };
    const agent    = inferFallbackGeometry('agentName', '', canvas);
    const brokerage = inferFallbackGeometry('brokerage', '', canvas);
    expect(agent.y).toBeLessThan(brokerage.y);
  });

  it('headline is above the midpoint for portrait canvas', () => {
    const canvas = { width: 1440, height: 2560 };
    const h = inferFallbackGeometry('headline', '', canvas);
    expect(h.y).toBeLessThan(canvas.height / 2);
  });

  it('responds to "upper portion" prose hint by moving agentName to top half', () => {
    const canvas = { width: 1440, height: 2560 };
    const defaultAgent = inferFallbackGeometry('agentName', '', canvas);
    const upperAgent   = inferFallbackGeometry('agentName', 'agent info in upper portion of design', canvas);
    expect(upperAgent.y).toBeLessThan(defaultAgent.y);
  });

  it('adapts to landscape canvas (2560×1440)', () => {
    const canvas = { width: 2560, height: 1440 };
    const fields: ListingField[] = ['headline', 'address', 'price', 'stats', 'agentName', 'brokerage'];

    for (const field of fields) {
      const g = inferFallbackGeometry(field, '', canvas);
      // Must fit within the landscape canvas
      expect(g.x + g.width).toBeLessThanOrEqual(canvas.width);
      expect(g.y + g.height).toBeLessThanOrEqual(canvas.height);
    }
  });
});
