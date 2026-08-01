/**
 * formatPreviews — miniature layout wireframes for each entry in FORMAT_TAXONOMY.
 *
 * These deliberately mirror the visual language of the premium template
 * thumbnails rendered on the Templates gallery: flat `<rect>` primitives, no
 * photography, no gradients beyond a single scrim, drawn from one shared
 * palette. The goal is that a tile reads as "a real estate layout in this
 * shape" at a glance — not a generic icon.
 *
 * Each preview keeps its format's true aspect ratio via its viewBox, so the
 * silhouette itself still communicates shape (portrait / square / landscape)
 * exactly as the previous ShapePreview did — we are adding content, not
 * removing the shape cue.
 *
 * Compliance: no pixel dimensions, aspect-ratio text, or DPI values are ever
 * rendered here — the artwork is purely visual (see US-AI-038 AC8).
 */

import { CUSTOM_FORMAT_ID } from './formatTaxonomy';

// ---------------------------------------------------------------------------
// Shared palette — matches the seeded premium-template thumbnails
// ---------------------------------------------------------------------------

const C = {
  ink: '#0f172a',       // slate-900 — dark grounds, headline bars
  hero: '#1e3a8a',      // blue-900  — hero/image blocks
  heroAlt: '#3b82f6',   // blue-500  — secondary image blocks
  heroSoft: '#93c5fd',  // blue-300  — tertiary image blocks
  amber: '#fde68a',     // amber-200 — price chip / highlight
  cyan: '#0ca0eb',      // CTA bar
  muted: '#475569',     // slate-600 — body copy lines
  paper: '#ffffff',
  green: '#14532d',     // print header band
} as const;

/** Faint scrim used under text on full-bleed hero layouts. */
function Scrim({ id, y, w, h }: { id: string; y: number; w: number; h: number }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.ink} stopOpacity="0" />
          <stop offset="1" stopColor={C.ink} />
        </linearGradient>
      </defs>
      <rect x="0" y={y} width={w} height={h} fill={`url(#${id})`} opacity="0.75" />
    </>
  );
}

// ---------------------------------------------------------------------------
// Per-format artwork. Keys are FORMAT_TAXONOMY ids.
// ---------------------------------------------------------------------------

type Art = { viewBox: string; body: React.ReactNode };

const ART: Record<string, Art> = {
  // ---- Instagram -----------------------------------------------------------
  'instagram-post': {
    viewBox: '0 0 120 120',
    body: (
      <>
        <rect width="120" height="120" fill={C.paper} />
        <rect x="0" y="0" width="120" height="70" fill={C.hero} />
        <rect x="10" y="10" width="26" height="8" rx="4" fill={C.paper} opacity="0.25" />
        <rect x="10" y="80" width="72" height="9" rx="2" fill={C.ink} />
        <rect x="10" y="94" width="34" height="8" rx="2" fill={C.amber} />
        <rect x="10" y="108" width="58" height="4" rx="2" fill={C.muted} />
      </>
    ),
  },
  'instagram-story': {
    viewBox: '0 0 68 120',
    body: (
      <>
        <rect width="68" height="120" fill={C.ink} />
        <rect x="0" y="0" width="68" height="82" fill={C.hero} />
        <Scrim id="ig-story-scrim" y={52} w={68} h={38} />
        <rect x="7" y="8" width="20" height="6" rx="3" fill={C.paper} opacity="0.25" />
        <rect x="7" y="66" width="48" height="7" rx="2" fill={C.paper} />
        <rect x="7" y="78" width="26" height="7" rx="2" fill={C.amber} />
        <rect x="7" y="95" width="40" height="4" rx="2" fill={C.paper} opacity="0.55" />
        <rect x="7" y="104" width="34" height="8" rx="4" fill={C.cyan} />
      </>
    ),
  },
  'instagram-reel-cover': {
    viewBox: '0 0 68 120',
    body: (
      <>
        <rect width="68" height="120" fill={C.ink} />
        <rect x="0" y="0" width="68" height="120" fill={C.hero} />
        <Scrim id="ig-reel-scrim" y={60} w={68} h={60} />
        <rect x="12" y="72" width="44" height="10" rx="2" fill={C.paper} />
        <rect x="12" y="87" width="30" height="10" rx="2" fill={C.paper} />
        <rect x="12" y="105" width="24" height="6" rx="3" fill={C.amber} />
      </>
    ),
  },

  // ---- Facebook ------------------------------------------------------------
  'facebook-post': {
    viewBox: '0 0 120 120',
    body: (
      <>
        <rect width="120" height="120" fill={C.paper} />
        <rect x="0" y="0" width="120" height="26" fill={C.ink} />
        <rect x="9" y="9" width="30" height="8" rx="4" fill={C.paper} opacity="0.3" />
        <rect x="10" y="36" width="100" height="46" rx="3" fill={C.hero} />
        <rect x="10" y="90" width="66" height="8" rx="2" fill={C.ink} />
        <rect x="10" y="104" width="30" height="7" rx="2" fill={C.amber} />
        <rect x="46" y="104" width="30" height="7" rx="2" fill={C.heroSoft} />
      </>
    ),
  },
  'facebook-cover': {
    viewBox: '0 0 120 63',
    body: (
      <>
        <rect width="120" height="63" fill={C.ink} />
        <rect x="0" y="0" width="74" height="63" fill={C.hero} />
        <rect x="8" y="10" width="22" height="6" rx="3" fill={C.paper} opacity="0.25" />
        <rect x="8" y="26" width="52" height="8" rx="2" fill={C.paper} />
        <rect x="8" y="42" width="28" height="7" rx="2" fill={C.amber} />
        <rect x="84" y="18" width="28" height="28" rx="3" fill={C.heroAlt} />
      </>
    ),
  },
  'facebook-story': {
    viewBox: '0 0 68 120',
    body: (
      <>
        <rect width="68" height="120" fill={C.paper} />
        <rect x="0" y="0" width="68" height="74" fill={C.hero} />
        <rect x="7" y="9" width="20" height="6" rx="3" fill={C.paper} opacity="0.25" />
        <rect x="7" y="84" width="46" height="8" rx="2" fill={C.ink} />
        <rect x="7" y="97" width="24" height="7" rx="2" fill={C.amber} />
        <rect x="7" y="110" width="38" height="4" rx="2" fill={C.muted} />
      </>
    ),
  },

  // ---- Print ---------------------------------------------------------------
  'print-flyer': {
    viewBox: '0 0 120 90',
    body: (
      <>
        <rect width="120" height="90" fill={C.paper} />
        <rect x="0" y="0" width="120" height="16" fill={C.green} />
        <rect x="8" y="5" width="40" height="6" rx="2" fill={C.paper} />
        <rect x="98" y="4" width="16" height="8" rx="4" fill={C.amber} />
        <rect x="8" y="24" width="104" height="34" rx="3" fill={C.hero} />
        <rect x="8" y="64" width="56" height="7" rx="2" fill={C.ink} />
        <rect x="8" y="76" width="30" height="6" rx="2" fill={C.cyan} />
        <rect x="72" y="64" width="40" height="4" rx="2" fill={C.muted} />
        <rect x="72" y="72" width="34" height="4" rx="2" fill={C.muted} />
      </>
    ),
  },
  'print-postcard': {
    viewBox: '0 0 120 80',
    body: (
      <>
        <rect width="120" height="80" fill={C.paper} />
        <rect x="0" y="0" width="62" height="80" fill={C.hero} />
        <rect x="70" y="12" width="40" height="7" rx="2" fill={C.ink} />
        <rect x="70" y="25" width="26" height="8" rx="2" fill={C.amber} />
        <rect x="70" y="41" width="42" height="4" rx="2" fill={C.muted} />
        <rect x="70" y="50" width="36" height="4" rx="2" fill={C.muted} />
        <rect x="70" y="62" width="30" height="8" rx="4" fill={C.cyan} />
      </>
    ),
  },
  'print-open-house-sign': {
    viewBox: '0 0 80 120',
    body: (
      <>
        <rect width="80" height="120" fill={C.paper} />
        <rect x="0" y="0" width="80" height="26" fill={C.green} />
        <rect x="10" y="9" width="60" height="9" rx="2" fill={C.paper} />
        <rect x="8" y="36" width="64" height="40" rx="3" fill={C.hero} />
        <rect x="8" y="83" width="44" height="8" rx="2" fill={C.ink} />
        <rect x="8" y="96" width="28" height="8" rx="2" fill={C.amber} />
        <rect x="8" y="109" width="52" height="4" rx="2" fill={C.muted} />
      </>
    ),
  },

  // ---- Email ---------------------------------------------------------------
  'email-header-banner': {
    viewBox: '0 0 120 40',
    body: (
      <>
        <rect width="120" height="40" fill={C.ink} />
        <rect x="0" y="0" width="74" height="40" fill={C.hero} />
        <rect x="8" y="7" width="20" height="5" rx="2" fill={C.paper} opacity="0.3" />
        <rect x="8" y="17" width="52" height="7" rx="2" fill={C.paper} />
        <rect x="8" y="29" width="14" height="6" rx="2" fill={C.amber} />
        <rect x="26" y="29" width="14" height="6" rx="2" fill={C.paper} opacity="0.5" />
        <rect x="44" y="29" width="14" height="6" rx="2" fill={C.paper} opacity="0.5" />
        <rect x="86" y="14" width="26" height="12" rx="6" fill={C.cyan} />
      </>
    ),
  },

  // ---- Other ---------------------------------------------------------------
  'linkedin-post': {
    viewBox: '0 0 120 120',
    body: (
      <>
        <rect width="120" height="120" fill={C.paper} />
        <rect x="0" y="0" width="120" height="58" fill={C.ink} />
        <rect x="10" y="12" width="24" height="8" rx="4" fill={C.heroAlt} />
        <rect x="10" y="30" width="66" height="8" rx="2" fill={C.paper} />
        <rect x="10" y="68" width="30" height="22" rx="3" fill={C.hero} />
        <rect x="45" y="68" width="30" height="22" rx="3" fill={C.heroAlt} />
        <rect x="80" y="68" width="30" height="22" rx="3" fill={C.heroSoft} />
        <rect x="10" y="99" width="72" height="5" rx="2" fill={C.muted} />
        <rect x="10" y="108" width="52" height="5" rx="2" fill={C.muted} />
      </>
    ),
  },
};

/** Fallback artwork — a neutral document silhouette for unknown ids. */
const FALLBACK: Art = {
  viewBox: '0 0 120 120',
  body: (
    <>
      <rect width="120" height="120" fill={C.paper} />
      <rect x="14" y="14" width="92" height="52" rx="3" fill={C.hero} />
      <rect x="14" y="76" width="64" height="8" rx="2" fill={C.ink} />
      <rect x="14" y="92" width="44" height="6" rx="2" fill={C.muted} />
    </>
  ),
};

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export interface FormatPreviewProps {
  /** Format id from FORMAT_TAXONOMY, or CUSTOM_FORMAT_ID. */
  formatId: string;
  className?: string;
}

/**
 * Renders the miniature layout wireframe for a format.
 *
 * The SVG is `aria-hidden` — the tile's visible text label is the accessible
 * name, so the artwork must not be announced twice.
 */
export function FormatPreview({ formatId, className }: FormatPreviewProps) {
  if (formatId === CUSTOM_FORMAT_ID) return null;
  const art = ART[formatId] ?? FALLBACK;
  return (
    <svg
      viewBox={art.viewBox}
      className={className}
      role="presentation"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      {art.body}
    </svg>
  );
}

/** True when a format has bespoke artwork (vs. falling back to the generic doc). */
export function hasFormatArt(formatId: string): boolean {
  return formatId in ART;
}
