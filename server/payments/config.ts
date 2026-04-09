/**
 * Payment settings (env-backed; can be moved to DB later).
 * All payment-related config that may need to be editable at runtime should go here.
 * When moving to DB: replace env reads with a call to your settings service/repository.
 */

const DEFAULT_SUBSCRIPTION_START_BUFFER_SECONDS = 15 * 60; // 15 minutes

function parseIntEnv(key: string, defaultValue: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return defaultValue;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) || n < 0 ? defaultValue : n;
}

export interface PaymentSettings {
  /** Seconds to add to "now" for Razorpay subscription start_at. User must complete auth before this elapses. */
  razorpaySubscriptionStartBufferSeconds: number;
}

/**
 * Load payment settings from environment (or in future: from DB).
 * Keep this as the single entry point so a later DB-backed implementation is a drop-in replacement.
 */
export function getPaymentSettings(): PaymentSettings {
  return {
    razorpaySubscriptionStartBufferSeconds: parseIntEnv(
      'RAZORPAY_SUBSCRIPTION_START_BUFFER_SECONDS',
      DEFAULT_SUBSCRIPTION_START_BUFFER_SECONDS
    ),
  };
}
