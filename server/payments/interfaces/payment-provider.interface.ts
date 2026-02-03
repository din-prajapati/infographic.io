/**
 * Payment Provider Interface
 * 
 * This interface defines the contract that ALL payment providers must implement.
 * This allows seamless switching between RazorPay, Stripe, Paddle, etc.
 */

export type PaymentProviderType = 'RAZORPAY' | 'STRIPE' | 'PADDLE' | 'PAYPAL';

// Standardized response interfaces (provider-agnostic)
export interface CustomerResponse {
  id: string;
  email: string;
  name: string;
  provider: PaymentProviderType;
}

export interface SubscriptionResponse {
  id: string;
  customerId: string;
  planId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  amount: number;
  currency: string;
  provider: PaymentProviderType;
  shortUrl?: string;
}

export interface CreatePlanParams {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  amount: number;
  currency: string;
  name: string;
  description?: string;
}

export interface CreateSubscriptionParams {
  planId: string;
  customerId: string;
  totalCount: number;
  quantity?: number;
  startAt?: number;
  notify?: boolean;
}

export interface UpdateSubscriptionParams {
  planId?: string;
  quantity?: number;
  scheduleChangeAt?: 'now' | 'cycle_end';
}

export interface PaymentResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  provider: PaymentProviderType;
}

export interface RefundResponse {
  id: string;
  paymentId: string;
  amount: number;
  status: string;
  provider: PaymentProviderType;
}

export interface InvoiceResponse {
  id: string;
  amount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status: string;
  provider: PaymentProviderType;
}

export interface PlanResponse {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval: string;
  provider: PaymentProviderType;
}

export interface IPaymentProvider {
  // Provider identification
  getProviderName(): PaymentProviderType;

  // Customer management
  createCustomer(email: string, name: string, phone?: string): Promise<CustomerResponse>;

  // Plan management (one-time setup)
  createPlan(params: CreatePlanParams): Promise<PlanResponse>;

  // Subscription management
  createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResponse>;
  fetchSubscription(subscriptionId: string): Promise<SubscriptionResponse>;
  updateSubscription(subscriptionId: string, params: UpdateSubscriptionParams): Promise<SubscriptionResponse>;
  cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean): Promise<SubscriptionResponse>;

  // Payment management
  fetchPayment(paymentId: string): Promise<PaymentResponse>;
  refundPayment(paymentId: string, amount?: number): Promise<RefundResponse>;

  // Invoice management
  fetchInvoice(invoiceId: string): Promise<InvoiceResponse>;

  // Verification (security)
  verifyWebhookSignature(webhookBody: string, signature: string, secret: string): boolean;
  verifyPaymentSignature?(orderId: string, paymentId: string, signature: string): boolean;
}
