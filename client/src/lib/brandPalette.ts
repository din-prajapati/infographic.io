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
