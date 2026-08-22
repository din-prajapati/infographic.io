import { describe, it, expect } from 'vitest';
import { PLAN_CONFIG, ANNUAL_MULTIPLIER, getAnnualPrice } from '@shared/schema';

// US-PAY-107 — standing annual-discount formula (×10, 2 months free)
//
// NOTE on units: this story's own AC1/AC4 text (and TC-PAY-107-01) originally said prices are
// paise ("SOLO: 549900 × 10 = 5499000 paise = ₹54,990") — wrong. Every PLAN_CONFIG tier stores
// integer rupees (SOLO: 5499, TEAM: 21999 — see US-PAY-102's Implementation Update log for how
// this was caught, and its 2026-08-23 re-open note for why SOLO/TEAM's own numbers changed from
// their original 2999/6999 beta values). getAnnualPrice() is unit-agnostic (just multiplies by
// 10); the tests below use the real, correct rupee values.

describe('getAnnualPrice — standing ×10 annual formula (US-PAY-107)', () => {
  it('AC1 / TC-PAY-107-01: SOLO annual price is exactly monthly × 10 (rupees, not paise)', () => {
    expect(PLAN_CONFIG.SOLO.price).toBe(5499);
    expect(getAnnualPrice(PLAN_CONFIG.SOLO.price)).toBe(54990);
  });

  it('AC1: replaces the old ×12×0.85 formula — the two disagree, proving this is a real fix', () => {
    const monthly = PLAN_CONFIG.TEAM.price;
    const oldFormula = Math.round(monthly * 12 * 0.85);
    expect(getAnnualPrice(monthly)).not.toBe(oldFormula);
    expect(getAnnualPrice(monthly)).toBe(monthly * 10);
  });

  it('AC2 / TC-PAY-107-02: every paid PLAN_CONFIG tier gets the ×10 default, no tier left unpriced', () => {
    const paidTiers = ['SOLO', 'PRO', 'TEAM', 'AGENCY', 'BROKERAGE', 'API_STARTER', 'API_GROWTH'] as const;
    for (const tier of paidTiers) {
      const monthly = PLAN_CONFIG[tier].price;
      expect(getAnnualPrice(monthly)).toBe(monthly * ANNUAL_MULTIPLIER);
    }
  });

  it('AC4 / TC-PAY-107-01: multiplication is always an exact integer, never rounds', () => {
    for (const config of Object.values(PLAN_CONFIG)) {
      const annual = getAnnualPrice(config.price);
      expect(Number.isInteger(annual)).toBe(true);
      expect(annual).toBe(config.price * 10);
    }
  });
});
