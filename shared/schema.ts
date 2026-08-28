import { pgTable, text, integer, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ==========================================
// PAYMENT INTEGRATION SCHEMA
// Provider-Agnostic Architecture for Multi-Provider Support
// ==========================================

// Enums for payment system
export const paymentProviderEnum = pgEnum('payment_provider', ['RAZORPAY', 'STRIPE', 'PADDLE', 'PAYPAL']);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'PENDING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELLED',
  'HALTED',
  'PAUSED',
  'EXPIRED',
]);
export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'AUTHORIZED', 'CAPTURED', 'REFUNDED', 'FAILED']);
export const planTierEnum = pgEnum('plan_tier', ['FREE', 'SOLO', 'PRO', 'TEAM', 'AGENCY', 'BROKERAGE', 'API_STARTER', 'API_GROWTH', 'API_ENTERPRISE']); // US-PAY-102

// Users table with provider customer IDs
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  name: text('name'),
  organizationId: text('organization_id'),
  razorpayCustomerId: text('razorpay_customer_id').unique(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  paddleCustomerId: text('paddle_customer_id').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organizations table
export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  plan: planTierEnum('plan').default('FREE').notNull(),
  monthlyLimit: integer('monthly_limit').default(3).notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  usageResetDate: timestamp('usage_reset_date'),
  razorpayCustomerId: text('razorpay_customer_id').unique(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  paddleCustomerId: text('paddle_customer_id').unique(),
  activeSubscriptionId: text('active_subscription_id'),
  brandColors: text('brand_colors').array(),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Subscriptions table (Provider-Agnostic)
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  organizationId: text('organization_id'),
  paymentProvider: paymentProviderEnum('payment_provider').default('RAZORPAY').notNull(),
  externalSubscriptionId: text('external_subscription_id').unique().notNull(),
  externalPlanId: text('external_plan_id').notNull(),
  externalCustomerId: text('external_customer_id'),
  planTier: planTierEnum('plan_tier').notNull(),
  status: subscriptionStatusEnum('status').default('PENDING').notNull(),
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  cancelledAt: timestamp('cancelled_at'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').default('INR').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Payments table (Provider-Agnostic)
export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  subscriptionId: text('subscription_id'),
  paymentProvider: paymentProviderEnum('payment_provider').default('RAZORPAY').notNull(),
  externalPaymentId: text('external_payment_id').unique().notNull(),
  externalOrderId: text('external_order_id'),
  externalInvoiceId: text('external_invoice_id'),
  signature: text('signature'),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull(),
  status: paymentStatusEnum('status').default('PENDING').notNull(),
  method: text('method'),
  errorCode: text('error_code'),
  errorDescription: text('error_description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Invoices table (Provider-Agnostic)
export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  paymentProvider: paymentProviderEnum('payment_provider').default('RAZORPAY').notNull(),
  externalInvoiceId: text('external_invoice_id').unique().notNull(),
  externalSubscriptionId: text('external_subscription_id'),
  amount: integer('amount').notNull(),
  amountPaid: integer('amount_paid'),
  amountDue: integer('amount_due'),
  currency: text('currency').notNull(),
  status: text('status').notNull(),
  issuedAt: timestamp('issued_at').notNull(),
  paidAt: timestamp('paid_at'),
  expiredAt: timestamp('expired_at'),
  invoiceUrl: text('invoice_url'),
  receiptUrl: text('receipt_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Drizzle-Zod Insert Schemas
// drizzle-zod v0.7+ already excludes default fields (id, createdAt, updatedAt) from insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertOrganizationSchema = createInsertSchema(organizations);
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertInvoiceSchema = createInsertSchema(invoices);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type PaymentProvider = 'RAZORPAY' | 'STRIPE' | 'PADDLE' | 'PAYPAL';
export type SubscriptionStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELLED'
  | 'HALTED'
  | 'PAUSED'
  | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'REFUNDED' | 'FAILED';
export type PlanTier = 'FREE' | 'SOLO' | 'PRO' | 'TEAM' | 'AGENCY' | 'BROKERAGE' | 'API_STARTER' | 'API_GROWTH' | 'API_ENTERPRISE';

// Plan Configuration (used by both frontend and backend)
export const PLAN_CONFIG: Record<PlanTier, {
  name: string;
  /** Monthly list price, integer rupees (NOT paise). */
  price: number;
  /**
   * Annual list price, integer rupees. **Authored, never computed.**
   *
   * A price is a business decision, not a mathematical consequence. The previous
   * multiplier approach let two files disagree about what a customer pays --
   * schema.ts used x10 ("2 months free") while payments.service.ts used
   * x12*0.85 ("15% off"), so the pricing page advertised one annual figure and
   * checkout recorded another. There is no multiplier to drift now.
   *
   * Targets ~20% below 12x monthly while landing on a clean number. The
   * displayed saving is derived from these two figures (getAnnualSavings),
   * never hand-written.
   */
  annualPrice: number;
  currency: string;
  limit: number;
  userLimit: number; // -1 = unlimited
  features: string[];
  popular?: boolean;
  editableLimit?: number; // per-cycle credit-charged editable-compose cap; -1 = unlimited
  /**
   * Promotional prices, AUTHORED per campaign code — never computed from a percentage.
   *
   * **A promotion is a price, not a discount.** A campaign does not multiply anything;
   * it selects a different authored number, and (at the provider) a different Plan
   * object. That makes "promotions never stack" structurally impossible to violate:
   * a customer is on exactly one plan, so there is no second discount to compose with.
   *
   * Keyed by `PricingCampaign.code`. A tier with no entry for the active campaign is
   * simply not on promotion and bills at list price — absence is the "not covered"
   * signal, no flag required.
   *
   * `monthly` is optional on purpose: a promo may be annual-only (the usual shape for
   * founding-member programs, which are cash instruments rather than pricing tiers).
   */
  promoPrices?: Record<string, { monthly?: number; annual?: number }>;
}> = {
  FREE: {
    name: 'Free',
    price: 0,
    annualPrice: 0,
    currency: 'INR',
    limit: 3,
    userLimit: 1,
    // US-LAUNCH-015 AC7: "1 trial" — the lifetime editable-compose trial (AC1/AC2).
    features: ['3 AI Marketing Designs/month', 'Basic templates', 'Email support', 'Editable designs (1 trial)'],
  },
  SOLO: {
    name: 'Solo',
    // US-PAY-102 (re-opened 2026-08-23): repriced from the beta price (2999) to the relaunch's
    // feasibility-checked regular price per the PRD's finalized pricing table — this was a real
    // gap, no story had ever actually repriced the existing tiers, only added PRO/AGENCY. Existing
    // live Razorpay Plan objects for SOLO are price-immutable at the old rate; new Plan objects at
    // this price are a human dashboard task (tracked in HUMAN_TASKS.md), same category as
    // US-PAY-109's PRO/AGENCY plans.
    price: 5499,
    annualPrice: 52999,
    currency: 'INR',
    limit: 50,
    userLimit: 1,
    // US-LAUNCH-015 AC7: editable is included — first distinct compose per
    // generation is free; additional distinct composes on the same
    // generation consume a credit (AC3). No headline price change.
    features: ['50 AI Marketing Designs/month', 'All templates', 'Priority support', 'Custom branding', 'Editable designs'],
    popular: true,
    editableLimit: 10,
  },
  PRO: {
    name: 'Pro',
    price: 10999, // rupees, matching every other tier's convention (SOLO 5499, TEAM 21999) — NOT paise
    annualPrice: 105999,
    currency: 'INR',
    limit: 100,
    userLimit: 1,
    features: ['100 AI Marketing Designs/month', 'All templates', 'Priority support', 'Custom branding', 'Editable designs'],
    editableLimit: 25,
  },
  TEAM: {
    name: 'Team',
    price: 21999, // US-PAY-102 (re-opened 2026-08-23) — see SOLO's note above, same gap/fix
    annualPrice: 210999,
    currency: 'INR',
    limit: 200,
    userLimit: 5,
    features: ['200 AI Marketing Designs/month', 'Team collaboration', '5 users', 'Advanced analytics', 'Editable designs'],
    editableLimit: 60,
  },
  AGENCY: {
    name: 'Agency',
    price: 43999, // rupees, matching every other tier's convention (BROKERAGE 24999) — NOT paise
    annualPrice: 421999,
    currency: 'INR',
    limit: 400,
    userLimit: -1, // unlimited
    features: ['400 AI Marketing Designs/month', 'Unlimited users', 'Team collaboration', 'Advanced analytics', 'Editable designs'],
    editableLimit: 150,
  },
  BROKERAGE: {
    name: 'Brokerage',
    price: 24999,
    annualPrice: 239999,
    currency: 'INR',
    limit: 1000,
    userLimit: -1, // unlimited
    features: ['1000 AI Marketing Designs/month', 'Unlimited users', 'White-label', 'Dedicated support', 'Editable designs'],
    editableLimit: 100, // US-PAY-103: migrated from the retired EDITABLE_LIMITS_BY_TIER table
  },
  API_STARTER: {
    name: 'API Starter',
    price: 82999,
    annualPrice: 796999,
    currency: 'INR',
    limit: 5000,
    userLimit: 1,
    features: ['5000 API calls/month', 'REST API access', 'Webhook support', 'Technical support'],
    editableLimit: -1, // unlimited — US-PAY-103: migrated from the retired EDITABLE_LIMITS_BY_TIER table
  },
  API_GROWTH: {
    name: 'API Growth',
    price: 249999,
    annualPrice: 2399999,
    currency: 'INR',
    limit: 20000,
    userLimit: 3,
    features: ['20000 API calls/month', 'Priority API access', 'SLA guarantee', 'Dedicated account manager'],
    editableLimit: -1, // unlimited — US-PAY-103
  },
  API_ENTERPRISE: {
    name: 'API Enterprise',
    price: 0,
    annualPrice: 0,
    currency: 'INR',
    limit: -1, // unlimited
    userLimit: -1, // unlimited
    features: ['Unlimited API calls', 'Custom SLA', 'On-premise option', '24/7 support', 'Custom integrations'],
    editableLimit: -1, // unlimited — US-PAY-103
  },
};

// Annual pricing is AUTHORED per tier (PLAN_CONFIG.annualPrice), not derived.
// The multiplier that used to live here was the bug: schema.ts multiplied by 10
// while payments.service.ts multiplied by 12*0.85, so the pricing page and
// checkout disagreed about the annual price of every tier. Nothing below
// multiplies -- there is nothing left to diverge.
//
// Composition with a time-boxed promotional campaign happens in the US-PAY-106
// resolution service, not here.

/** The authored annual price for a tier, integer rupees. */
export function getAnnualPrice(tier: PlanTier): number {
  return PLAN_CONFIG[tier].annualPrice;
}

/** The authored list price for a tier at one interval, integer rupees. */
export function getListPrice(tier: PlanTier, interval: 'monthly' | 'annual'): number {
  return interval === 'annual' ? PLAN_CONFIG[tier].annualPrice : PLAN_CONFIG[tier].price;
}

/**
 * The authored promotional price for a tier under one campaign, or `undefined` when
 * that tier/interval is not on promotion.
 *
 * This is a LOOKUP, deliberately. The percentage arithmetic that used to live in the
 * resolver — `Math.round(price * (1 - discount / 100))` — is gone: a percentage that
 * reaches a price is a number nobody authored and nobody reviewed, and it produced
 * two independent roundings (monthly and annual) that could disagree with the Plan
 * object a customer is actually billed against.
 *
 * `undefined` is a real answer, not a failure: it means "bills at list".
 */
export function getPromoPrice(
  tier: PlanTier,
  campaignCode: string,
  interval: 'monthly' | 'annual',
): number | undefined {
  return PLAN_CONFIG[tier].promoPrices?.[campaignCode]?.[interval];
}

/** What 12 months at the monthly rate would cost -- the anchor a saving is measured against. */
export function getAnnualListPrice(tier: PlanTier): number {
  return PLAN_CONFIG[tier].price * 12;
}

/**
 * Saving for paying annually, DERIVED from the two authored prices so a displayed
 * percentage can never disagree with the price printed beside it.
 *
 * Returns null where there is no meaningful annual saving (free tiers,
 * contact-sales tiers) so callers render nothing rather than "Save 0%".
 */
export function getAnnualSavings(
  tier: PlanTier,
): { amount: number; percent: number; monthlyEquivalent: number } | null {
  const monthly = PLAN_CONFIG[tier].price;
  const annual = PLAN_CONFIG[tier].annualPrice;
  if (monthly <= 0 || annual <= 0) return null;

  const list = monthly * 12;
  const amount = list - annual;
  if (amount <= 0) return null;

  return {
    amount,
    percent: Math.round((amount / list) * 100),
    monthlyEquivalent: Math.round(annual / 12),
  };
}

// Zod Schemas for API Validation
export const createSubscriptionSchema = z.object({
  planTier: z.enum(['FREE', 'SOLO', 'PRO', 'TEAM', 'AGENCY', 'BROKERAGE', 'API_STARTER', 'API_GROWTH', 'API_ENTERPRISE']),
  currency: z.string().default('INR'),
  region: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  razorpayPaymentId: z.string(),
  razorpaySubscriptionId: z.string(),
  razorpaySignature: z.string(),
});

export const cancelSubscriptionSchema = z.object({
  immediate: z.boolean().default(false),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;

// ==========================================
// EXISTING APPLICATION SCHEMAS
// ==========================================

export const agentBrandingSchema = z.object({
  name: z.string().min(1, 'Agent name is required'),
  brokerage: z.string().optional(),
  brandColors: z.array(z.string()).optional(),
  logoUrl: z.string().optional().refine((val) => !val || z.string().url().safeParse(val).success, {
    message: 'Must be a valid URL',
  }),
});

export const generateInfographicSchema = z.object({
  propertyType: z.enum(['residential', 'commercial', 'land']),
  listingType: z.enum(['for_sale', 'for_rent', 'sold']),
  price: z.number().min(0, 'Price must be positive'),
  address: z.string().min(1, 'Address is required'),
  beds: z.number().min(0, 'Beds must be positive'),
  baths: z.number().min(0, 'Baths must be positive'),
  sqft: z.number().min(0, 'Square footage must be positive'),
  features: z.array(z.string()).optional(),
  photos: z.array(z.string().url()).optional(),
  agent: agentBrandingSchema,
  aiModel: z.enum(['ideogram-turbo', 'ideogram-2']).optional(),
});

export type GenerateInfographicInput = z.infer<typeof generateInfographicSchema>;

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
  organizationName: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Note: User type is defined above from Drizzle schema (typeof users.$inferSelect)
// Legacy interface for compatibility with existing auth system
export interface LegacyUser {
  id: string;
  email: string;
  name?: string;
  organizationId?: string;
}

export interface AuthResponse {
  user: LegacyUser;
  token: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  propertyType: string;
  priceRange: string;
  layout: any;
  previewUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Infographic {
  id: string;
  userId: string;
  organizationId: string;
  templateId: string;
  propertyData: any;
  imageUrl: string;
  aiModel: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: string;
  template?: {
    name: string;
    category: string;
  };
}
