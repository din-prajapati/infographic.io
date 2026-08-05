/**
 * Brand palette guards — pure, dependency-free so they are unit-testable in a
 * Node environment (RightSidebar.tsx itself pulls in React, Zustand and motion).
 */

/** Structural shape of anything palette-like; keeps this module free of component imports. */
export interface PaletteLike {
  colors?: string[] | null;
}

/**
 * A palette is only "active" if it can actually colour anything.
 *
 * Custom palettes are read back from the `custom-brand-palettes` localStorage key,
 * so a hand-edited or half-written entry can arrive with `colors` missing, null, or
 * empty. Collapsing that to null — rather than letting `colors[0]` come back
 * undefined — is what makes the brand indicator, Quick Styles, and Generate all
 * degrade the same way: as if no brand were selected.
 *
 * Generic so callers keep their concrete palette type (e.g. `BrandPalette.name`).
 */
export function resolveActivePalette<T extends PaletteLike>(
  palette: T | null | undefined,
): T | null {
  if (!palette || !Array.isArray(palette.colors) || palette.colors.length === 0) return null;
  return palette;
}

/** Matches the canvas store's initial `backgroundColor` (useCanvasStore.ts). */
export const DEFAULT_CANVAS_BACKGROUND = "#FFFFFF";

function parseHex(input: string): { r: number; g: number; b: number } | null {
  const m = input.trim().match(/^#([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** WCAG relative luminance. */
export function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const lin = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

/** The lightest parseable swatch in a palette, whatever its luminance. */
export function pickLightestSwatch(
  palette: string[],
): { color: string; luminance: number } | null {
  let best: string | null = null;
  let bestLum = -1;
  for (const c of palette) {
    const rgb = parseHex(c);
    if (!rgb) continue;
    const lum = relativeLuminance(rgb);
    if (lum > bestLum) {
      bestLum = lum;
      best = c;
    }
  }
  return best === null ? null : { color: best, luminance: bestLum };
}

/**
 * Canvas background for a palette — the lightest swatch, not the last one.
 *
 * The previous rule was `colors[colors.length - 1]`, on the assumption that palettes
 * are ordered dark→light. Five of the six built-ins do end in #FFFFFF, but Luxury Gold
 * ends in #8B7355 (warm brown), so selecting it painted the canvas mud while every
 * sibling palette produced white. Custom palettes carry no ordering contract at all,
 * so the background is derived rather than assumed.
 */
export function pickCanvasBackground(palette: string[]): string {
  return pickLightestSwatch(palette)?.color ?? DEFAULT_CANVAS_BACKGROUND;
}
