import { pgTable, text, integer, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ==========================================
// PAYMENT INTEGRATION SCHEMA
// Provider-Agnostic Architecture for Multi-Provider Support
// ==========================================

// Enums for payment system
export const paymentProviderEnum = pgEnum('payment_provider', ['RAZORPAY', 'STRIPE', 'PADDLE', 'PAYPAL']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['ACTIVE', 'PAST_DUE', 'CANCELLED', 'HALTED', 'PAUSED', 'EXPIRED']);
export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'AUTHORIZED', 'CAPTURED', 'REFUNDED', 'FAILED']);
export const planTierEnum = pgEnum('plan_tier', ['FREE', 'SOLO', 'TEAM', 'BROKERAGE', 'API_STARTER', 'API_GROWTH', 'API_ENTERPRISE']);

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
  status: subscriptionStatusEnum('status').default('ACTIVE').notNull(),
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
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });

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
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'HALTED' | 'PAUSED' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'REFUNDED' | 'FAILED';
export type PlanTier = 'FREE' | 'SOLO' | 'TEAM' | 'BROKERAGE' | 'API_STARTER' | 'API_GROWTH' | 'API_ENTERPRISE';

// Plan Configuration (used by both frontend and backend)
export const PLAN_CONFIG: Record<PlanTier, {
  name: string;
  price: number;
  currency: string;
  limit: number;
  features: string[];
  popular?: boolean;
}> = {
  FREE: {
    name: 'Free',
    price: 0,
    currency: 'INR',
    limit: 3,
    features: ['3 infographics/month', 'Basic templates', 'Email support'],
  },
  SOLO: {
    name: 'Solo',
    price: 2999, // Updated from 2399 for better margin (45% at $0.033/infographic)
    currency: 'INR',
    limit: 50,
    features: ['50 infographics/month', 'All templates', 'Priority support', 'Custom branding'],
    popular: true,
  },
  TEAM: {
    name: 'Team',
    price: 6999, // Updated from 4999 for profitability (6% margin at $0.033/infographic)
    currency: 'INR',
    limit: 200,
    features: ['200 infographics/month', 'Team collaboration', '5 users', 'Advanced analytics'],
  },
  BROKERAGE: {
    name: 'Brokerage',
    price: 24999, // Updated from 16499 for 20% margin at $0.033/infographic
    currency: 'INR',
    limit: 1000,
    features: ['1000 infographics/month', 'Unlimited users', 'White-label', 'Dedicated support'],
  },
  API_STARTER: {
    name: 'API Starter',
    price: 82999, // Updated from 41499 for 50% margin at $0.033/infographic
    currency: 'INR',
    limit: 5000,
    features: ['5000 API calls/month', 'REST API access', 'Webhook support', 'Technical support'],
  },
  API_GROWTH: {
    name: 'API Growth',
    price: 249999, // Updated from 124999 for 62% margin at $0.033/infographic
    currency: 'INR',
    limit: 20000,
    features: ['20000 API calls/month', 'Priority API access', 'SLA guarantee', 'Dedicated account manager'],
  },
  API_ENTERPRISE: {
    name: 'API Enterprise',
    price: 0,
    currency: 'INR',
    limit: -1,
    features: ['Unlimited API calls', 'Custom SLA', 'On-premise option', '24/7 support', 'Custom integrations'],
  },
};

// Zod Schemas for API Validation
export const createSubscriptionSchema = z.object({
  planTier: z.enum(['FREE', 'SOLO', 'TEAM', 'BROKERAGE', 'API_STARTER', 'API_GROWTH', 'API_ENTERPRISE']),
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
