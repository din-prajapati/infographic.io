import * as crypto from 'crypto';
import {
  IPaymentProvider,
  PaymentProviderType,
  CustomerResponse,
  SubscriptionResponse,
  CreatePlanParams,
  CreateSubscriptionParams,
  UpdateSubscriptionParams,
  PaymentResponse,
  RefundResponse,
  InvoiceResponse,
  PlanResponse,
} from '../interfaces/payment-provider.interface';

/**
 * Stripe Provider Implementation
 * Implements IPaymentProvider interface for Stripe integration
 * 
 * FEATURE FLAG: This provider is controlled by STRIPE_ENABLED environment variable.
 * When STRIPE_ENABLED=false (default), this provider will not be used.
 * When STRIPE_ENABLED=true, this provider handles international payments (USD, EUR, etc.)
 * 
 * Required Environment Variables:
 * - STRIPE_SECRET_KEY: Your Stripe secret key (sk_live_... or sk_test_...)
 * - STRIPE_PUBLISHABLE_KEY: Your Stripe publishable key (pk_live_... or pk_test_...)
 * - STRIPE_WEBHOOK_SECRET: Webhook endpoint secret for signature verification
 * 
 * Note: For India-based founders, Stripe is currently invite-only.
 * Use RazorPay for INR payments until Stripe access is granted.
 */

// Stripe SDK types (simplified for this implementation)
interface StripeInstance {
  customers: {
    create(params: any): Promise<any>;
    retrieve(id: string): Promise<any>;
  };
  prices: {
    create(params: any): Promise<any>;
    retrieve(id: string): Promise<any>;
  };
  products: {
    create(params: any): Promise<any>;
  };
  subscriptions: {
    create(params: any): Promise<any>;
    retrieve(id: string): Promise<any>;
    update(id: string, params: any): Promise<any>;
    cancel(id: string, params?: any): Promise<any>;
  };
  paymentIntents: {
    retrieve(id: string): Promise<any>;
  };
  refunds: {
    create(params: any): Promise<any>;
  };
  invoices: {
    retrieve(id: string): Promise<any>;
  };
  checkout: {
    sessions: {
      create(params: any): Promise<any>;
    };
  };
  webhooks: {
    constructEvent(payload: string, header: string, secret: string): any;
  };
}

export class StripeProvider implements IPaymentProvider {
  private stripe: StripeInstance | null = null;
  private secretKey: string;
  private publishableKey: string;
  private webhookSecret: string;

  constructor() {
    this.secretKey = process.env.STRIPE_SECRET_KEY || '';
    this.publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  /**
   * Check if Stripe is enabled via feature flag
   */
  static isEnabled(): boolean {
    return process.env.STRIPE_ENABLED === 'true';
  }

  /**
   * Check if Stripe credentials are configured
   */
  static isConfigured(): boolean {
    return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);
  }

  private async getStripeInstance(): Promise<StripeInstance> {
    if (!this.stripe) {
      if (!this.secretKey) {
        throw new Error('STRIPE_SECRET_KEY is required. Set STRIPE_ENABLED=true and configure your Stripe API keys.');
      }
      
      // Dynamic import for Stripe SDK
      const Stripe = (await import('stripe')).default;
      this.stripe = new Stripe(this.secretKey) as unknown as StripeInstance;
    }
    return this.stripe;
  }

  getProviderName(): PaymentProviderType {
    return 'STRIPE';
  }

  async createCustomer(email: string, name: string, phone?: string): Promise<CustomerResponse> {
    const stripe = await this.getStripeInstance();
    const customer = await stripe.customers.create({
      email,
      name,
      phone,
      metadata: {
        source: 'infographic-ai',
      },
    });

    return {
      id: customer.id,
      email: customer.email || email,
      name: customer.name || name,
      provider: 'STRIPE',
    };
  }

  async createPlan(params: CreatePlanParams): Promise<PlanResponse> {
    const stripe = await this.getStripeInstance();
    
    // Stripe uses Products + Prices instead of Plans
    const product = await stripe.products.create({
      name: params.name,
      description: params.description,
    });

    // Convert period to Stripe interval
    const intervalMap: Record<string, string> = {
      daily: 'day',
      weekly: 'week',
      monthly: 'month',
      yearly: 'year',
    };

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: params.amount, // Stripe uses cents
      currency: params.currency.toLowerCase(),
      recurring: {
        interval: intervalMap[params.period] || 'month',
        interval_count: params.interval,
      },
    });

    return {
      id: price.id,
      name: params.name,
      amount: params.amount,
      currency: params.currency,
      interval: `${params.interval} ${params.period}`,
      provider: 'STRIPE',
    };
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResponse> {
    const stripe = await this.getStripeInstance();
    
    // Create subscription with Stripe
    const subscription = await stripe.subscriptions.create({
      customer: params.customerId,
      items: [
        {
          price: params.planId,
          quantity: params.quantity || 1,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        source: 'infographic-ai',
      },
    });

    const currentPeriodStart = new Date(subscription.current_period_start * 1000);
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

    return {
      id: subscription.id,
      customerId: subscription.customer as string,
      planId: params.planId,
      status: this.mapStripeStatus(subscription.status),
      currentPeriodStart,
      currentPeriodEnd,
      amount: subscription.items?.data[0]?.price?.unit_amount || 0,
      currency: (subscription.items?.data[0]?.price?.currency || 'usd').toUpperCase(),
      provider: 'STRIPE',
      // For Stripe Checkout, you'd generate a checkout session URL
      shortUrl: undefined,
    };
  }

  /**
   * Create a Stripe Checkout Session for subscription
   * This is the preferred way to collect payment details for subscriptions
   */
  async createCheckoutSession(params: {
    priceId: string;
    customerId?: string;
    customerEmail?: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; url: string }> {
    const stripe = await this.getStripeInstance();
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: params.customerId,
      customer_email: params.customerId ? undefined : params.customerEmail,
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        source: 'infographic-ai',
      },
    });

    return {
      sessionId: session.id,
      url: session.url || '',
    };
  }

  async fetchSubscription(subscriptionId: string): Promise<SubscriptionResponse> {
    const stripe = await this.getStripeInstance();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const currentPeriodStart = new Date(subscription.current_period_start * 1000);
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

    return {
      id: subscription.id,
      customerId: subscription.customer as string,
      planId: subscription.items?.data[0]?.price?.id || '',
      status: this.mapStripeStatus(subscription.status),
      currentPeriodStart,
      currentPeriodEnd,
      amount: subscription.items?.data[0]?.price?.unit_amount || 0,
      currency: (subscription.items?.data[0]?.price?.currency || 'usd').toUpperCase(),
      provider: 'STRIPE',
    };
  }

  async updateSubscription(
    subscriptionId: string,
    params: UpdateSubscriptionParams,
  ): Promise<SubscriptionResponse> {
    const stripe = await this.getStripeInstance();
    
    const updateParams: any = {};
    
    if (params.planId) {
      // For plan changes, update the subscription item
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      updateParams.items = [
        {
          id: subscription.items?.data[0]?.id,
          price: params.planId,
          quantity: params.quantity,
        },
      ];
      
      // Proration behavior
      if (params.scheduleChangeAt === 'cycle_end') {
        updateParams.proration_behavior = 'none';
        updateParams.billing_cycle_anchor = 'unchanged';
      } else {
        updateParams.proration_behavior = 'create_prorations';
      }
    }

    const updated = await stripe.subscriptions.update(subscriptionId, updateParams);

    return {
      id: updated.id,
      customerId: updated.customer as string,
      planId: updated.items?.data[0]?.price?.id || '',
      status: this.mapStripeStatus(updated.status),
      currentPeriodStart: new Date(updated.current_period_start * 1000),
      currentPeriodEnd: new Date(updated.current_period_end * 1000),
      amount: updated.items?.data[0]?.price?.unit_amount || 0,
      currency: (updated.items?.data[0]?.price?.currency || 'usd').toUpperCase(),
      provider: 'STRIPE',
    };
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelAtCycleEnd: boolean = true,
  ): Promise<SubscriptionResponse> {
    const stripe = await this.getStripeInstance();
    
    let subscription;
    if (cancelAtCycleEnd) {
      // Cancel at end of billing period
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      // Immediate cancellation
      subscription = await stripe.subscriptions.cancel(subscriptionId);
    }

    return {
      id: subscription.id,
      customerId: subscription.customer as string,
      planId: subscription.items?.data[0]?.price?.id || '',
      status: this.mapStripeStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      amount: subscription.items?.data[0]?.price?.unit_amount || 0,
      currency: (subscription.items?.data[0]?.price?.currency || 'usd').toUpperCase(),
      provider: 'STRIPE',
    };
  }

  async fetchPayment(paymentId: string): Promise<PaymentResponse> {
    const stripe = await this.getStripeInstance();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency.toUpperCase(),
      status: this.mapPaymentStatus(paymentIntent.status),
      method: paymentIntent.payment_method_types?.[0],
      provider: 'STRIPE',
    };
  }

  async refundPayment(paymentId: string, amount?: number): Promise<RefundResponse> {
    const stripe = await this.getStripeInstance();
    const refund = await stripe.refunds.create({
      payment_intent: paymentId,
      amount: amount, // undefined = full refund
    });

    return {
      id: refund.id,
      paymentId: refund.payment_intent as string,
      amount: refund.amount,
      status: refund.status || 'pending',
      provider: 'STRIPE',
    };
  }

  async fetchInvoice(invoiceId: string): Promise<InvoiceResponse> {
    const stripe = await this.getStripeInstance();
    const invoice = await stripe.invoices.retrieve(invoiceId);

    return {
      id: invoice.id,
      amount: invoice.total,
      amountPaid: invoice.amount_paid,
      amountDue: invoice.amount_due,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status || 'draft',
      provider: 'STRIPE',
    };
  }

  verifyWebhookSignature(webhookBody: string, signature: string, secret: string): boolean {
    try {
      // Stripe uses a specific signature format: t=timestamp,v1=signature
      const parts = signature.split(',');
      const timestampPart = parts.find(p => p.startsWith('t='));
      const signaturePart = parts.find(p => p.startsWith('v1='));
      
      if (!timestampPart || !signaturePart) {
        return false;
      }

      const timestamp = timestampPart.split('=')[1];
      const expectedSignature = signaturePart.split('=')[1];

      // Construct the signed payload
      const signedPayload = `${timestamp}.${webhookBody}`;
      
      // Compute expected signature
      const computedSignature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload)
        .digest('hex');

      // Constant-time comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(computedSignature)
      );
    } catch (error) {
      console.error('Stripe webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Map Stripe subscription status to our internal status
   */
  private mapStripeStatus(status: string): string {
    const statusMap: Record<string, string> = {
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      canceled: 'CANCELLED',
      unpaid: 'UNPAID',
      incomplete: 'PENDING',
      incomplete_expired: 'EXPIRED',
      trialing: 'TRIALING',
      paused: 'PAUSED',
    };
    return statusMap[status] || status.toUpperCase();
  }

  /**
   * Map Stripe payment intent status
   */
  private mapPaymentStatus(status: string): string {
    const statusMap: Record<string, string> = {
      succeeded: 'CAPTURED',
      processing: 'PROCESSING',
      requires_payment_method: 'FAILED',
      requires_confirmation: 'PENDING',
      requires_action: 'PENDING',
      canceled: 'CANCELLED',
    };
    return statusMap[status] || status.toUpperCase();
  }

  /**
   * Get Stripe publishable key for frontend
   */
  getPublishableKey(): string {
    return this.publishableKey;
  }
}

export const stripeProvider = new StripeProvider();
