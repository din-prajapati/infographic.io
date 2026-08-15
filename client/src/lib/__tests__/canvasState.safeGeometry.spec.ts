/**
 * US-AI-032 AC6 — computeSafeTextGeometry.
 *
 * Extracted from loadComposedDesignToCanvas per this repo's own canvas-testing
 * decision (client/vitest.config.ts header): pure geometry helpers, tested
 * directly, rather than mocking the full image-fetch/canvas pipeline.
 *
 * AC6: an element with missing or malformed geometry renders with a safe
 * default placement and style — never crashes, never drops the value (the
 * text itself is a separate field, untouched by this function; only
 * position/size are under test here).
 */
import { describe, it, expect } from 'vitest';
import { computeSafeTextGeometry } from '../canvasState';
import type { ComposedTextElementGeometry } from '../api';

const VALID: ComposedTextElementGeometry = {
  x: 100, y: 50, width: 300, height: 40, angle: 0,
  fontFamily: 'Montserrat-Bold.ttf', fontSize: 24, lineHeight: 1.2,
  color: '#FFFFFF', alignment: 'left',
};

const SCALE = 0.5;
const OFFSET_X = 10;
const OFFSET_Y = 20;

describe('computeSafeTextGeometry — US-AI-032 AC6', () => {
  it('scales and offsets valid geometry (happy path, sanity check)', () => {
    const result = computeSafeTextGeometry(VALID, SCALE, OFFSET_X, OFFSET_Y);

    expect(result.x).toBe(100 * SCALE + OFFSET_X);
    expect(result.y).toBe(50 * SCALE + OFFSET_Y);
    expect(result.width).toBe(300 * SCALE);
    expect(result.height).toBe(40 * SCALE);
    expect(result.fontSize).toBe(24 * SCALE);
    expect(result.angle).toBe(0);
  });

  it('geo entirely null → every field falls to the safe default, never throws', () => {
    const result = computeSafeTextGeometry(null, SCALE, OFFSET_X, OFFSET_Y);

    expect(() => computeSafeTextGeometry(null, SCALE, OFFSET_X, OFFSET_Y)).not.toThrow();
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.width).toBe(400);
    expect(result.height).toBe(60);
    expect(result.fontSize).toBe(24);
    expect(result.angle).toBe(0);
  });

  it('geo undefined (field absent from the payload) behaves the same as null', () => {
    const result = computeSafeTextGeometry(undefined, SCALE, OFFSET_X, OFFSET_Y);
    expect(result).toEqual(computeSafeTextGeometry(null, SCALE, OFFSET_X, OFFSET_Y));
  });

  it('NaN x/y fall back to the default rather than propagating NaN onto the canvas', () => {
    const geo = { ...VALID, x: NaN, y: NaN };
    const result = computeSafeTextGeometry(geo, SCALE, OFFSET_X, OFFSET_Y);

    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(Number.isNaN(result.x)).toBe(false);
    expect(Number.isNaN(result.y)).toBe(false);
  });

  it('Infinity width/height fall back to the default rather than an unbounded box', () => {
    const geo = { ...VALID, width: Infinity, height: -Infinity };
    const result = computeSafeTextGeometry(geo, SCALE, OFFSET_X, OFFSET_Y);

    expect(result.width).toBe(400);
    expect(result.height).toBe(60);
  });

  it('zero or negative width/height fall back to the default — a 0px or inverted box would be invisible', () => {
    const zero = computeSafeTextGeometry({ ...VALID, width: 0, height: 0 }, SCALE, OFFSET_X, OFFSET_Y);
    expect(zero.width).toBe(400);
    expect(zero.height).toBe(60);

    const negative = computeSafeTextGeometry({ ...VALID, width: -50, height: -10 }, SCALE, OFFSET_X, OFFSET_Y);
    expect(negative.width).toBe(400);
    expect(negative.height).toBe(60);
  });

  it('fontSize null, zero, negative, or non-finite all fall back to the default — text must stay legible, never 0px or negative', () => {
    for (const badFontSize of [null, 0, -12, NaN, Infinity] as const) {
      const result = computeSafeTextGeometry({ ...VALID, fontSize: badFontSize }, SCALE, OFFSET_X, OFFSET_Y);
      expect(result.fontSize, `fontSize=${badFontSize}`).toBe(24);
    }
  });

  it('non-finite angle falls back to 0 rather than an unrenderable rotation', () => {
    const result = computeSafeTextGeometry({ ...VALID, angle: NaN }, SCALE, OFFSET_X, OFFSET_Y);
    expect(result.angle).toBe(0);
  });

  it('a mix of valid and malformed fields degrades only the malformed ones — AC6 is per-field, not all-or-nothing', () => {
    const geo = { ...VALID, x: 200, y: NaN, width: 150, height: Infinity };
    const result = computeSafeTextGeometry(geo, SCALE, OFFSET_X, OFFSET_Y);

    expect(result.x).toBe(200 * SCALE + OFFSET_X); // valid — scaled normally
    expect(result.y).toBe(0);                       // malformed — safe default
    expect(result.width).toBe(150 * SCALE);          // valid — scaled normally
    expect(result.height).toBe(60);                  // malformed — safe default
  });
});
