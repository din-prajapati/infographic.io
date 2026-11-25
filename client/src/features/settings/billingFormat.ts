import { PLAN_CONFIG, type PlanTier, type Subscription } from '@shared/schema';

/**
 * Billing display rules, moved unchanged from the retired SubscriptionCard / PaymentHistory so the Settings
 * Billing tab shows exactly what the Account page did. Pure functions — unit-tested.
 */

function toValidDate(value: string | Date | null | undefined): Date | null {
  if (value == null) return null;
  const date = new Date(value);
  const time = date.getTime();
  if (Number.isNaN(time) || time < 86_400_000) return null; // before 2 Jan 1970 = invalid / epoch
  return date;
}
function addDays(date: Date, days: number): Date { const out = new Date(date); out.setDate(out.getDate() + days); return out; }

/** Never shows 1/1/1970: falls back to period start + 30 days, then created + 30 days, then "—". */
export function formatBillingDate(
  value: string | Date | null | undefined,
  fallbacks?: { currentPeriodStart?: string | Date | null; createdAt?: string | Date | null },
  locale?: string,
): string {
  const format = (date: Date) => date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  const primary = toValidDate(value);
  if (primary) return format(primary);
  const fromStart = toValidDate(fallbacks?.currentPeriodStart);
  if (fromStart) return format(addDays(fromStart, 30));
  const fromCreated = toValidDate(fallbacks?.createdAt);
  if (fromCreated) return format(addDays(fromCreated, 30));
  return '—';
}

export type PlanEntry = (typeof PLAN_CONFIG)[PlanTier];
export function planFor(tier: string | null | undefined): { tier: PlanTier; config: PlanEntry } {
  const key = (tier ?? 'FREE').toUpperCase() as PlanTier;
  return PLAN_CONFIG[key] ? { tier: key, config: PLAN_CONFIG[key] } : { tier: 'FREE', config: PLAN_CONFIG.FREE };
}

/** Price label from the subscription's real `amount` (paise) and `billingPeriod`; catalog price as fallback. */
export function planPriceLabel(subscription: Subscription | null | undefined, config: PlanEntry): { price: string; annual: boolean } {
  if (config.price === 0) return { price: 'Free', annual: false };
  if (!subscription) return { price: `₹${config.price.toLocaleString('en-IN')}/mo`, annual: false };
  const annual = String((subscription as { billingPeriod?: string }).billingPeriod ?? 'MONTHLY').toUpperCase() === 'ANNUAL';
  const rupees = subscription.amount != null ? Math.round(Number(subscription.amount) / 100) : null;
  if (rupees != null && rupees > 0) return { price: `₹${rupees.toLocaleString('en-IN')}/${annual ? 'yr' : 'mo'}`, annual };
  return { price: `₹${config.price.toLocaleString('en-IN')}/mo`, annual: false };
}

/** Paise → "₹5,499"; other currencies via Intl. */
export function formatPaymentAmount(amount: number, currency: string): string {
  const major = amount / 100;
  if (currency === 'INR') return `₹${major.toLocaleString('en-IN')}`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(major);
}

/** "upi" → "UPI", "netbanking" → "Netbanking", "credit_card" → "Credit card", null → "—". */
export function formatPaymentMethod(method: string | null | undefined): string {
  if (!method) return '—';
  if (method.toLowerCase() === 'upi') return 'UPI';
  const words = method.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Last 12 characters of the provider id (what support asks for), else the last 8 of ours. */
export function shortTransactionId(payment: { id: string; externalPaymentId?: string | null }): string {
  return payment.externalPaymentId?.slice(-12) || payment.id.slice(-8);
}

export type PillTone = 'green' | 'amber' | 'red' | 'neutral';
export function paymentStatusTone(status: string): PillTone {
  switch (status) { case 'CAPTURED': return 'green'; case 'FAILED': return 'red'; case 'PENDING': return 'amber'; default: return 'neutral'; }
}
export function subscriptionStatusTone(status: string | undefined): PillTone {
  switch (status) { case 'ACTIVE': return 'green'; case 'PAST_DUE': return 'red'; case 'PENDING': return 'amber'; default: return 'neutral'; }
}
/** "PAST_DUE" → "Past due". */
export function statusLabel(status: string): string { const text = status.toLowerCase().replace(/_/g, ' '); return text.charAt(0).toUpperCase() + text.slice(1); }
