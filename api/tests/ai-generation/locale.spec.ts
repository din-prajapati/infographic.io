/**
 * US-GEN-003 — locale-aware output formatting.
 * TC-GEN-003-01 … -09
 *
 * The defect these pin: the builder hardcoded "$", so ₹85,00,000 was advertised as
 * "$8.5M" — wrong symbol and, to a dollar reader, an ~85x overstatement burned into
 * the image. The exact-text verify layer then certified it as correct.
 *
 * Run:
 *   cd api && npx vitest run tests/ai-generation/locale.spec.ts --reporter=verbose
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import {
  resolveLocale,
  extractCurrencyToken,
  localeFromCurrencyToken,
  localeFromTimezone,
  groupDigitsIndian,
  formatPriceForLocale,
  formatAreaForLocale,
  formatRoomsForLocale,
  LOCALES,
} from '../../../shared/locale';
import { buildImagePrompt } from '../../src/modules/ai-generation/services/infographic-prompt.builder';

// ---------------------------------------------------------------------------
// AC2 — en-IN formatting (TC-GEN-003-01, -02)
// ---------------------------------------------------------------------------
describe('en-IN formatting — AC2', () => {
  it('renders 85,00,000 as ₹85 Lakh, never $8.5M (TC-GEN-003-01)', () => {
    const out = formatPriceForLocale(8_500_000, 'en-IN');
    expect(out).toBe('₹85 Lakh');
    expect(out).not.toContain('$');
    expect(out).not.toContain('8.5M');
  });

  it('renders 1,20,00,000 as ₹1.2 Cr (TC-GEN-003-02)', () => {
    expect(formatPriceForLocale(12_000_000, 'en-IN')).toBe('₹1.2 Cr');
    expect(formatPriceForLocale(10_000_000, 'en-IN')).toBe('₹1 Cr');
  });

  it('uses Indian 2-2-3 digit grouping below the lakh threshold', () => {
    expect(groupDigitsIndian(8_500_000)).toBe('85,00,000');
    expect(groupDigitsIndian(1_20_000)).toBe('1,20,000');
    expect(groupDigitsIndian(999)).toBe('999');
    expect(formatPriceForLocale(50_000, 'en-IN')).toBe('₹50,000');
  });

  it('uses BHK for rooms, keeping the bath count alongside', () => {
    expect(formatRoomsForLocale(3, 2, 'en-IN')).toBe('3 BHK | 2 BATH');
    expect(formatRoomsForLocale(3, undefined, 'en-IN')).toBe('3 BHK');
  });

  it('keeps SQ FT for India, which does not use m²', () => {
    expect(formatAreaForLocale(1850, 'en-IN')).toBe('1,850 SQ FT');
  });

  it('produces a full en-IN prompt with no dollar sign anywhere', () => {
    const prompt = buildImagePrompt(
      {
        locale: 'en-IN',
        address: 'Powai, Mumbai',
        price: 8_500_000,
        beds: 3,
        baths: 2,
        sqft: 1450,
      },
      'Spacious Lake View Home',
    );
    expect(prompt).toContain('- Price: ₹85 Lakh');
    expect(prompt).toContain('3 BHK | 2 BATH');
    expect(prompt).not.toContain('$');
  });
});

// ---------------------------------------------------------------------------
// AC3 — en-US unchanged
// ---------------------------------------------------------------------------
describe('en-US formatting — AC3 regression', () => {
  it('is unchanged from the pre-story behaviour', () => {
    expect(formatPriceForLocale(520_000, 'en-US')).toBe('$520K');
    expect(formatPriceForLocale(1_500_000, 'en-US')).toBe('$1.5M');
    expect(formatPriceForLocale(500, 'en-US')).toBe('$500');
    expect(formatAreaForLocale(1850, 'en-US')).toBe('1,850 SQ FT');
    expect(formatRoomsForLocale(3, 2, 'en-US')).toBe('3 BED | 2 BATH');
  });
});

// ---------------------------------------------------------------------------
// AC4 — passthrough: never invent a currency (TC-GEN-003-04, -05)
// ---------------------------------------------------------------------------
describe('passthrough — AC4', () => {
  it('echoes an unsupported currency the user typed (TC-GEN-003-04)', () => {
    expect(formatPriceForLocale(1_200_000, null, 'AED')).toBe('AED 1.2M');
    expect(formatPriceForLocale(320_000, null, '£')).toBe('£320K');
    expect(formatPriceForLocale(450_000, null, '€')).toBe('€450K');
  });

  it('prints no symbol at all when none was typed (TC-GEN-003-05)', () => {
    const out = formatPriceForLocale(520_000, null);
    expect(out).toBe('520K');
    expect(out).not.toContain('$');
  });

  it('never substitutes $ for an unresolved currency — the core defect', () => {
    for (const value of [500, 50_000, 520_000, 8_500_000, 12_000_000]) {
      expect(formatPriceForLocale(value, null)).not.toContain('$');
    }
  });

  it('an unsupported market still generates a complete prompt (TC-GEN-003-12 unit half)', () => {
    const prompt = buildImagePrompt(
      { address: 'Dubai Marina', price: 1_200_000, beds: 2, baths: 2, currencyToken: 'AED' },
      'Marina View Apartment',
    );
    expect(prompt).toContain('- Price: AED 1.2M');
    expect(prompt).toContain('- Headline: "Marina View Apartment"');
    expect(prompt).not.toContain('$');
  });
});

// ---------------------------------------------------------------------------
// AC5 — degrade, never block (TC-GEN-003-06, -07)
// ---------------------------------------------------------------------------
describe('graceful degradation — AC5', () => {
  it('an unknown locale id falls back rather than throwing (TC-GEN-003-06)', () => {
    const prompt = buildImagePrompt(
      { locale: 'xx-XX', address: '1 Test Rd', price: 520_000, beds: 3, baths: 2 },
      'Test Home',
    );
    expect(prompt).toContain('- Price: 520K');
    expect(prompt).toContain('3 BED | 2 BATH');
  });

  it('falls back per facet, not all-or-nothing (TC-GEN-003-07)', () => {
    // Price still localises even though this locale has no special area unit.
    expect(formatPriceForLocale(8_500_000, 'en-IN')).toBe('₹85 Lakh');
    expect(formatAreaForLocale(1850, null)).toBe('1,850 SQ FT');
    expect(formatRoomsForLocale(3, 2, null)).toBe('3 BED | 2 BATH');
  });

  it('handles absent, zero and unparseable values without throwing', () => {
    expect(formatPriceForLocale(undefined, 'en-IN')).toBe('');
    expect(formatPriceForLocale(0, 'en-IN')).toBe('');
    expect(formatPriceForLocale(NaN, 'en-IN')).toBe('');
    expect(formatAreaForLocale(null, 'en-IN')).toBe('');
    expect(formatRoomsForLocale(undefined, undefined, 'en-IN')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// AC1 — resolution order (TC-GEN-003-08)
// ---------------------------------------------------------------------------
describe('resolveLocale — AC1', () => {
  it('property override beats a typed symbol', () => {
    const r = resolveLocale({ override: 'en-US', rawPriceText: '₹85,00,000' });
    expect(r.id).toBe('en-US');
    expect(r.source).toBe('override');
  });

  it('typed symbol beats the org default (TC-GEN-003-08)', () => {
    const r = resolveLocale({ rawPriceText: '₹85,00,000', orgDefault: 'en-US' });
    expect(r.id).toBe('en-IN');
    expect(r.source).toBe('typed-symbol');
  });

  it('org default beats timezone', () => {
    const r = resolveLocale({ orgDefault: 'en-US', timezone: 'Asia/Kolkata' });
    expect(r.id).toBe('en-US');
    expect(r.source).toBe('org-default');
  });

  it('timezone is the last resort before passthrough', () => {
    expect(resolveLocale({ timezone: 'Asia/Kolkata' }).id).toBe('en-IN');
    expect(resolveLocale({ timezone: 'America/New_York' }).id).toBe('en-US');
  });

  it('falls through to passthrough while preserving the typed token', () => {
    const r = resolveLocale({ rawPriceText: 'AED 1,200,000', timezone: 'Asia/Dubai' });
    expect(r.id).toBeNull();
    expect(r.source).toBe('none');
    expect(r.currencyToken).toBe('AED');
  });

  it('ignores an unknown override rather than trusting it', () => {
    expect(resolveLocale({ override: 'xx-XX', timezone: 'Asia/Kolkata' }).id).toBe('en-IN');
  });
});

describe('extractCurrencyToken', () => {
  it('reads common symbols', () => {
    expect(extractCurrencyToken('₹85,00,000')).toBe('₹');
    expect(extractCurrencyToken('$450,000')).toBe('$');
    expect(extractCurrencyToken('£320,000')).toBe('£');
  });

  it('reads alphabetic codes and Rs.', () => {
    expect(extractCurrencyToken('AED 1,200,000')).toBe('AED');
    expect(extractCurrencyToken('Rs. 85,00,000')).toBe('Rs.');
  });

  it('does not mistake magnitude words for currencies', () => {
    expect(extractCurrencyToken('450k')).toBeNull();
    expect(extractCurrencyToken('85 lakh')).toBeNull();
  });

  it('returns null for bare digits and empty input', () => {
    expect(extractCurrencyToken('450000')).toBeNull();
    expect(extractCurrencyToken('')).toBeNull();
    expect(extractCurrencyToken(undefined)).toBeNull();
  });

  it('maps only tokens we have a table entry for', () => {
    expect(localeFromCurrencyToken('₹')).toBe('en-IN');
    expect(localeFromCurrencyToken('AED')).toBeNull();
    expect(localeFromTimezone('Europe/Paris')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// AC8 — locale must never read billing (TC-GEN-003-09)
// ---------------------------------------------------------------------------
describe('locale/billing separation — AC8', () => {
  // Scoped to the OUTPUT-FORMATTING path, not the whole ai-generation module.
  //
  // AC8 was drafted as "no module under ai-generation/ reads planTier" and that was
  // simply wrong: ai-orchestrator legitimately reads planTier to pick the text model
  // (Gemini on some tiers, GPT-4o otherwise), and openai.service takes it as a
  // parameter. That is plan-based feature gating and has nothing to do with locale.
  // The invariant worth protecting is narrower — billing must never reach the strings
  // printed on the image.
  const FORMATTING_PATH = [
    path.resolve(__dirname, '../../../shared/locale.ts'),
    path.resolve(
      __dirname,
      '../../src/modules/ai-generation/services/infographic-prompt.builder.ts',
    ),
  ];

  it('the formatting path reads no payment or plan field', () => {
    const offenders: string[] = [];
    for (const file of FORMATTING_PATH) {
      const src = readFileSync(file, 'utf-8');
      // Strip comments — D2 is *explained* in prose in both files.
      const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      if (/\b(razorpay|stripe|planTier|subscriptionId|monthlyLimit)\b/i.test(code)) {
        offenders.push(path.basename(file));
      }
    }
    expect(offenders, `billing leaked into output formatting: ${offenders.join(', ')}`)
      .toEqual([]);
  });

  it('formatting depends only on the locale argument, never on ambient state', () => {
    // Same inputs, same output, regardless of any billing context that may exist.
    expect(formatPriceForLocale(8_500_000, 'en-IN')).toBe('₹85 Lakh');
    expect(formatPriceForLocale(8_500_000, 'en-US')).toBe('$8.5M');
    expect(Object.keys(LOCALES).sort()).toEqual(['en-IN', 'en-US']);
  });
});
