import { describe, it, expect, vi } from 'vitest';
import { PLAN_CONFIG } from '@shared/schema';

// UsersService touches the prisma singleton at import time in some paths; stub it so this
// spec can import the module for its exported table without a DB.
vi.mock('../../src/database/prisma.client', () => ({
  prisma: { user: { count: vi.fn() }, organization: { findUnique: vi.fn() } },
}));

import { PLAN_USER_LIMITS, UsersService } from '../../src/modules/users/users.service';

/**
 * Regression cover for a launch-blocking defect found 2026-08-30.
 *
 * PLAN_USER_LIMITS was a hand-maintained duplicate of PLAN_CONFIG that omitted PRO and
 * AGENCY. `getUserLimit()` falls back to `?? 1` for an unknown tier, so AGENCY — sold as
 * "Unlimited users" at ₹43,999/mo — enforced a limit of exactly 1 seat.
 *
 * These tests assert the specific advertised numbers at the specific place enforcement
 * reads them. Asserting "the table has an agency key" would pass against a row containing
 * the wrong number, which is the failure that actually shipped.
 */
describe('PLAN_USER_LIMITS — enforcement matches what the pricing page sells', () => {
  const service = new UsersService();

  describe('the specific seat limits customers are sold', () => {
    it.each([
      ['solo', 1],
      ['pro', 1],
      ['team', 5],
      ['agency', -1], // -1 = unlimited
      ['brokerage', -1],
    ])('%s enforces a seat limit of %i', (tier, expected) => {
      expect(service.getUserLimit(tier)).toBe(expected);
    });

    it('AGENCY is unlimited, not 1 — the exact defect that shipped', () => {
      // Guards the silent `?? 1` fallback specifically: a missing AGENCY row returns 1,
      // which is a plausible-looking number rather than an obvious failure.
      expect(service.getUserLimit('agency')).toBe(-1);
      expect(service.getUserLimit('AGENCY')).toBe(-1); // callers pass either case
    });
  });

  describe('the specific monthly design volumes customers are sold', () => {
    it.each([
      ['solo', 50],
      ['pro', 100],
      ['team', 200],
      ['agency', 400],
      ['brokerage', 1000],
    ])('%s allows %i designs/month', (tier, expected) => {
      expect(service.getMonthlyLimit(tier)).toBe(expected);
    });
  });

  describe('the table cannot drift from PLAN_CONFIG again', () => {
    it('covers every tier in PLAN_CONFIG, so no tier can hit the ?? 1 fallback', () => {
      const configTiers = Object.keys(PLAN_CONFIG).map((t) => t.toLowerCase()).sort();
      expect(Object.keys(PLAN_USER_LIMITS).sort()).toEqual(configTiers);
    });

    it('every entry equals its PLAN_CONFIG source', () => {
      for (const tier of Object.keys(PLAN_CONFIG) as Array<keyof typeof PLAN_CONFIG>) {
        expect(PLAN_USER_LIMITS[tier.toLowerCase()]).toEqual({
          userLimit: PLAN_CONFIG[tier].userLimit,
          monthlyLimit: PLAN_CONFIG[tier].limit,
        });
      }
    });

    it('keys are lowercase — every caller looks up with planTier.toLowerCase()', () => {
      for (const key of Object.keys(PLAN_USER_LIMITS)) {
        expect(key).toBe(key.toLowerCase());
      }
      // The API tiers are the ones where a naive key would have been API_STARTER.
      expect(PLAN_USER_LIMITS).toHaveProperty('api_starter');
      expect(PLAN_USER_LIMITS).toHaveProperty('api_enterprise');
    });
  });

  describe('an unknown tier still fails safe', () => {
    it('falls back to the most restrictive limits, never to unlimited', () => {
      expect(service.getUserLimit('tier_that_does_not_exist')).toBe(1);
      expect(service.getMonthlyLimit('tier_that_does_not_exist')).toBe(3);
    });
  });
});
