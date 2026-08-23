/**
 * PricingPage.tsx test-mode banner — US-PAY-104
 *
 * TC-PAY-104-01  AC2: PLAN_CONFIG.SOLO/TEAM price mutated → banner text tracks it,
 *                     zero code edits required.
 *
 * getTestModeBannerAmounts() is a pure function extracted from the JSX so this can be
 * tested without rendering the full page (auth/query/Razorpay mocking) — same pattern as
 * client/vitest.config.ts's documented choice for canvas helpers (US-DEPLOY-007 AC6).
 * Run with: cd client && npx vitest run src/pages/__tests__/PricingPage.spec.tsx
 */

import { describe, it, expect } from 'vitest';
import { getTestModeBannerAmounts, computePricingCardDisplay, buildComparisonRows } from '@/pages/PricingPage';
import { PLAN_CONFIG } from '@shared/schema';
import type { EffectivePriceResult } from '@/lib/api';

// ─── TC-PAY-104-01: AC2 — banner text derives from PLAN_CONFIG, tracks mutation ──────

describe('getTestModeBannerAmounts — AC2 (TC-PAY-104-01)', () => {
  it('reflects the real PLAN_CONFIG SOLO/TEAM prices by default', () => {
    expect(getTestModeBannerAmounts()).toEqual({
      solo: PLAN_CONFIG.SOLO.price.toLocaleString(),
      team: PLAN_CONFIG.TEAM.price.toLocaleString(),
    });
  });

  it('updates when a PLAN_CONFIG price value changes — no code edit needed', () => {
    const mutatedConfig = {
      SOLO: { ...PLAN_CONFIG.SOLO, price: 4999 },
      TEAM: { ...PLAN_CONFIG.TEAM, price: 12999 },
    };

    expect(getTestModeBannerAmounts(mutatedConfig)).toEqual({
      solo: '4,999',
      team: '12,999',
    });
  });
});

// ─── computePricingCardDisplay — US-PAY-112 ──────────────────────────────────────────

function priceResult(overrides: Partial<EffectivePriceResult> = {}): EffectivePriceResult {
  return { regularPrice: 5499, effectivePrice: 5499, campaignId: null, badge: undefined, ...overrides };
}

describe('computePricingCardDisplay (US-PAY-112)', () => {
  it('AC2: no active campaign — hasFoundingPrice is false, no strikethrough', () => {
    const monthly = priceResult();
    const annual = priceResult({ regularPrice: 54990, effectivePrice: 54990 });
    const result = computePricingCardDisplay(monthly, annual, false, false);
    expect(result.hasFoundingPrice).toBe(false);
    expect(result.displayEffective).toBe(5499);
  });

  it('AC1: active founding campaign — hasFoundingPrice true, regular/effective both surfaced', () => {
    const monthly = priceResult({ regularPrice: 5499, effectivePrice: 3999, campaignId: 'FOUNDING100', badge: 'Founding 100' });
    const annual = priceResult({ regularPrice: 54990, effectivePrice: 39990, campaignId: 'FOUNDING100', badge: 'Founding 100' });
    const result = computePricingCardDisplay(monthly, annual, false, false);
    expect(result.hasFoundingPrice).toBe(true);
    expect(result.displayEffective).toBe(3999);
    expect(result.displayRegular).toBe(5499);
  });

  it('a campaignId with effectivePrice === regularPrice (redemption cap reached) is not treated as a founding price', () => {
    const monthly = priceResult({ regularPrice: 5499, effectivePrice: 5499, campaignId: 'FOUNDING100' });
    const annual = priceResult({ regularPrice: 54990, effectivePrice: 54990, campaignId: 'FOUNDING100' });
    const result = computePricingCardDisplay(monthly, annual, false, false);
    expect(result.hasFoundingPrice).toBe(false);
  });

  it('annual mode divides the annual EffectivePriceResult by 12 for the monthly-equivalent display', () => {
    const monthly = priceResult({ regularPrice: 5499, effectivePrice: 5499 });
    const annual = priceResult({ regularPrice: 54990, effectivePrice: 54990 });
    const result = computePricingCardDisplay(monthly, annual, true, false);
    expect(result.displayEffective).toBe(Math.round(54990 / 12));
    expect(result.annualEffectiveTotal).toBe(54990);
  });

  it('annualSavings is exactly 12x monthly regular minus the annual regular (the x10 formula leaves 2 months free)', () => {
    const monthly = priceResult({ regularPrice: 5499 });
    const annual = priceResult({ regularPrice: 54990 });
    const result = computePricingCardDisplay(monthly, annual, true, false);
    expect(result.annualSavings).toBe(5499 * 12 - 54990);
    expect(result.annualSavings).toBe(5499 * 2); // x10 formula = 2 months free
  });

  it('showAnnualToggle is false for a free tier (regularPrice 0)', () => {
    const monthly = priceResult({ regularPrice: 0, effectivePrice: 0 });
    const annual = priceResult({ regularPrice: 0, effectivePrice: 0 });
    const result = computePricingCardDisplay(monthly, annual, false, false);
    expect(result.showAnnualToggle).toBe(false);
  });

  it('the static Enterprise card never shows a toggle or a founding price, regardless of input', () => {
    const monthly = priceResult({ regularPrice: 5499, effectivePrice: 3999, campaignId: 'FOUNDING100' });
    const annual = priceResult({ regularPrice: 54990, effectivePrice: 39990, campaignId: 'FOUNDING100' });
    const result = computePricingCardDisplay(monthly, annual, false, true);
    expect(result.showAnnualToggle).toBe(false);
    expect(result.hasFoundingPrice).toBe(false);
  });

  it('handles undefined monthly/annual (pricing API not yet loaded) without throwing', () => {
    const result = computePricingCardDisplay(undefined, undefined, false, false);
    expect(result.displayEffective).toBe(0);
    expect(result.displayRegular).toBe(0);
    expect(result.hasFoundingPrice).toBe(false);
    expect(result.showAnnualToggle).toBe(false);
  });
});

// ─── buildComparisonRows — US-PAY-113 AC2 ────────────────────────────────────────────

describe('buildComparisonRows (US-PAY-113)', () => {
  it('produces one row per distinct feature, in first-seen order across plans', () => {
    const plans = [
      { features: ['A', 'B'] },
      { features: ['B', 'C'] },
    ];
    const rows = buildComparisonRows(plans);
    expect(rows.map((r) => r.feature)).toEqual(['A', 'B', 'C']);
  });

  it('marks presence per plan in the same order the plans were given', () => {
    const plans = [
      { features: ['A', 'B'] },
      { features: ['B', 'C'] },
    ];
    const rows = buildComparisonRows(plans);
    expect(rows.find((r) => r.feature === 'A')!.presence).toEqual([true, false]);
    expect(rows.find((r) => r.feature === 'B')!.presence).toEqual([true, true]);
    expect(rows.find((r) => r.feature === 'C')!.presence).toEqual([false, true]);
  });

  it('never fabricates a feature not present in any input plan', () => {
    const plans = [{ features: ['Only this one'] }];
    const rows = buildComparisonRows(plans);
    expect(rows).toEqual([{ feature: 'Only this one', presence: [true] }]);
  });

  it('an empty plan list produces an empty row set, not an error', () => {
    expect(buildComparisonRows([])).toEqual([]);
  });

  it('against the real PLAN_CONFIG public tiers: every row has a presence entry per plan, no crashes', () => {
    const realPlans = (["FREE", "SOLO", "PRO", "TEAM", "AGENCY"] as const).map((tier) => ({
      features: PLAN_CONFIG[tier].features,
    }));
    const rows = buildComparisonRows(realPlans);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.presence).toHaveLength(realPlans.length);
    }
  });
});
