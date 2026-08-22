import { describe, it, expect } from 'vitest';
import { PLAN_CONFIG } from '@shared/schema';

// US-PAY-102 — PRO/AGENCY tier extension

describe('PLAN_CONFIG — PRO/AGENCY tiers (US-PAY-102)', () => {
  it('AC1 / TC-PAY-102-01: PRO matches the feasibility-checked spec exactly', () => {
    expect(PLAN_CONFIG.PRO.price).toBe(1099900);
    expect(PLAN_CONFIG.PRO.limit).toBe(100);
    expect(PLAN_CONFIG.PRO.editableLimit).toBe(25);
  });

  it('AC1 / TC-PAY-102-01: AGENCY matches the feasibility-checked spec exactly', () => {
    expect(PLAN_CONFIG.AGENCY.price).toBe(4399900);
    expect(PLAN_CONFIG.AGENCY.limit).toBe(400);
    expect(PLAN_CONFIG.AGENCY.editableLimit).toBe(150);
  });

  it('AC1: every paid tier carries the new editableLimit field (SOLO 10, TEAM 60)', () => {
    expect(PLAN_CONFIG.SOLO.editableLimit).toBe(10);
    expect(PLAN_CONFIG.TEAM.editableLimit).toBe(60);
  });

  it('AC1: AGENCY is a distinct tier from BROKERAGE, not a rename (different volume)', () => {
    expect(PLAN_CONFIG.AGENCY.limit).not.toBe(PLAN_CONFIG.BROKERAGE.limit);
    expect(PLAN_CONFIG.BROKERAGE.limit).toBe(1000);
  });

  it('AC4 / TC-PAY-102-03: every PLAN_CONFIG price is an integer (paise, never floating rupees)', () => {
    for (const [tier, config] of Object.entries(PLAN_CONFIG)) {
      expect(Number.isInteger(config.price), `${tier}.price should be an integer`).toBe(true);
    }
  });
});
