/**
 * fontMap.ts — font identifier → CSS resolution (US-AI-049)
 *
 * Ideogram's layerize-text endpoint returns provider font identifiers like
 * "Montserrat-Bold.ttf" and opaque hashes like "IMFeFCrm28P.ttf".
 * The browser cannot resolve these as CSS font-family values, so every
 * element silently fell back to Inter, causing different text metrics and
 * incorrect wrapping (observed live 2026-08-13: price rendered as
 * "₹1.9 / Cr" on two lines).
 *
 * Resolution order in mapExtractedFont:
 *  1. Parse primary fontName via weight-suffix detection
 *  2. If unrecognisable, try each entry in font_alternatives
 *     (Google Fonts slug pattern: font__{family}__{weight})
 *  3. Final fallback: Inter 400
 *
 * Never throws. Always returns a ResolvedFont.
 */

export interface ResolvedFont {
  family: string;
  weight: number;
}

/** Canonical fallback — browser will always find Inter (loaded in index.html). */
const FALLBACK: ResolvedFont = { family: 'Inter', weight: 400 };

/**
 * Provider weight-suffix → numeric CSS font-weight.
 * Ordered longest-first so "ExtraBold" is matched before "Bold",
 * "ExtraLight" before "Light", "SemiBold" before "Bold".
 */
const SUFFIX_WEIGHT: Array<[suffix: string, weight: number]> = [
  ['ExtraBold',  800],
  ['ExtraLight', 200],
  ['SemiBold',   600],
  ['Regular',    400],
  ['Medium',     500],
  ['Black',      900],
  ['Light',      300],
  ['Thin',       100],
  ['Bold',       700],
];

/**
 * Parse a provider font filename such as "Montserrat-Bold.ttf".
 *
 * Returns null when the name is not recognisable — specifically when:
 *  - it has a suffix we don't recognise, AND
 *  - without a suffix, the base name contains digits or other non-letter,
 *    non-hyphen characters that indicate an opaque hash (e.g. "IMFeFCrm28P").
 */
function parseProviderFilename(raw: string): ResolvedFont | null {
  // Strip the file extension (e.g. ".ttf", ".otf", ".woff2").
  const base = raw.replace(/\.[A-Za-z0-9]+$/, '');

  // Try each weight suffix (already ordered longest-first).
  for (const [suffix, weight] of SUFFIX_WEIGHT) {
    if (base.endsWith(`-${suffix}`)) {
      const familyRaw = base.slice(0, base.length - suffix.length - 1);
      // Hyphens in the family portion separate words (e.g. "Playfair-Display").
      const family = familyRaw.replace(/-/g, ' ');
      return { family, weight };
    }
  }

  // No recognised weight suffix.  Treat as Regular ONLY when the base name
  // looks like a real font family — letters and hyphens only (no digits).
  // "IMFeFCrm28P" fails this check because of the "28"; real font names
  // like "Montserrat" or "Playfair-Display" pass.
  if (/^[A-Za-z][A-Za-z-]*$/.test(base) && base.length >= 3) {
    return { family: base.replace(/-/g, ' '), weight: 400 };
  }

  return null;
}

/**
 * Parse a Google Fonts slug such as "font__playfair-display__700".
 *
 * Pattern: `font__{kebab-family}__{numeric-weight}`
 * Returns null for any entry that does not match this pattern exactly.
 */
function parseGoogleFontSlug(slug: string): ResolvedFont | null {
  const match = /^font__([a-z][a-z0-9-]*)__(\d+)$/.exec(slug);
  if (!match) return null;

  const familySlug = match[1]; // e.g. "playfair-display"
  const weight = parseInt(match[2], 10);

  if (isNaN(weight)) return null;

  // Convert kebab-case to Title Case — "playfair-display" → "Playfair Display".
  const family = familySlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return { family, weight };
}

/**
 * Map an extracted font identifier to a CSS-resolvable { family, weight }.
 *
 * @param fontName   Provider font identifier, e.g. "Montserrat-Bold.ttf".
 *                   May be null/undefined when the extraction returned no font info.
 * @param alternatives  Optional array of Google Fonts slugs from font_alternatives,
 *                      e.g. ["font__playfair-display__700"]. Consumed when fontName
 *                      is unrecognisable. Ignored if empty or absent.
 *
 * @returns Always a valid { family, weight } — never throws.
 */
export function mapExtractedFont(
  fontName: string | null | undefined,
  alternatives?: string[],
): ResolvedFont {
  // 1. Try the primary provider identifier.
  if (fontName) {
    const primary = parseProviderFilename(fontName);
    if (primary) return primary;
  }

  // 2. Fall back through font_alternatives, taking the first parseable entry.
  if (alternatives && alternatives.length > 0) {
    for (const alt of alternatives) {
      const altParsed = parseGoogleFontSlug(alt);
      if (altParsed) return altParsed;
    }
  }

  // 3. Final fallback.
  return { ...FALLBACK };
}
