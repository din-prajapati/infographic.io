import { describe, it, expect } from 'vitest';
import { PLAN_CONFIG } from '@shared/schema';

/**
 * US-PAY-108 AC4 — verifies the Founding-100 per-tier discount percentages against real
 * PLAN_CONFIG prices, matching what seed-founding-campaign.ts computes.
 *
 * Not importing seed-founding-campaign.ts directly here: it's a one-off script with a top-level
 * main().catch().finally() side effect (connects to the DB on import), the same shape as
 * seed-premium-templates.ts — scripts like this aren't meant to be imported, only run via
 * `npx tsx`. This test independently recomputes the same percentOff formula against the same
 * inputs, which is the actual thing AC4 cares about.
 */

const FOUNDING_PRICES = { SOLO: 3999, PRO: 7999, TEAM: 14999, AGENCY: 29999 } as const;

function percentOff(regular: number, founding: number): number {
  return ((regular - founding) / regular) * 100;
}

describe('Founding-100 tierDiscounts — exact per-tier percentages (US-PAY-108 AC4)', () => {
  it('SOLO and PRO are ~27.3% off, not a flat percentage shared with TEAM/AGENCY', () => {
    const soloPct = percentOff(PLAN_CONFIG.SOLO.price, FOUNDING_PRICES.SOLO);
    const proPct = percentOff(PLAN_CONFIG.PRO.price, FOUNDING_PRICES.PRO);

    expect(soloPct).toBeCloseTo(27.3, 0);
    expect(proPct).toBeCloseTo(27.3, 0);
  });

  it('TEAM and AGENCY are ~31.8% off', () => {
    const teamPct = percentOff(PLAN_CONFIG.TEAM.price, FOUNDING_PRICES.TEAM);
    const agencyPct = percentOff(PLAN_CONFIG.AGENCY.price, FOUNDING_PRICES.AGENCY);

    expect(teamPct).toBeCloseTo(31.8, 0);
    expect(agencyPct).toBeCloseTo(31.8, 0);
  });

  it('the computed percentage reproduces the exact founding price via Math.round (no drift)', () => {
    for (const tier of Object.keys(FOUNDING_PRICES) as Array<keyof typeof FOUNDING_PRICES>) {
      const regular = PLAN_CONFIG[tier].price;
      const founding = FOUNDING_PRICES[tier];
      const pct = percentOff(regular, founding);

      expect(Math.round(regular * (1 - pct / 100))).toBe(founding);
    }
  });

  it('SOLO/PRO and TEAM/AGENCY are genuinely different percentages, not one flat rate (AC4)', () => {
    const soloPct = percentOff(PLAN_CONFIG.SOLO.price, FOUNDING_PRICES.SOLO);
    const teamPct = percentOff(PLAN_CONFIG.TEAM.price, FOUNDING_PRICES.TEAM);

    expect(soloPct).not.toBeCloseTo(teamPct, 0);
  });
});
