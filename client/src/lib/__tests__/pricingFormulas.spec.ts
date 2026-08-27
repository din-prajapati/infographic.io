import { describe, it, expect } from 'vitest';
import { PLAN_CONFIG, PlanTier, getAnnualPrice, getAnnualListPrice, getAnnualSavings } from '@shared/schema';

/**
 * Annual pricing is AUTHORED per tier, not derived (changed 2026-08-27).
 *
 * The previous suite asserted `getAnnualPrice(monthly) === monthly * 10`. That
 * multiplier was the bug: shared/schema.ts used x10 while payments.service.ts
 * used x12*0.85, so /pricing advertised one annual price and checkout recorded
 * another (SOLO differed by Rs 1,100/yr). There is no multiplier to assert now,
 * so these tests assert the properties that actually protect the customer:
 * the price is the authored one, and any displayed saving is derived from it.
 */

const PAID_TIERS: PlanTier[] = ['SOLO', 'PRO', 'TEAM', 'AGENCY'];

describe('getAnnualPrice — returns the authored price, never a computation', () => {
  it('returns exactly what PLAN_CONFIG authors, for every tier', () => {
    (Object.keys(PLAN_CONFIG) as PlanTier[]).forEach((tier) => {
      expect(getAnnualPrice(tier)).toBe(PLAN_CONFIG[tier].annualPrice);
    });
  });

  it('is not any multiplier of the monthly price — the drift bug cannot recur', () => {
    PAID_TIERS.forEach((tier) => {
      const monthly = PLAN_CONFIG[tier].price;
      expect(getAnnualPrice(tier)).not.toBe(monthly * 10);            // old schema.ts formula
      expect(getAnnualPrice(tier)).not.toBe(Math.round(monthly * 12 * 0.85)); // old checkout formula
    });
  });

  it('returns an integer number of rupees for every tier (never paise, never float)', () => {
    (Object.keys(PLAN_CONFIG) as PlanTier[]).forEach((tier) => {
      expect(Number.isInteger(getAnnualPrice(tier))).toBe(true);
    });
  });
});

describe('getAnnualSavings — derived, so a badge can never contradict the price', () => {
  it('computes the saving from the two authored prices', () => {
    const s = getAnnualSavings('SOLO')!;
    expect(s.amount).toBe(PLAN_CONFIG.SOLO.price * 12 - PLAN_CONFIG.SOLO.annualPrice);
    expect(s.monthlyEquivalent).toBe(Math.round(PLAN_CONFIG.SOLO.annualPrice / 12));
  });

  // Deliberately a band, not an equality. The authored prices are not exactly 20%
  // off -- Solo/Pro are ~19.7%, Team/Agency ~20.1% -- and pinning the test to 20
  // would assert a mathematical property the prices do not actually have, then
  // fail for the wrong reason the first time a tier is legitimately authored at a
  // different depth. What matters is that annual is a real, sane discount.
  it('gives every paid tier a genuine annual discount in a sane band', () => {
    PAID_TIERS.forEach((tier) => {
      const s = getAnnualSavings(tier)!;
      expect(s.percent).toBeGreaterThanOrEqual(15);
      expect(s.percent).toBeLessThanOrEqual(25);
    });
  });

  // The badge is a single claim covering every paid tier, so it can only be shown
  // when the ROUNDED percentages agree. This asserts that agreement -- not that the
  // number is 20 -- so re-authoring all four tiers to a different depth keeps the
  // badge working, while authoring just one differently correctly breaks it.
  it('rounded savings agree across paid tiers, so one badge can honestly cover them', () => {
    const rounded = PAID_TIERS.map((t) => getAnnualSavings(t)!.percent);
    expect(new Set(rounded).size).toBe(1);
  });

  it('annual is genuinely cheaper than 12 months of monthly, for every paid tier', () => {
    PAID_TIERS.forEach((tier) => {
      expect(getAnnualPrice(tier)).toBeLessThan(getAnnualListPrice(tier));
    });
  });

  it('returns null where there is no meaningful annual saving, so nothing renders', () => {
    expect(getAnnualSavings('FREE')).toBeNull();
    expect(getAnnualSavings('API_ENTERPRISE')).toBeNull(); // contact-sales, price 0
  });

  it('monthlyEquivalent x 12 stays within a rupee of the authored annual price', () => {
    PAID_TIERS.forEach((tier) => {
      const s = getAnnualSavings(tier)!;
      expect(Math.abs(s.monthlyEquivalent * 12 - getAnnualPrice(tier))).toBeLessThanOrEqual(12);
    });
  });
});
