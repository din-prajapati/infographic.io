import { randomUUID } from 'crypto';
import { 
  PLAN_CONFIG,
  type PlanTier,
  type PaymentProvider,
  type Subscription,
  type Payment,
} from '@shared/schema';
import { paymentProviderFactory } from '../providers/payment-provider.factory';

/**
 * In-Memory Storage for Payment Data
 * This is used when no database connection is available
 * Replace with actual database operations in production
 */
class PaymentStorage {
  private users: Map<string, {
    id: string;
    email: string;
    name: string | null;
    organizationId: string | null;
    razorpayCustomerId: string | null;
    stripeCustomerId: string | null;
    paddleCustomerId: string | null;
  }> = new Map();
  
  private subscriptions: Map<string, Subscription> = new Map();
  private payments: Map<string, Payment> = new Map();
  private organizations: Map<string, {
    id: string;
    plan: string;
    monthlyLimit: number;
    usageCount: number;
    activeSubscriptionId: string | null;
  }> = new Map();

  // User operations
  getUser(id: string) {
    return this.users.get(id) || null;
  }

  createUser(user: { id: string; email: string; name?: string }) {
    const newUser = {
      id: user.id,
      email: user.email,
      name: user.name || null,
      organizationId: null,
      razorpayCustomerId: null,
      stripeCustomerId: null,
      paddleCustomerId: null,
    };
    this.users.set(user.id, newUser);
    return newUser;
  }

  updateUser(id: string, data: Partial<{ razorpayCustomerId: string; stripeCustomerId: string; paddleCustomerId: string }>) {
    const user = this.users.get(id);
    if (user) {
      Object.assign(user, data);
      this.users.set(id, user);
    }
    return user;
  }

  // Subscription operations
  getSubscription(id: string): Subscription | null {
    return this.subscriptions.get(id) || null;
  }

  getActiveSubscriptionByUserId(userId: string): Subscription | null {
    for (const sub of this.subscriptions.values()) {
      if (sub.userId === userId && sub.status === 'ACTIVE') {
        return sub;
      }
    }
    return null;
  }

  getSubscriptionByExternalId(externalId: string, provider: PaymentProvider): Subscription | null {
    for (const sub of this.subscriptions.values()) {
      if (sub.externalSubscriptionId === externalId && sub.paymentProvider === provider) {
        return sub;
      }
    }
    return null;
  }

  createSubscription(data: Subscription): Subscription {
    this.subscriptions.set(data.id, data);
    return data;
  }

  updateSubscription(id: string, data: Partial<Subscription>): Subscription | null {
    const sub = this.subscriptions.get(id);
    if (sub) {
      const updated = { ...sub, ...data, updatedAt: new Date() } as Subscription;
      this.subscriptions.set(id, updated);
      return updated;
    }
    return null;
  }

  // Payment operations
  getPaymentByExternalId(externalId: string, provider: PaymentProvider): Payment | null {
    for (const payment of this.payments.values()) {
      if (payment.externalPaymentId === externalId && payment.paymentProvider === provider) {
        return payment;
      }
    }
    return null;
  }

  createPayment(data: Payment): Payment {
    this.payments.set(data.id, data);
    return data;
  }

  getPaymentsByUserId(userId: string): Payment[] {
    const userPayments: Payment[] = [];
    for (const payment of this.payments.values()) {
      if (payment.userId === userId) {
        userPayments.push(payment);
      }
    }
    return userPayments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Organization operations
  getOrganization(id: string) {
    return this.organizations.get(id) || null;
  }

  updateOrganization(id: string, data: Partial<{ plan: string; monthlyLimit: number; usageCount: number; activeSubscriptionId: string | null }>) {
    const org = this.organizations.get(id) || { id, plan: 'FREE', monthlyLimit: 3, usageCount: 0, activeSubscriptionId: null };
    Object.assign(org, data);
    this.organizations.set(id, org);
    return org;
  }
}

const paymentStorage = new PaymentStorage();

/**
 * Subscription Service
 * Provider-agnostic business logic for subscription management
 * Uses in-memory storage for demonstration; replace with actual DB in production
 */
export class SubscriptionService {
  
  // Provider plan IDs - configure these in your payment provider dashboard
  private PLAN_IDS: Record<PlanTier, Record<PaymentProvider, string>> = {
    FREE: { RAZORPAY: '', STRIPE: '', PADDLE: '', PAYPAL: '' },
    SOLO: { 
      RAZORPAY: process.env.RAZORPAY_PLAN_SOLO || 'plan_solo', 
      STRIPE: process.env.STRIPE_PLAN_SOLO || '', 
      PADDLE: '', 
      PAYPAL: '' 
    },
    TEAM: { 
      RAZORPAY: process.env.RAZORPAY_PLAN_TEAM || 'plan_team', 
      STRIPE: process.env.STRIPE_PLAN_TEAM || '', 
      PADDLE: '', 
      PAYPAL: '' 
    },
    BROKERAGE: { 
      RAZORPAY: process.env.RAZORPAY_PLAN_BROKERAGE || 'plan_brokerage', 
      STRIPE: process.env.STRIPE_PLAN_BROKERAGE || '', 
      PADDLE: '', 
      PAYPAL: '' 
    },
    API_STARTER: { 
      RAZORPAY: process.env.RAZORPAY_PLAN_API_STARTER || 'plan_api_starter', 
      STRIPE: process.env.STRIPE_PLAN_API_STARTER || '', 
      PADDLE: '', 
      PAYPAL: '' 
    },
    API_GROWTH: { 
      RAZORPAY: process.env.RAZORPAY_PLAN_API_GROWTH || 'plan_api_growth', 
      STRIPE: process.env.STRIPE_PLAN_API_GROWTH || '', 
      PADDLE: '', 
      PAYPAL: '' 
    },
    API_ENTERPRISE: { 
      RAZORPAY: '', 
      STRIPE: '', 
      PADDLE: '', 
      PAYPAL: '' 
    },
  };

  /**
   * Create a new subscription for a user
   */
  async createSubscription(
    userId: string,
    planTier: PlanTier,
    currency: string = 'INR',
    region?: string,
    successUrl?: string,
    cancelUrl?: string,
  ): Promise<{
    subscription: Subscription;
    providerSubscription: any;
    provider: PaymentProvider;
    shortUrl?: string;
    checkoutUrl?: string;
  }> {
    // Get or create user (in-memory for demo)
    let user = paymentStorage.getUser(userId);
    if (!user) {
      user = paymentStorage.createUser({ 
        id: userId, 
        email: `user_${userId}@example.com`,
        name: 'Demo User' 
      });
    }

    const planConfig = PLAN_CONFIG[planTier];
    if (planConfig.price === 0) {
      throw new Error('Cannot create subscription for free plan');
    }

    // Get appropriate provider based on region
    const provider = paymentProviderFactory.getProvider(region);
    const providerName = provider.getProviderName() as PaymentProvider;

    // Get provider-specific plan ID
    const externalPlanId = this.PLAN_IDS[planTier][providerName];
    if (!externalPlanId) {
      throw new Error(`Plan ${planTier} not configured for ${providerName}`);
    }

    // Get or create customer ID for this provider
    let externalCustomerId: string | null = null;
    if (providerName === 'RAZORPAY') {
      externalCustomerId = user.razorpayCustomerId;
    } else if (providerName === 'STRIPE') {
      externalCustomerId = user.stripeCustomerId;
    } else if (providerName === 'PADDLE') {
      externalCustomerId = user.paddleCustomerId;
    }

    if (!externalCustomerId) {
      const customer = await provider.createCustomer(user.email, user.name || user.email);
      externalCustomerId = customer.id;

      // Update user with customer ID
      const updateData: Record<string, string> = {};
      if (providerName === 'RAZORPAY') {
        updateData.razorpayCustomerId = externalCustomerId;
      } else if (providerName === 'STRIPE') {
        updateData.stripeCustomerId = externalCustomerId;
      } else if (providerName === 'PADDLE') {
        updateData.paddleCustomerId = externalCustomerId;
      }

      paymentStorage.updateUser(userId, updateData);
    }

    // For Stripe, use Checkout Sessions instead of direct subscription creation
    let checkoutUrl: string | undefined;
    let providerSubscription: any;
    
    if (providerName === 'STRIPE') {
      // Import StripeProvider to use createCheckoutSession
      const { stripeProvider } = await import('../providers/stripe.provider');
      
      // Use Stripe Checkout Session for a hosted checkout experience
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      const checkout = await stripeProvider.createCheckoutSession({
        priceId: externalPlanId,
        customerId: externalCustomerId,
        successUrl: successUrl || `${baseUrl}/dashboard?payment=success`,
        cancelUrl: cancelUrl || `${baseUrl}/pricing?payment=cancelled`,
      });
      
      checkoutUrl = checkout.url;
      
      // Create a placeholder subscription - it will be confirmed via webhook
      providerSubscription = {
        id: checkout.sessionId,
        customerId: externalCustomerId,
        planId: externalPlanId,
        status: 'PENDING',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
        amount: planConfig.price * 100,
        currency: currency,
        provider: 'STRIPE',
      };
    } else {
      // RazorPay flow - use direct subscription creation
      providerSubscription = await provider.createSubscription({
        planId: externalPlanId,
        customerId: externalCustomerId,
        totalCount: 12, // 12 billing cycles
        quantity: 1,
        notify: true,
      });
    }

    // Create subscription record in storage
    const subscriptionId = randomUUID();
    const now = new Date();
    const subscription: Subscription = {
      id: subscriptionId,
      userId,
      organizationId: user.organizationId,
      paymentProvider: providerName,
      externalSubscriptionId: providerSubscription.id,
      externalPlanId: externalPlanId,
      externalCustomerId: externalCustomerId,
      planTier,
      status: 'ACTIVE', // Will be updated via webhook for both providers
      currentPeriodStart: providerSubscription.currentPeriodStart,
      currentPeriodEnd: providerSubscription.currentPeriodEnd,
      amount: planConfig.price * 100, // Convert to paise/cents
      currency,
      cancelAtPeriodEnd: false,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    };
    
    paymentStorage.createSubscription(subscription);

    // Update organization plan if user has one
    if (user.organizationId) {
      paymentStorage.updateOrganization(user.organizationId, {
        plan: planTier,
        monthlyLimit: planConfig.limit,
        activeSubscriptionId: subscription.id,
      });
    }

    return {
      subscription,
      providerSubscription,
      provider: providerName,
      shortUrl: providerSubscription.shortUrl,
      checkoutUrl,
    };
  }

  /**
   * Get current subscription for a user
   */
  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    return paymentStorage.getActiveSubscriptionByUserId(userId);
  }

  /**
   * Upgrade/downgrade subscription plan
   */
  async updateSubscriptionPlan(userId: string, newPlanTier: PlanTier): Promise<Subscription> {
    const currentSubscription = await this.getCurrentSubscription(userId);
    if (!currentSubscription) {
      throw new Error('No active subscription found');
    }

    const newPlanConfig = PLAN_CONFIG[newPlanTier];
    const providerName = currentSubscription.paymentProvider;

    // Get new plan ID for this provider
    const newExternalPlanId = this.PLAN_IDS[newPlanTier][providerName];
    if (!newExternalPlanId) {
      throw new Error(`Plan ${newPlanTier} not configured for ${providerName}`);
    }

    // Get provider and update subscription
    const provider = paymentProviderFactory.getProvider(null, providerName);
    await provider.updateSubscription(currentSubscription.externalSubscriptionId, {
      planId: newExternalPlanId,
      scheduleChangeAt: 'cycle_end',
    });

    // Update in storage
    const updatedSubscription = paymentStorage.updateSubscription(currentSubscription.id, {
      planTier: newPlanTier,
      externalPlanId: newExternalPlanId,
      amount: newPlanConfig.price * 100,
    });

    if (!updatedSubscription) {
      throw new Error('Failed to update subscription');
    }

    return updatedSubscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, immediate: boolean = false): Promise<Subscription> {
    const subscription = await this.getCurrentSubscription(userId);
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Get provider and cancel
    const provider = paymentProviderFactory.getProvider(null, subscription.paymentProvider);
    await provider.cancelSubscription(
      subscription.externalSubscriptionId,
      !immediate, // cancelAtCycleEnd
    );

    // Update in storage
    const updatedSubscription = paymentStorage.updateSubscription(subscription.id, {
      status: immediate ? 'CANCELLED' : 'ACTIVE',
      cancelAtPeriodEnd: !immediate,
      cancelledAt: immediate ? new Date() : null,
    });

    if (!updatedSubscription) {
      throw new Error('Failed to cancel subscription');
    }

    return updatedSubscription;
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(userId: string): Promise<Payment[]> {
    return paymentStorage.getPaymentsByUserId(userId);
  }

  // ==========================================
  // WEBHOOK HANDLERS (Provider-Agnostic)
  // ==========================================

  /**
   * Handle subscription activated webhook
   */
  async handleSubscriptionActivated(event: any, provider: PaymentProvider): Promise<void> {
    const externalSubId = this.extractSubscriptionId(event, provider);
    const subscription = paymentStorage.getSubscriptionByExternalId(externalSubId, provider);
    
    if (subscription) {
      paymentStorage.updateSubscription(subscription.id, { status: 'ACTIVE' });
    }
  }

  /**
   * Handle subscription charged webhook (payment success)
   */
  async handleSubscriptionCharged(event: any, provider: PaymentProvider): Promise<void> {
    const externalSubId = this.extractSubscriptionId(event, provider);
    const paymentData = this.extractPaymentData(event, provider);

    // Find subscription
    const subscription = paymentStorage.getSubscriptionByExternalId(externalSubId, provider);
    if (!subscription) return;

    // Check for duplicate payment (idempotency)
    const existingPayment = paymentStorage.getPaymentByExternalId(paymentData.id, provider);
    if (existingPayment) {
      console.log('Payment already processed, skipping');
      return;
    }

    // Create payment record
    const now = new Date();
    const payment: Payment = {
      id: randomUUID(),
      userId: subscription.userId,
      subscriptionId: subscription.id,
      paymentProvider: provider,
      externalPaymentId: paymentData.id,
      externalOrderId: paymentData.orderId || null,
      externalInvoiceId: null,
      signature: null,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: 'CAPTURED',
      method: paymentData.method || null,
      errorCode: null,
      errorDescription: null,
      createdAt: now,
      updatedAt: now,
    };
    
    paymentStorage.createPayment(payment);

    // Update subscription period
    paymentStorage.updateSubscription(subscription.id, {
      currentPeriodStart: paymentData.periodStart,
      currentPeriodEnd: paymentData.periodEnd,
    });

    // Reset organization usage if applicable
    if (subscription.organizationId) {
      paymentStorage.updateOrganization(subscription.organizationId, {
        usageCount: 0,
      });
    }
  }

  /**
   * Handle subscription cancelled webhook
   */
  async handleSubscriptionCancelled(event: any, provider: PaymentProvider): Promise<void> {
    const externalSubId = this.extractSubscriptionId(event, provider);
    const subscription = paymentStorage.getSubscriptionByExternalId(externalSubId, provider);

    if (!subscription) return;

    paymentStorage.updateSubscription(subscription.id, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    });

    // Downgrade organization to FREE
    if (subscription.organizationId) {
      paymentStorage.updateOrganization(subscription.organizationId, {
        plan: 'FREE',
        monthlyLimit: 3,
        activeSubscriptionId: null,
      });
    }
  }

  /**
   * Handle payment failed webhook
   */
  async handlePaymentFailed(event: any, provider: PaymentProvider): Promise<void> {
    const paymentData = this.extractPaymentData(event, provider);
    const subscription = paymentStorage.getSubscriptionByExternalId(paymentData.subscriptionId || '', provider);

    if (!subscription) return;

    // Record failed payment
    const now = new Date();
    const payment: Payment = {
      id: randomUUID(),
      userId: subscription.userId,
      subscriptionId: subscription.id,
      paymentProvider: provider,
      externalPaymentId: paymentData.id,
      externalOrderId: paymentData.orderId || null,
      externalInvoiceId: null,
      signature: null,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: 'FAILED',
      method: paymentData.method || null,
      errorCode: paymentData.errorCode || null,
      errorDescription: paymentData.errorDescription || null,
      createdAt: now,
      updatedAt: now,
    };
    
    paymentStorage.createPayment(payment);

    // Update subscription status
    paymentStorage.updateSubscription(subscription.id, { status: 'PAST_DUE' });
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  private extractSubscriptionId(event: any, provider: PaymentProvider): string {
    switch (provider) {
      case 'RAZORPAY':
        return event.payload?.subscription?.entity?.id || '';
      case 'STRIPE':
        return event.data?.object?.id || '';
      case 'PADDLE':
        return event.data?.subscription_id || '';
      default:
        return '';
    }
  }

  private extractPaymentData(event: any, provider: PaymentProvider): {
    id: string;
    orderId?: string;
    subscriptionId?: string;
    amount: number;
    currency: string;
    method?: string;
    errorCode?: string;
    errorDescription?: string;
    periodStart: Date;
    periodEnd: Date;
  } {
    switch (provider) {
      case 'RAZORPAY': {
        const payment = event.payload?.payment?.entity || {};
        const subscription = event.payload?.subscription?.entity || {};
        return {
          id: payment.id,
          orderId: payment.order_id,
          subscriptionId: subscription.id,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.method,
          errorCode: payment.error_code,
          errorDescription: payment.error_description,
          periodStart: new Date((subscription.current_start || Date.now() / 1000) * 1000),
          periodEnd: new Date((subscription.current_end || Date.now() / 1000 + 30 * 24 * 60 * 60) * 1000),
        };
      }
      case 'STRIPE': {
        const invoice = event.data?.object || {};
        return {
          id: invoice.payment_intent,
          subscriptionId: invoice.subscription,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          periodStart: new Date((invoice.period_start || Date.now() / 1000) * 1000),
          periodEnd: new Date((invoice.period_end || Date.now() / 1000 + 30 * 24 * 60 * 60) * 1000),
        };
      }
      default:
        return {
          id: '',
          amount: 0,
          currency: 'INR',
          periodStart: new Date(),
          periodEnd: new Date(),
        };
    }
  }
}

export const subscriptionService = new SubscriptionService();
