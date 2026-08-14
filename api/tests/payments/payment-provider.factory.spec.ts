/**
 * BL-04 regression — PADDLE/PAYPAL must never report as available.
 *
 * Neither provider has an implementation (payment-provider.factory.ts's
 * getProviderByType throws for both — no PaddleProvider/PayPalProvider class
 * exists). Before this fix, isProviderAvailable('PADDLE'/'PAYPAL') read
 * PADDLE_API_KEY / PAYPAL_CLIENT_ID+SECRET and could return true even though
 * actually selecting the provider would immediately throw — a latent bug
 * (getAvailableProviders() could list a provider that always throws when used)
 * hiding behind what looked like a merely-unused env read.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PaymentProviderFactory } from '../../../server/payments/providers/payment-provider.factory';

describe('PaymentProviderFactory — BL-04: PADDLE/PAYPAL are never available', () => {
  const savedEnv = { ...process.env };

  beforeEach(() => {
    // Ensure RazorPay constructs without throwing regardless of ambient env.
    process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'test_key_id';
    process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_key_secret';
  });

  afterEach(() => {
    process.env = { ...savedEnv };
  });

  it('reports PADDLE unavailable even when PADDLE_API_KEY is set', () => {
    process.env.PADDLE_API_KEY = 'fake-paddle-key';
    const factory = new PaymentProviderFactory();
    expect(factory.isProviderAvailable('PADDLE')).toBe(false);
  });

  it('reports PAYPAL unavailable even when both PayPal credentials are set', () => {
    process.env.PAYPAL_CLIENT_ID = 'fake-client-id';
    process.env.PAYPAL_CLIENT_SECRET = 'fake-client-secret';
    const factory = new PaymentProviderFactory();
    expect(factory.isProviderAvailable('PAYPAL')).toBe(false);
  });

  it('never lists PADDLE or PAYPAL in getAvailableProviders(), regardless of env', () => {
    process.env.PADDLE_API_KEY = 'fake-paddle-key';
    process.env.PAYPAL_CLIENT_ID = 'fake-client-id';
    process.env.PAYPAL_CLIENT_SECRET = 'fake-client-secret';
    const factory = new PaymentProviderFactory();
    const available = factory.getAvailableProviders();
    expect(available).not.toContain('PADDLE');
    expect(available).not.toContain('PAYPAL');
  });

  it('selecting PADDLE or PAYPAL explicitly still throws not-implemented (unchanged contract)', () => {
    const factory = new PaymentProviderFactory();
    expect(() => factory.getProvider(null, 'PADDLE')).toThrow('Paddle provider not yet implemented');
    expect(() => factory.getProvider(null, 'PAYPAL')).toThrow('PayPal provider not yet implemented');
  });
});
