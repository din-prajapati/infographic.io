import { describe, it, expect } from 'vitest';
import { PLAN_CONFIG } from '@shared/schema';

// US-PAY-102 — PRO/AGENCY tier extension

describe('PLAN_CONFIG — PRO/AGENCY tiers (US-PAY-102)', () => {
  it('AC1 / TC-PAY-102-01: PRO matches the feasibility-checked spec exactly', () => {
    // Rupees, not paise — matches every existing tier's convention (SOLO: 5499, TEAM: 21999).
    // The story's own AC1/AC4 text said "paise" (1099900); corrected after finding every
    // pre-existing tier stores rupees and subscription.service.ts does `price * 100` itself
    // when constructing a payment amount — storing paise here would have double-converted.
    expect(PLAN_CONFIG.PRO.price).toBe(10999);
    expect(PLAN_CONFIG.PRO.limit).toBe(100);
    expect(PLAN_CONFIG.PRO.editableLimit).toBe(25);
  });

  it('AC1 / TC-PAY-102-01: AGENCY matches the feasibility-checked spec exactly', () => {
    expect(PLAN_CONFIG.AGENCY.price).toBe(43999);
    expect(PLAN_CONFIG.AGENCY.limit).toBe(400);
    expect(PLAN_CONFIG.AGENCY.editableLimit).toBe(150);
  });

  it('re-opened 2026-08-23: SOLO/TEAM are repriced to the PRD\'s relaunch regular price, not the beta price', () => {
    // Real gap found while implementing US-PAY-106: no story had ever actually repriced the
    // existing tiers from their beta values (SOLO 2999, TEAM 6999) to the relaunch's
    // feasibility-checked numbers — US-PAY-102 originally only added PRO/AGENCY. Fixed here.
    expect(PLAN_CONFIG.SOLO.price).toBe(5499);
    expect(PLAN_CONFIG.TEAM.price).toBe(21999);
  });

  it('AC1: every paid tier carries the new editableLimit field (SOLO 10, TEAM 60)', () => {
    expect(PLAN_CONFIG.SOLO.editableLimit).toBe(10);
    expect(PLAN_CONFIG.TEAM.editableLimit).toBe(60);
  });

  it('AC1: AGENCY is a distinct tier from BROKERAGE, not a rename (different volume)', () => {
    expect(PLAN_CONFIG.AGENCY.limit).not.toBe(PLAN_CONFIG.BROKERAGE.limit);
    expect(PLAN_CONFIG.BROKERAGE.limit).toBe(1000);
  });

  it('AC4 / TC-PAY-102-03: every PLAN_CONFIG price is an integer rupee amount (never a float)', () => {
    for (const [tier, config] of Object.entries(PLAN_CONFIG)) {
      expect(Number.isInteger(config.price), `${tier}.price should be an integer`).toBe(true);
    }
  });
});
