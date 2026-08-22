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
import { getTestModeBannerAmounts } from '@/pages/PricingPage';
import { PLAN_CONFIG } from '@shared/schema';

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
