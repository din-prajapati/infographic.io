/**
 * US-PANEL-01 — AC4 (error-path): malformed palette degrades to "no brand"
 * TC-PANEL-01-07
 *
 * Tests the real `resolveActivePalette` from client/src/lib/brandPalette.ts.
 * That module is deliberately dependency-free (no React/Zustand/motion) so it
 * imports cleanly into the Node vitest environment — unlike the sibling
 * canvasState.helpers.spec.ts, which had to mirror its logic.
 *
 * Run:
 *   cd api && npx vitest run tests/canvas/panel-brand-indicator.spec.ts --reporter=verbose
 */

import { describe, it, expect } from 'vitest';
import {
  resolveActivePalette,
  pickCanvasBackground,
  DEFAULT_CANVAS_BACKGROUND,
} from '../../../client/src/lib/brandPalette';

const validPalette = {
  id: 'modern-blue',
  name: 'Modern Blue',
  colors: ['#0F172A', '#3B82F6', '#60A5FA', '#DBEAFE', '#FFFFFF'],
  description: 'Professional & trustworthy',
};

describe('resolveActivePalette — AC4 malformed palette handling', () => {
  it('passes a well-formed palette through unchanged (identity, not a copy)', () => {
    expect(resolveActivePalette(validPalette)).toBe(validPalette);
  });

  it('returns null for no selection', () => {
    expect(resolveActivePalette(null)).toBeNull();
    expect(resolveActivePalette(undefined)).toBeNull();
  });

  it('returns null when colors is an empty array', () => {
    expect(resolveActivePalette({ ...validPalette, colors: [] })).toBeNull();
  });

  it('returns null when colors is null', () => {
    expect(resolveActivePalette({ ...validPalette, colors: null })).toBeNull();
  });

  it('returns null when the colors key is absent entirely', () => {
    // The realistic localStorage corruption: a half-written custom palette.
    expect(resolveActivePalette({ id: 'x', name: 'Half Written' } as any)).toBeNull();
  });

  it('returns null when colors is a non-array (hand-edited localStorage JSON)', () => {
    expect(resolveActivePalette({ ...validPalette, colors: '#FFFFFF' } as any)).toBeNull();
    expect(resolveActivePalette({ ...validPalette, colors: {} } as any)).toBeNull();
  });

  it('accepts a single-colour palette — one colour is still a brand', () => {
    const single = { ...validPalette, colors: ['#1F448B'] };
    expect(resolveActivePalette(single)).toBe(single);
  });
});

// ---------------------------------------------------------------------------
// AC9 — canvas background is derived, not assumed to be the last swatch
// TC-PANEL-01-13
//
// These are the real built-in palettes from RightSidebar.tsx. Luxury Gold is
// the reason this function exists: it is the one palette that does NOT end in
// white, so the old `colors[colors.length - 1]` rule painted the canvas warm
// brown while every sibling palette produced white.
// ---------------------------------------------------------------------------
const BUILT_INS: Record<string, string[]> = {
  'Luxury Gold': ['#1F1F1F', '#D4AF37', '#FFFFFF', '#F5F5F5', '#8B7355'],
  'Modern Blue': ['#0F172A', '#3B82F6', '#60A5FA', '#DBEAFE', '#FFFFFF'],
  'Natural Green': ['#14532D', '#16A34A', '#86EFAC', '#F0FDF4', '#FFFFFF'],
  'Elegant Navy': ['#1E293B', '#334155', '#94A3B8', '#E2E8F0', '#FFFFFF'],
  'Sunset Orange': ['#7C2D12', '#EA580C', '#FB923C', '#FED7AA', '#FFFFFF'],
  'Royal Purple': ['#4C1D95', '#7C3AED', '#A78BFA', '#EDE9FE', '#FFFFFF'],
};

describe('pickCanvasBackground — AC9 background derivation', () => {
  it('picks white for Luxury Gold, not the trailing warm brown (the reported bug)', () => {
    expect(pickCanvasBackground(BUILT_INS['Luxury Gold'])).toBe('#FFFFFF');
    // Regression guard: #8B7355 was what the old last-swatch rule produced.
    expect(pickCanvasBackground(BUILT_INS['Luxury Gold'])).not.toBe('#8B7355');
  });

  it('gives every built-in palette a white canvas', () => {
    for (const [name, colors] of Object.entries(BUILT_INS)) {
      expect(pickCanvasBackground(colors), `${name} background`).toBe('#FFFFFF');
    }
  });

  it('picks the lightest swatch regardless of position in the array', () => {
    expect(pickCanvasBackground(['#FFFFFF', '#000000', '#1F1F1F'])).toBe('#FFFFFF');
    expect(pickCanvasBackground(['#000000', '#1F1F1F', '#FFFFFF'])).toBe('#FFFFFF');
    expect(pickCanvasBackground(['#000000', '#FFFFFF', '#1F1F1F'])).toBe('#FFFFFF');
  });

  it('honours an all-dark custom palette rather than forcing white on it', () => {
    // A deliberately dark brand should get its own lightest colour, not #FFFFFF.
    expect(pickCanvasBackground(['#000000', '#1F1F1F', '#333333'])).toBe('#333333');
  });

  it('falls back to the store default when nothing in the palette parses', () => {
    expect(pickCanvasBackground(['rebeccapurple', 'not-a-color'])).toBe(
      DEFAULT_CANVAS_BACKGROUND,
    );
    expect(pickCanvasBackground([])).toBe(DEFAULT_CANVAS_BACKGROUND);
  });

  it('supports 3-digit hex swatches', () => {
    expect(pickCanvasBackground(['#000', '#fff'])).toBe('#fff');
  });
});
