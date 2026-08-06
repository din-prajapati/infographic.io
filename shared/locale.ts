/**
 * Locale conventions for generated infographic output — US-GEN-003.
 *
 * SCOPE: this localises *what gets printed on the image*. It is not app i18n.
 *
 * Lives in `shared/` because both sides need it for different reasons: the client
 * resolves the locale (it holds the raw string the user typed) and renders the
 * indicator; the server formats the prompt strings. One table, no drift.
 *
 * DESIGN RULE — never invent a currency. The pre-US-GEN-003 builder hardcoded `$`,
 * so an agent entering ₹85,00,000 advertised their flat as "$8.5M". The fix is not a
 * better default: when we cannot resolve a locale we echo the symbol the user typed,
 * and when they typed none we print no symbol at all. An unknown market must degrade,
 * never block and never guess (STORY.md D1/D4).
 *
 * DESIGN RULE — locale never reads billing. A Dubai agent pays ₹2,999 through the
 * single INR gateway, so billing currency would confidently report the wrong market.
 * Nothing here may import a payment field (STORY.md D2, enforced by a guard test).
 */

export type LocaleId = 'en-US' | 'en-IN';

export interface Abbreviation {
  /** Apply when the value is >= this. */
  threshold: number;
  suffix: string;
}

export interface LocaleConventions {
  currencySymbol: string;
  symbolPosition: 'before' | 'after';
  /** Largest threshold first — the first match wins. */
  abbreviations: Abbreviation[];
  digitGrouping: 'western' | 'indian';
  areaUnit: string;
  /** Rendered room description, e.g. "3 BHK | 2 BATH". */
  formatRooms: (beds?: number, baths?: number) => string;
}

const westernRooms = (beds?: number, baths?: number): string => {
  const parts: string[] = [];
  if (beds) parts.push(`${beds} BED`);
  if (baths) parts.push(`${baths} BATH`);
  return parts.join(' | ');
};

/**
 * India leads with BHK (bedroom-hall-kitchen); the bath count is conventionally
 * carried alongside it rather than replaced by it.
 */
const indianRooms = (beds?: number, baths?: number): string => {
  const parts: string[] = [];
  if (beds) parts.push(`${beds} BHK`);
  if (baths) parts.push(`${baths} BATH`);
  return parts.join(' | ');
};

export const LOCALES: Record<LocaleId, LocaleConventions> = {
  'en-US': {
    currencySymbol: '$',
    symbolPosition: 'before',
    abbreviations: [
      { threshold: 1_000_000, suffix: 'M' },
      { threshold: 1_000, suffix: 'K' },
    ],
    digitGrouping: 'western',
    areaUnit: 'SQ FT',
    formatRooms: westernRooms,
  },
  'en-IN': {
    currencySymbol: '₹',
    symbolPosition: 'before',
    // 1 crore = 10^7, 1 lakh = 10^5 — not a scaled variant of K/M.
    abbreviations: [
      { threshold: 10_000_000, suffix: 'Cr' },
      { threshold: 100_000, suffix: 'Lakh' },
    ],
    digitGrouping: 'indian',
    areaUnit: 'SQ FT',
    formatRooms: indianRooms,
  },
};

/** Symbols distinctive enough to identify a market on their own. */
const SYMBOL_TO_LOCALE: Array<{ symbol: string; locale: LocaleId }> = [
  { symbol: '₹', locale: 'en-IN' },
  { symbol: 'Rs.', locale: 'en-IN' },
  { symbol: 'Rs', locale: 'en-IN' },
  { symbol: 'INR', locale: 'en-IN' },
  { symbol: '$', locale: 'en-US' },
  { symbol: 'USD', locale: 'en-US' },
];

/**
 * The currency token the user actually typed, e.g. "₹" or "AED".
 *
 * Returned even when we have no locale entry for it — an unrecognised token is
 * still the correct thing to print back (passthrough, AC4).
 */
export function extractCurrencyToken(raw?: string | null): string | null {
  if (!raw) return null;
  const text = String(raw).trim();
  if (!text) return null;

  const symbolMatch = text.match(/[₹$£€¥]/);
  if (symbolMatch) return symbolMatch[0];

  // Alphabetic codes/prefixes: "AED 1,200,000", "Rs. 85,00,000", "1200000 SAR"
  const codeMatch = text.match(/\b([A-Za-z]{2,4})\.?\b/);
  if (codeMatch) {
    const token = codeMatch[1];
    // Reject magnitude words that are not currencies.
    if (/^(k|m|cr|lakh|lac|bn)$/i.test(token)) return null;
    return /^rs$/i.test(token) ? 'Rs.' : token.toUpperCase();
  }
  return null;
}

/** Map a typed currency token to a known locale, or null if we have no table entry. */
export function localeFromCurrencyToken(token?: string | null): LocaleId | null {
  if (!token) return null;
  const t = token.trim();
  const hit = SYMBOL_TO_LOCALE.find(
    (e) => e.symbol.toLowerCase() === t.toLowerCase(),
  );
  return hit ? hit.locale : null;
}

/** Coarse timezone → locale, used only to seed an org default at first touch. */
export function localeFromTimezone(tz?: string | null): LocaleId | null {
  if (!tz) return null;
  if (/^Asia\/(Kolkata|Calcutta)$/i.test(tz)) return 'en-IN';
  if (/^America\//i.test(tz)) return 'en-US';
  return null;
}

export interface LocaleResolutionInput {
  /** Explicit per-property override — always wins (STORY.md D3). */
  override?: string | null;
  /** Raw text the user typed that may carry a symbol (price field or chat message). */
  rawPriceText?: string | null;
  orgDefault?: string | null;
  timezone?: string | null;
}

export interface ResolvedLocale {
  /** Null means passthrough: format with no locale assumptions. */
  id: LocaleId | null;
  /** The token the user typed, preserved for passthrough rendering. */
  currencyToken: string | null;
  source: 'override' | 'typed-symbol' | 'org-default' | 'timezone' | 'none';
}

function asLocaleId(value?: string | null): LocaleId | null {
  return value && value in LOCALES ? (value as LocaleId) : null;
}

/**
 * Resolve the locale for one generation. First match wins.
 *
 * Runs client-side: the currency symbol only exists in the raw string the user typed,
 * and the server's extraction contract types `price` as a bare number, so the symbol
 * is gone before the prompt builder ever runs (STORY.md Harden findings).
 */
export function resolveLocale(input: LocaleResolutionInput): ResolvedLocale {
  const currencyToken = extractCurrencyToken(input.rawPriceText);

  const override = asLocaleId(input.override);
  if (override) return { id: override, currencyToken, source: 'override' };

  const typed = localeFromCurrencyToken(currencyToken);
  if (typed) return { id: typed, currencyToken, source: 'typed-symbol' };

  const org = asLocaleId(input.orgDefault);
  if (org) return { id: org, currencyToken, source: 'org-default' };

  const tz = localeFromTimezone(input.timezone);
  if (tz) return { id: tz, currencyToken, source: 'timezone' };

  return { id: null, currencyToken, source: 'none' };
}

/** Indian 2-2-3 digit grouping: 8500000 → "85,00,000". */
export function groupDigitsIndian(value: number): string {
  const [whole, frac] = String(value).split('.');
  if (whole.length <= 3) return frac ? `${whole}.${frac}` : whole;
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const out = `${grouped},${last3}`;
  return frac ? `${out}.${frac}` : out;
}

export function groupDigits(value: number, grouping: 'western' | 'indian'): string {
  return grouping === 'indian'
    ? groupDigitsIndian(value)
    : value.toLocaleString('en-US');
}

/** Trim a trailing ".0" so 8.0 renders as "8". */
function trimDecimal(n: number): string {
  return n % 1 === 0 ? String(n) : String(Number(n.toFixed(1)));
}

function applySymbol(amount: string, symbol: string, position: 'before' | 'after'): string {
  if (!symbol) return amount;
  return position === 'after' ? `${amount} ${symbol}` : `${symbol}${amount}`;
}

/**
 * Format a price for the image.
 *
 * Abbreviated on purpose — the pipeline's existing note records that "$500K" renders
 * more reliably than "$500,000" in image models. That reasoning is unit-agnostic, so
 * unresolved locales keep abbreviating with the widely-read K/M while preserving the
 * user's own symbol.
 */
export function formatPriceForLocale(
  price: number | undefined | null,
  locale: LocaleId | null,
  fallbackCurrencyToken?: string | null,
): string {
  if (price === undefined || price === null || isNaN(price) || price === 0) return '';

  const conventions = locale ? LOCALES[locale] : undefined;
  const abbreviations = conventions?.abbreviations ?? [
    { threshold: 1_000_000, suffix: 'M' },
    { threshold: 1_000, suffix: 'K' },
  ];

  let amount: string | null = null;
  for (const abbr of abbreviations) {
    if (price >= abbr.threshold) {
      const scaled = price / abbr.threshold;
      // Word-like suffixes take a space ("85 Lakh", "1.2 Cr"); single-letter
      // magnitudes do not ("8.5M", "520K").
      const separator = abbr.suffix.length > 1 ? ' ' : '';
      amount = `${trimDecimal(scaled)}${separator}${abbr.suffix}`;
      break;
    }
  }
  if (amount === null) {
    amount = groupDigits(price, conventions?.digitGrouping ?? 'western');
  }

  if (conventions) {
    return applySymbol(amount, conventions.currencySymbol, conventions.symbolPosition);
  }

  // Passthrough: echo what they typed, or print no symbol at all. Never invent one.
  if (!fallbackCurrencyToken) return amount;
  return /^[A-Za-z]/.test(fallbackCurrencyToken)
    ? `${fallbackCurrencyToken} ${amount}`
    : `${fallbackCurrencyToken}${amount}`;
}

/** Area with the locale's unit; unresolved locales keep the historical SQ FT. */
export function formatAreaForLocale(
  area: number | undefined | null,
  locale: LocaleId | null,
): string {
  if (area === undefined || area === null || isNaN(area) || area === 0) return '';
  const conventions = locale ? LOCALES[locale] : undefined;
  const unit = conventions?.areaUnit ?? 'SQ FT';
  const grouped = groupDigits(area, conventions?.digitGrouping ?? 'western');
  return `${grouped} ${unit}`;
}

/** Room description per locale; unresolved locales keep BED | BATH. */
export function formatRoomsForLocale(
  beds: number | undefined,
  baths: number | undefined,
  locale: LocaleId | null,
): string {
  const conventions = locale ? LOCALES[locale] : undefined;
  return (conventions?.formatRooms ?? westernRooms)(beds, baths);
}
