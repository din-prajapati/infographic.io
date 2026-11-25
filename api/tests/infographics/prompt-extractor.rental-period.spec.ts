import { describe, it, expect } from 'vitest';
import { normalizeRentalPeriod, rentalPeriodFromText } from '../../src/modules/infographics/services/prompt-extractor.service';

// US-PROP-007 — the extractor returns the period a rental price is quoted for, so posters can print it.
describe('normalizeRentalPeriod — model JSON', () => {
  it('accepts only month, week, year and day', () => {
    expect(['month', 'Week', ' year ', 'DAY'].map(normalizeRentalPeriod)).toEqual(['month', 'week', 'year', 'day']);
    expect([null, undefined, '', 'fortnight', 42].map(normalizeRentalPeriod)).toEqual([undefined, undefined, undefined, undefined, undefined]);
  });
});

describe('rentalPeriodFromText — fallback when the model omits it', () => {
  it.each([
    ['2BHK for rent, ₹50,000 per month', 'month'],
    ['Flat to rent at 45k a month', 'month'],
    ['Studio for rent $1,800/mo', 'month'],
    ['Monthly rent 30,000', 'month'],
    ['Holiday villa for rent, 900 per week', 'week'],
    ['Office for rent, 12 lakh per annum', 'year'],
    ['Beach hut for rent, 150 per night', 'day'],
  ])('%s → %s', (text, period) => {
    expect(rentalPeriodFromText(text)).toBe(period);
  });

  it('does not read a period into unrelated words or times of day', () => {
    expect(rentalPeriodFromText('A modern home for rent near a moor, viewings at 5pm')).toBeUndefined();
    expect(rentalPeriodFromText('For rent: 3 bed house, Bandra')).toBeUndefined();
  });
});
