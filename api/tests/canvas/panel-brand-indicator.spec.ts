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
import { resolveActivePalette } from '../../../client/src/lib/brandPalette';

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
