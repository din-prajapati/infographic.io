/**
 * fontMap.ts unit tests — US-AI-049
 *
 * TC-AI-049-01  AC1: every observed identifier maps to expected {family, weight}
 * TC-AI-049-02  AC2: garbage identifier + alternatives → first alternative parsed;
 *                    no alternatives → Inter 400
 * TC-AI-049-05  AC6: empty or fully-unparseable alternatives → Inter 400, no throw
 *
 * These are pure function tests — no DOM, no canvas, no network.
 * Run with: cd client && npx vitest run src/lib/__tests__/fontMap.spec.ts
 */

import { describe, it, expect } from 'vitest';
import { mapExtractedFont } from '@/lib/fontMap';

// ─── TC-AI-049-01: AC1 — happy-path weight suffix parsing ────────────────────

describe('mapExtractedFont — AC1: weight suffix parsing (TC-AI-049-01)', () => {
  // Observed identifiers from the 2026-08-13 live payload.
  it('Montserrat-Bold.ttf → { family: Montserrat, weight: 700 }', () => {
    expect(mapExtractedFont('Montserrat-Bold.ttf')).toEqual({ family: 'Montserrat', weight: 700 });
  });

  it('Montserrat-SemiBold.ttf → { family: Montserrat, weight: 600 }', () => {
    expect(mapExtractedFont('Montserrat-SemiBold.ttf')).toEqual({ family: 'Montserrat', weight: 600 });
  });

  it('Montserrat-Medium.ttf → { family: Montserrat, weight: 500 }', () => {
    expect(mapExtractedFont('Montserrat-Medium.ttf')).toEqual({ family: 'Montserrat', weight: 500 });
  });

  it('Montserrat-Light.ttf → { family: Montserrat, weight: 300 }', () => {
    expect(mapExtractedFont('Montserrat-Light.ttf')).toEqual({ family: 'Montserrat', weight: 300 });
  });

  it('Montserrat-Regular.ttf → { family: Montserrat, weight: 400 }', () => {
    expect(mapExtractedFont('Montserrat-Regular.ttf')).toEqual({ family: 'Montserrat', weight: 400 });
  });

  it('Montserrat-ExtraBold.ttf → { family: Montserrat, weight: 800 }', () => {
    expect(mapExtractedFont('Montserrat-ExtraBold.ttf')).toEqual({ family: 'Montserrat', weight: 800 });
  });

  it('Montserrat-ExtraLight.ttf → { family: Montserrat, weight: 200 }', () => {
    expect(mapExtractedFont('Montserrat-ExtraLight.ttf')).toEqual({ family: 'Montserrat', weight: 200 });
  });

  it('Montserrat-Thin.ttf → { family: Montserrat, weight: 100 }', () => {
    expect(mapExtractedFont('Montserrat-Thin.ttf')).toEqual({ family: 'Montserrat', weight: 100 });
  });

  it('Montserrat-Black.ttf → { family: Montserrat, weight: 900 }', () => {
    expect(mapExtractedFont('Montserrat-Black.ttf')).toEqual({ family: 'Montserrat', weight: 900 });
  });

  it('no suffix (plain family name): Montserrat.ttf → { family: Montserrat, weight: 400 }', () => {
    expect(mapExtractedFont('Montserrat.ttf')).toEqual({ family: 'Montserrat', weight: 400 });
  });

  it('no suffix (no extension): Montserrat → { family: Montserrat, weight: 400 }', () => {
    expect(mapExtractedFont('Montserrat')).toEqual({ family: 'Montserrat', weight: 400 });
  });

  it('multi-word family with Bold: Playfair-Display-Bold.ttf → { family: Playfair Display, weight: 700 }', () => {
    // Hyphens in the family name are converted to spaces.
    expect(mapExtractedFont('Playfair-Display-Bold.ttf')).toEqual({
      family: 'Playfair Display',
      weight: 700,
    });
  });

  it('multi-word family with Medium: Open-Sans-Medium.ttf → { family: Open Sans, weight: 500 }', () => {
    expect(mapExtractedFont('Open-Sans-Medium.ttf')).toEqual({ family: 'Open Sans', weight: 500 });
  });

  it('ExtraBold is matched before Bold in Montserrat-ExtraBold.ttf (longest-first guard)', () => {
    // Ensure "-Bold" at the end of "-ExtraBold" is not matched first.
    const result = mapExtractedFont('Montserrat-ExtraBold.ttf');
    expect(result.weight).toBe(800); // ExtraBold = 800, not Bold = 700
    expect(result.family).toBe('Montserrat');
  });
});

// ─── TC-AI-049-02: AC2 — error-path: alternatives fallback ───────────────────

describe('mapExtractedFont — AC2: alternatives fallback (TC-AI-049-02)', () => {
  it('unrecognisable primary (hash) → falls back to first parseable alternative', () => {
    const result = mapExtractedFont('IMFeFCrm28P.ttf', ['font__playfair-display__700']);
    expect(result).toEqual({ family: 'Playfair Display', weight: 700 });
  });

  it('unrecognisable primary → skips unparseable alternatives to reach parseable one', () => {
    const result = mapExtractedFont('IMFeFCrm28P.ttf', ['bad-entry', 'font__montserrat__500']);
    expect(result).toEqual({ family: 'Montserrat', weight: 500 });
  });

  it('unrecognisable primary + no alternatives → Inter 400 (final fallback)', () => {
    expect(mapExtractedFont('IMFeFCrm28P.ttf')).toEqual({ family: 'Inter', weight: 400 });
  });

  it('unrecognisable primary + undefined alternatives → Inter 400 (no throw)', () => {
    expect(() => mapExtractedFont('IMFeFCrm28P.ttf', undefined)).not.toThrow();
    expect(mapExtractedFont('IMFeFCrm28P.ttf', undefined)).toEqual({ family: 'Inter', weight: 400 });
  });

  it('null fontName + valid alternative → parses first alternative', () => {
    expect(mapExtractedFont(null, ['font__playfair-display__700'])).toEqual({
      family: 'Playfair Display',
      weight: 700,
    });
  });

  it('null fontName + no alternatives → Inter 400', () => {
    expect(mapExtractedFont(null)).toEqual({ family: 'Inter', weight: 400 });
  });

  it('undefined fontName + no alternatives → Inter 400', () => {
    expect(mapExtractedFont(undefined)).toEqual({ family: 'Inter', weight: 400 });
  });

  it('fontName empty string + valid alternatives → falls back to alternative', () => {
    expect(mapExtractedFont('', ['font__montserrat__700'])).toEqual({
      family: 'Montserrat',
      weight: 700,
    });
  });

  it('Google Fonts slug converts kebab-case correctly: font__inter__400 → Inter 400', () => {
    expect(mapExtractedFont(null, ['font__inter__400'])).toEqual({ family: 'Inter', weight: 400 });
  });

  it('Google Fonts slug: font__playfair-display__700 → Playfair Display 700', () => {
    expect(mapExtractedFont(null, ['font__playfair-display__700'])).toEqual({
      family: 'Playfair Display',
      weight: 700,
    });
  });
});

// ─── TC-AI-049-05: AC6 — edge-case: empty / fully-unparseable alternatives ───

describe('mapExtractedFont — AC6: empty or unparseable alternatives (TC-AI-049-05)', () => {
  it('empty font_alternatives array → Inter 400 without throwing', () => {
    expect(() => mapExtractedFont('IMFeFCrm28P.ttf', [])).not.toThrow();
    expect(mapExtractedFont('IMFeFCrm28P.ttf', [])).toEqual({ family: 'Inter', weight: 400 });
  });

  it('font_alternatives with only unparseable entries → Inter 400 without throwing', () => {
    expect(() =>
      mapExtractedFont('IMFeFCrm28P.ttf', ['not-a-slug', 'also-not-a-slug', 'random'])
    ).not.toThrow();
    expect(mapExtractedFont('IMFeFCrm28P.ttf', ['not-a-slug', 'also-not-a-slug', 'random'])).toEqual({
      family: 'Inter',
      weight: 400,
    });
  });

  it('font_alternatives with empty-string entries → Inter 400 without throwing', () => {
    expect(() => mapExtractedFont('IMFeFCrm28P.ttf', ['', '', ''])).not.toThrow();
    expect(mapExtractedFont('IMFeFCrm28P.ttf', ['', '', ''])).toEqual({ family: 'Inter', weight: 400 });
  });

  it('font_alternatives with wrong prefix pattern → Inter 400', () => {
    // "font-montserrat-700" (hyphens instead of double underscores) must NOT parse.
    expect(mapExtractedFont('IMFeFCrm28P.ttf', ['font-montserrat-700'])).toEqual({
      family: 'Inter',
      weight: 400,
    });
  });

  it('font_alternatives: slug with uppercase → fails pattern, falls to Inter 400', () => {
    // Pattern requires lowercase slug: "font__Montserrat__700" must NOT parse.
    expect(mapExtractedFont('IMFeFCrm28P.ttf', ['font__Montserrat__700'])).toEqual({
      family: 'Inter',
      weight: 400,
    });
  });

  it('returns a fresh object each time (no shared mutable reference)', () => {
    const a = mapExtractedFont(null);
    const b = mapExtractedFont(null);
    a.family = 'mutated';
    expect(b.family).toBe('Inter'); // b must not be affected
  });
});
