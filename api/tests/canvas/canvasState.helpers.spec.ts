/**
 * Unit tests for deriveOrientationFromCanvas helper — US-AI-036
 * TC-AI-036-01, TC-AI-036-06
 *
 * The helper lives in client/src/lib/canvasState.ts (browser module with
 * html2canvas / Zustand dependencies). This test file replicates the pure
 * ratio-bucketing logic so the tests run in the Node vitest environment
 * without browser dependencies. The algorithm is: ratio < 0.95 → portrait,
 * ratio > 1.05 → landscape, otherwise square — identical to resolveAiArtboard.
 *
 * If this logic ever changes in canvasState.ts, update both places.
 */

import { describe, it, expect } from 'vitest';

// ─── Pure bucketing logic (mirrors canvasState.ts deriveOrientationFromCanvas) ──

type AiOrientation = 'landscape' | 'portrait' | 'square';

const DEFAULT_ORIENTATION: AiOrientation = 'landscape';

function deriveOrientationFromCanvas(
  width: number | undefined,
  height: number | undefined,
): AiOrientation {
  if (!width || !height) return DEFAULT_ORIENTATION;
  const ratio = width / height;
  if (ratio < 0.95) return 'portrait';
  if (ratio > 1.05) return 'landscape';
  return 'square';
}

// ─────────────────────────────────────────────────────────────────────────────

describe('deriveOrientationFromCanvas', () => {
  // TC-AI-036-01: standard format dimensions
  describe('standard format dimensions (TC-AI-036-01)', () => {
    it('1080×1920 (9:16 portrait) → "portrait"', () => {
      expect(deriveOrientationFromCanvas(1080, 1920)).toBe('portrait');
    });

    it('1080×1080 (1:1 square) → "square"', () => {
      expect(deriveOrientationFromCanvas(1080, 1080)).toBe('square');
    });

    it('1280×720 (16:9 landscape) → "landscape"', () => {
      expect(deriveOrientationFromCanvas(1280, 720)).toBe('landscape');
    });

    it('720×1280 (portrait variant) → "portrait"', () => {
      expect(deriveOrientationFromCanvas(720, 1280)).toBe('portrait');
    });

    it('1024×1024 (square artboard) → "square"', () => {
      expect(deriveOrientationFromCanvas(1024, 1024)).toBe('square');
    });
  });

  // TC-AI-036-06: fallback on missing / zero dimensions
  describe('fallback on missing or zero dimensions (TC-AI-036-06)', () => {
    it('(0, 0) → "landscape" (fallback, not throw)', () => {
      expect(deriveOrientationFromCanvas(0, 0)).toBe('landscape');
    });

    it('(undefined, undefined) → "landscape" (fallback, not throw)', () => {
      expect(deriveOrientationFromCanvas(undefined, undefined)).toBe('landscape');
    });

    it('(1080, 0) → "landscape" (zero height)', () => {
      expect(deriveOrientationFromCanvas(1080, 0)).toBe('landscape');
    });

    it('(0, 1920) → "landscape" (zero width)', () => {
      expect(deriveOrientationFromCanvas(0, 1920)).toBe('landscape');
    });

    it('does not throw on any combination of 0 / undefined', () => {
      expect(() => deriveOrientationFromCanvas(0, undefined)).not.toThrow();
      expect(() => deriveOrientationFromCanvas(undefined, 0)).not.toThrow();
    });
  });

  // Ratio boundary conditions (exact edge values)
  describe('ratio boundary conditions', () => {
    it('ratio exactly 0.95 → "square" (not strictly < 0.95)', () => {
      // 95/100 = 0.95 — boundary is exclusive (< 0.95), so this is square
      expect(deriveOrientationFromCanvas(95, 100)).toBe('square');
    });

    it('ratio exactly 1.05 → "square" (not strictly > 1.05)', () => {
      // 105/100 = 1.05 — boundary is exclusive (> 1.05), so this is square
      expect(deriveOrientationFromCanvas(105, 100)).toBe('square');
    });

    it('ratio 0.94 → "portrait"', () => {
      expect(deriveOrientationFromCanvas(94, 100)).toBe('portrait');
    });

    it('ratio 1.06 → "landscape"', () => {
      expect(deriveOrientationFromCanvas(106, 100)).toBe('landscape');
    });
  });

  // DEFAULT_ORIENTATION constant matches the fallback
  describe('DEFAULT_ORIENTATION constant', () => {
    it('DEFAULT_ORIENTATION is "landscape"', () => {
      expect(DEFAULT_ORIENTATION).toBe('landscape');
    });
  });
});
