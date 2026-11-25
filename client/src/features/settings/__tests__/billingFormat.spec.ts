import { describe, it, expect } from 'vitest';
import { formatBillingDate, formatPaymentAmount, formatPaymentMethod, paymentStatusTone, planFor, planPriceLabel, shortTransactionId, statusLabel, subscriptionStatusTone } from '../billingFormat';
import { PLAN_CONFIG, type Subscription } from '@shared/schema';

const sub = (patch: Partial<Subscription> & Record<string, unknown>) => patch as unknown as Subscription;

describe('billing display rules (carried over from SubscriptionCard / PaymentHistory)', () => {
  it('formats the next billing date and never shows the epoch', () => {
    expect(formatBillingDate('2026-12-17T00:00:00.000Z', undefined, 'en-GB')).toBe('17 Dec 2026');
    expect(formatBillingDate('1970-01-01T00:00:00.000Z', { currentPeriodStart: '2026-11-01T12:00:00.000Z' }, 'en-GB')).toBe('1 Dec 2026');
    expect(formatBillingDate(null, { createdAt: '2026-10-01T12:00:00.000Z' }, 'en-GB')).toBe('31 Oct 2026');
    expect(formatBillingDate(undefined)).toBe('—');
  });

  it('prices from the subscription amount in paise, monthly or annual, with the catalog as fallback', () => {
    expect(planPriceLabel(null, PLAN_CONFIG.FREE)).toEqual({ price: 'Free', annual: false });
    expect(planPriceLabel(null, PLAN_CONFIG.SOLO).price).toBe(`₹${PLAN_CONFIG.SOLO.price.toLocaleString('en-IN')}/mo`);
    expect(planPriceLabel(sub({ amount: 549900, billingPeriod: 'MONTHLY' }), PLAN_CONFIG.SOLO)).toEqual({ price: '₹5,499/mo', annual: false });
    expect(planPriceLabel(sub({ amount: 5279900, billingPeriod: 'ANNUAL' }), PLAN_CONFIG.SOLO)).toEqual({ price: '₹52,799/yr', annual: true });
    expect(planPriceLabel(sub({ amount: undefined }), PLAN_CONFIG.TEAM).price).toBe(`₹${PLAN_CONFIG.TEAM.price.toLocaleString('en-IN')}/mo`);
  });

  it('falls back to Free for an unknown tier and is case-insensitive', () => {
    expect(planFor('team').tier).toBe('TEAM');
    expect(planFor('NOPE').tier).toBe('FREE');
    expect(planFor(undefined).tier).toBe('FREE');
  });

  it('formats payment rows like the screenshot (₹5,499 · UPI · Captured · last 12 of the provider id)', () => {
    expect(formatPaymentAmount(549900, 'INR')).toBe('₹5,499');
    expect(formatPaymentAmount(2000, 'USD')).toBe('$20.00');
    expect(formatPaymentMethod('upi')).toBe('UPI');
    expect(formatPaymentMethod('credit_card')).toBe('Credit card');
    expect(formatPaymentMethod(null)).toBe('—');
    expect(shortTransactionId({ id: 'pay_local_12345678', externalPaymentId: 'pay_ABCDYqVEVYEtiDNz' })).toBe('YqVEVYEtiDNz');
    expect(shortTransactionId({ id: 'cm1234567890abcd', externalPaymentId: null })).toBe('7890abcd');
    expect(statusLabel('CAPTURED')).toBe('Captured');
    expect(statusLabel('PAST_DUE')).toBe('Past due');
  });

  it('colours statuses consistently', () => {
    expect([paymentStatusTone('CAPTURED'), paymentStatusTone('FAILED'), paymentStatusTone('PENDING'), paymentStatusTone('REFUNDED')]).toEqual(['green', 'red', 'amber', 'neutral']);
    expect([subscriptionStatusTone('ACTIVE'), subscriptionStatusTone('PAST_DUE'), subscriptionStatusTone('PENDING'), subscriptionStatusTone(undefined)]).toEqual(['green', 'red', 'amber', 'neutral']);
  });
});
