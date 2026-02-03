import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PaymentProvider, SubscriptionStatus, PaymentStatus, PlanTier } from '@prisma/client';
import { SubscriptionStorageService } from './subscription-storage.service';
import { PLAN_CONFIG } from '@shared/schema';

const DEBUG_LOG_PATH = path.join(__dirname, '../../../../..', '.cursor', 'debug.log');
function debugLog(location: string, message: string, data: object, hypothesisId: string) {
  try {
    fs.appendFileSync(DEBUG_LOG_PATH, JSON.stringify({ location, message, data, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId }) + '\n');
  } catch (_) {}
}
// Import payment provider factory from server directory
import { paymentProviderFactory } from '../../../../../server/payments/providers/payment-provider.factory';
import type { PaymentProviderType } from '../../../../../server/payments/interfaces/payment-provider.interface';

/** Shape of plan env var names per tier: monthly, annual, and default (optional fallback) */
type PlanKeysByTier = Record<PlanTier, { monthly: string; annual: string; default: string }>;

/** Razorpay env var names per tier: _MONTHLY, _ANNUAL, and default (optional) */
const RAZORPAY_PLAN_KEYS: PlanKeysByTier = {
  FREE: { monthly: '', annual: '', default: '' },
  SOLO: {
    monthly: 'RAZORPAY_PLAN_SOLO_MONTHLY',
    annual: 'RAZORPAY_PLAN_SOLO_ANNUAL',
    default: 'RAZORPAY_PLAN_SOLO',
  },
  TEAM: {
    monthly: 'RAZORPAY_PLAN_TEAM_MONTHLY',
    annual: 'RAZORPAY_PLAN_TEAM_ANNUAL',
    default: 'RAZORPAY_PLAN_TEAM',
  },
  BROKERAGE: {
    monthly: 'RAZORPAY_PLAN_BROKERAGE_MONTHLY',
    annual: 'RAZORPAY_PLAN_BROKERAGE_ANNUAL',
    default: 'RAZORPAY_PLAN_BROKERAGE',
  },
  API_STARTER: {
    monthly: 'RAZORPAY_PLAN_API_STARTER',
    annual: 'RAZORPAY_PLAN_API_STARTER',
    default: 'RAZORPAY_PLAN_API_STARTER',
  },
  API_GROWTH: {
    monthly: 'RAZORPAY_PLAN_API_GROWTH',
    annual: 'RAZORPAY_PLAN_API_GROWTH',
    default: 'RAZORPAY_PLAN_API_GROWTH',
  },
  API_ENTERPRISE: { monthly: '', annual: '', default: '' },
};

/** Stripe env var names per tier: _MONTHLY, _ANNUAL, and default (optional) */
const STRIPE_PLAN_KEYS: PlanKeysByTier = {
  FREE: { monthly: '', annual: '', default: '' },
  SOLO: {
    monthly: 'STRIPE_PLAN_SOLO_MONTHLY',
    annual: 'STRIPE_PLAN_SOLO_ANNUAL',
    default: 'STRIPE_PLAN_SOLO',
  },
  TEAM: {
    monthly: 'STRIPE_PLAN_TEAM_MONTHLY',
    annual: 'STRIPE_PLAN_TEAM_ANNUAL',
    default: 'STRIPE_PLAN_TEAM',
  },
  BROKERAGE: {
    monthly: 'STRIPE_PLAN_BROKERAGE_MONTHLY',
    annual: 'STRIPE_PLAN_BROKERAGE_ANNUAL',
    default: 'STRIPE_PLAN_BROKERAGE',
  },
  API_STARTER: {
    monthly: 'STRIPE_PLAN_API_STARTER',
    annual: 'STRIPE_PLAN_API_STARTER',
    default: 'STRIPE_PLAN_API_STARTER',
  },
  API_GROWTH: {
    monthly: 'STRIPE_PLAN_API_GROWTH',
    annual: 'STRIPE_PLAN_API_GROWTH',
    default: 'STRIPE_PLAN_API_GROWTH',
  },
  API_ENTERPRISE: { monthly: '', annual: '', default: '' },
};

@Injectable()
export class PaymentsService {
  /** Fallback plan IDs from env (used when provider plan keys have no value) */
  private PLAN_IDS: Record<PlanTier, Record<PaymentProviderType, string>> = {
    FREE: { RAZORPAY: '', STRIPE: '', PADDLE: '', PAYPAL: '' },
    SOLO: {
      RAZORPAY: process.env.RAZORPAY_PLAN_SOLO || 'plan_solo',
      STRIPE: process.env.STRIPE_PLAN_SOLO || '',
      PADDLE: '',
      PAYPAL: '',
    },
    TEAM: {
      RAZORPAY: process.env.RAZORPAY_PLAN_TEAM || 'plan_team',
      STRIPE: process.env.STRIPE_PLAN_TEAM || '',
      PADDLE: '',
      PAYPAL: '',
    },
    BROKERAGE: {
      RAZORPAY: process.env.RAZORPAY_PLAN_BROKERAGE || 'plan_brokerage',
      STRIPE: process.env.STRIPE_PLAN_BROKERAGE || '',
      PADDLE: '',
      PAYPAL: '',
    },
    API_STARTER: {
      RAZORPAY: process.env.RAZORPAY_PLAN_API_STARTER || 'plan_api_starter',
      STRIPE: process.env.STRIPE_PLAN_API_STARTER || '',
      PADDLE: '',
      PAYPAL: '',
    },
    API_GROWTH: {
      RAZORPAY: process.env.RAZORPAY_PLAN_API_GROWTH || 'plan_api_growth',
      STRIPE: process.env.STRIPE_PLAN_API_GROWTH || '',
      PADDLE: '',
      PAYPAL: '',
    },
    API_ENTERPRISE: {
      RAZORPAY: '',
      STRIPE: '',
      PADDLE: '',
      PAYPAL: '',
    },
  };

  /**
   * Resolve external plan ID for provider. Uses provider-specific plan keys
   * (_MONTHLY/_ANNUAL when set) else falls back to default env var.
   */
  private getExternalPlanId(
    planTier: PlanTier,
    providerName: PaymentProviderType,
    billingPeriod: 'monthly' | 'annual',
  ): string {
    if (providerName === 'RAZORPAY') {
      return this.getPlanIdFromKeys(RAZORPAY_PLAN_KEYS, planTier, billingPeriod, 'RAZORPAY');
    }
    if (providerName === 'STRIPE') {
      return this.getPlanIdFromKeys(STRIPE_PLAN_KEYS, planTier, billingPeriod, 'STRIPE');
    }
    return this.PLAN_IDS[planTier][providerName] || '';
  }

  private getPlanIdFromKeys(
    planKeys: PlanKeysByTier,
    planTier: PlanTier,
    billingPeriod: 'monthly' | 'annual',
    provider: PaymentProviderType,
  ): string {
    const keys = planKeys[planTier];
    const envVarsToTry =
      billingPeriod === 'annual' ? [keys.annual, keys.default] : [keys.monthly, keys.default];
    for (const envVar of envVarsToTry) {
      if (envVar && process.env[envVar]) return process.env[envVar] as string;
    }
    return this.PLAN_IDS[planTier][provider] || '';
  }

  constructor(
    @Inject(SubscriptionStorageService) private readonly storage: SubscriptionStorageService,
  ) {
    // #region agent log
    debugLog('payments.service.ts:constructor', 'PaymentsService constructed', { hasStorage: !!this.storage, storageType: typeof this.storage }, 'A');
    // #endregion
  }

  /**
   * Calculate annual price with 15% discount
   */
  calculateAnnualPrice(monthlyPrice: number): number {
    const annualPrice = monthlyPrice * 12;
    return Math.round(annualPrice * 0.85); // 15% discount
  }

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
    billingPeriod: 'monthly' | 'annual' = 'monthly',
  ): Promise<{
    subscription: any;
    providerSubscription: any;
    provider: PaymentProviderType;
    shortUrl?: string;
    checkoutUrl?: string;
  }> {
    // #region agent log
    debugLog('payments.service.ts:createSubscription', 'createSubscription entry', { userId, planTier, hasStorage: !!this.storage, storageType: typeof this.storage }, 'B');
    // #endregion
    if (!this.storage) {
      throw new BadRequestException(
        'PaymentsService: SubscriptionStorageService not injected. Check PaymentsModule providers.',
      );
    }
    // #region agent log
    debugLog('payments.service.ts:beforeGetUser', 'about to call storage.getUser', { hasStorage: !!this.storage, userId }, 'C');
    // #endregion
    // Get user from database
    let user = await this.storage.getUser(userId);
    // #region agent log
    debugLog('payments.service.ts:afterGetUser', 'storage.getUser returned', { hasUser: !!user, userId }, 'C');
    // #endregion
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const planConfig = PLAN_CONFIG[planTier];
    if (planConfig.price === 0) {
      throw new BadRequestException('Cannot create subscription for free plan');
    }

    // Calculate price based on billing period
    let finalPrice = planConfig.price;
    if (billingPeriod === 'annual') {
      finalPrice = this.calculateAnnualPrice(planConfig.price);
    }

    // Get appropriate provider based on currency/region
    const provider = paymentProviderFactory.getProviderByCurrency(currency) || paymentProviderFactory.getProvider(region);
    const providerName = provider.getProviderName() as PaymentProviderType;
    // #region agent log
    debugLog('payments.service.ts:afterGetProvider', 'provider resolved', { providerName, currency, region }, 'B');
    // #endregion

    // Get provider-specific plan ID (for Razorpay: use _MONTHLY/_ANNUAL when set, else default)
    const externalPlanId = this.getExternalPlanId(planTier, providerName, billingPeriod);
    // #region agent log
    debugLog('payments.service.ts:externalPlanId', 'external plan id', { externalPlanId, planTier, billingPeriod }, 'B');
    // #endregion
    if (!externalPlanId) {
      throw new BadRequestException(`Plan ${planTier} not configured for ${providerName}`);
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
      // #region agent log
      debugLog('payments.service.ts:beforeCreateCustomer', 'calling provider.createCustomer', { email: user.email }, 'C');
      // #endregion
      let customer: { id: string };
      try {
        customer = await provider.createCustomer(user.email, user.name || user.email);
      } catch (createCustomerErr: any) {
        debugLog('payments.service.ts:createCustomerFailed', 'provider.createCustomer threw', {
          errorMessage: createCustomerErr?.message,
          errorDescription: createCustomerErr?.error?.description ?? createCustomerErr?.description,
          responseData: createCustomerErr?.response?.data,
        }, 'C');
        throw createCustomerErr;
      }
      externalCustomerId = customer.id;

      // Update user with customer ID
      const updateData: Partial<{
        razorpayCustomerId: string;
        stripeCustomerId: string;
        paddleCustomerId: string;
      }> = {};
      if (providerName === 'RAZORPAY') {
        updateData.razorpayCustomerId = externalCustomerId;
      } else if (providerName === 'STRIPE') {
        updateData.stripeCustomerId = externalCustomerId;
      } else if (providerName === 'PADDLE') {
        updateData.paddleCustomerId = externalCustomerId;
      }

      await this.storage.updateUser(userId, updateData);
    }

    // For Stripe, use Checkout Sessions instead of direct subscription creation
    let checkoutUrl: string | undefined;
    let providerSubscription: any;

    if (providerName === 'STRIPE') {
      // #region agent log
      debugLog('payments.service.ts:beforeStripeCheckout', 'calling createCheckoutSession', { externalPlanId, externalCustomerId }, 'D');
      // #endregion
      // Import StripeProvider to use createCheckoutSession
      const { StripeProvider } = await import('../../../../../server/payments/providers/stripe.provider');
      const stripeProvider = new StripeProvider();

      // Use Stripe Checkout Session for a hosted checkout experience
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      let checkout: { sessionId: string; url: string };
      try {
        checkout = await stripeProvider.createCheckoutSession({
          priceId: externalPlanId,
          customerId: externalCustomerId,
          successUrl: successUrl || `${baseUrl}/dashboard?payment=success`,
          cancelUrl: cancelUrl || `${baseUrl}/pricing?payment=cancelled`,
        });
      } catch (stripeErr: any) {
        debugLog('payments.service.ts:stripeCheckoutFailed', 'createCheckoutSession threw', {
          errorMessage: stripeErr?.message,
          code: stripeErr?.code,
          raw: stripeErr?.raw?.message,
        }, 'D');
        throw stripeErr;
      }

      checkoutUrl = checkout.url;

      // Create a placeholder subscription - it will be confirmed via webhook
      providerSubscription = {
        id: checkout.sessionId,
        customerId: externalCustomerId,
        planId: externalPlanId,
        status: 'PENDING',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
        amount: finalPrice * 100,
        currency: currency,
        provider: 'STRIPE',
      };
    } else {
      // #region agent log
      debugLog('payments.service.ts:beforeRazorpaySubscription', 'calling provider.createSubscription', { externalPlanId, externalCustomerId }, 'D');
      // #endregion
      try {
        providerSubscription = await provider.createSubscription({
          planId: externalPlanId,
          customerId: externalCustomerId,
          totalCount: billingPeriod === 'annual' ? 1 : 12, // 1 year or 12 months
          quantity: 1,
          notify: true,
        });
      } catch (razorpayErr: any) {
        debugLog('payments.service.ts:razorpaySubscriptionFailed', 'provider.createSubscription threw', {
          errorMessage: razorpayErr?.message,
          errorDescription: razorpayErr?.error?.description ?? razorpayErr?.description,
          responseData: razorpayErr?.response?.data,
        }, 'D');
        throw razorpayErr;
      }
    }

    // Create subscription record in database
    const subscriptionId = randomUUID();
    const now = new Date();
    // #region agent log
    debugLog('payments.service.ts:beforeStorageCreate', 'calling storage.createSubscription', {
      subscriptionId,
      externalSubscriptionId: providerSubscription.id,
      providerName,
    }, 'E');
    // #endregion
    let subscription: any;
    try {
      subscription = await this.storage.createSubscription({
      id: subscriptionId,
      userId,
      organizationId: user.organizationId,
      paymentProvider: providerName as PaymentProvider,
      externalSubscriptionId: providerSubscription.id,
      externalPlanId: externalPlanId,
      externalCustomerId: externalCustomerId,
      planTier,
      status: SubscriptionStatus.ACTIVE, // Will be updated via webhook for both providers
      currentPeriodStart: providerSubscription.currentPeriodStart,
      currentPeriodEnd: providerSubscription.currentPeriodEnd,
      amount: finalPrice * 100, // Convert to paise/cents
      currency,
      cancelAtPeriodEnd: false,
      cancelledAt: null,
    });
    } catch (storageErr: any) {
      debugLog('payments.service.ts:storageCreateFailed', 'storage.createSubscription threw', {
        errorMessage: storageErr?.message,
        code: storageErr?.code,
      }, 'E');
      throw storageErr;
    }

    // Update organization plan if user has one
    if (user.organizationId) {
      await this.storage.updateOrganization(user.organizationId, {
        planTier: planTier,
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
  async getCurrentSubscription(userId: string) {
    return this.storage.getActiveSubscriptionByUserId(userId);
  }

  /**
   * Upgrade/downgrade subscription plan
   */
  async updateSubscriptionPlan(userId: string, newPlanTier: PlanTier) {
    const currentSubscription = await this.getCurrentSubscription(userId);
    if (!currentSubscription) {
      throw new NotFoundException('No active subscription found');
    }

    const newPlanConfig = PLAN_CONFIG[newPlanTier];
    const providerName = currentSubscription.paymentProvider as PaymentProviderType;

    // Get new plan ID for this provider
    const newExternalPlanId = this.PLAN_IDS[newPlanTier][providerName];
    if (!newExternalPlanId) {
      throw new BadRequestException(`Plan ${newPlanTier} not configured for ${providerName}`);
    }

    // Get provider and update subscription
    const provider = paymentProviderFactory.getProvider(null, providerName);
    await provider.updateSubscription(currentSubscription.externalSubscriptionId, {
      planId: newExternalPlanId,
      scheduleChangeAt: 'cycle_end',
    });

    // Update in database
    const updatedSubscription = await this.storage.updateSubscription(currentSubscription.id, {
      planTier: newPlanTier,
      externalPlanId: newExternalPlanId,
      amount: newPlanConfig.price * 100,
    });

    if (!updatedSubscription) {
      throw new BadRequestException('Failed to update subscription');
    }

    // Update organization plan
    if (currentSubscription.organizationId) {
      await this.storage.updateOrganization(currentSubscription.organizationId, {
        planTier: newPlanTier,
        monthlyLimit: newPlanConfig.limit,
      });
    }

    return updatedSubscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, immediate: boolean = false) {
    const subscription = await this.getCurrentSubscription(userId);
    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    // Get provider and cancel
    const provider = paymentProviderFactory.getProvider(null, subscription.paymentProvider as PaymentProviderType);
    await provider.cancelSubscription(subscription.externalSubscriptionId, !immediate); // cancelAtCycleEnd

    // Update in database
    const updatedSubscription = await this.storage.updateSubscription(subscription.id, {
      status: immediate ? SubscriptionStatus.CANCELLED : SubscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: !immediate,
      cancelledAt: immediate ? new Date() : null,
    });

    if (!updatedSubscription) {
      throw new BadRequestException('Failed to cancel subscription');
    }

    // Downgrade organization to FREE if immediate cancellation
    if (immediate && subscription.organizationId) {
      await this.storage.updateOrganization(subscription.organizationId, {
        planTier: 'FREE',
        monthlyLimit: 3,
        activeSubscriptionId: null,
      });
    }

    return updatedSubscription;
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(userId: string) {
    return this.storage.getPaymentsByUserId(userId);
  }

  /**
   * Verify RazorPay payment signature
   */
  async verifyPayment(
    razorpayPaymentId: string,
    razorpaySubscriptionId: string,
    razorpaySignature: string,
  ): Promise<boolean> {
    const provider = paymentProviderFactory.getProvider(null, 'RAZORPAY');
    const isValid = provider.verifyPaymentSignature?.(
      razorpaySubscriptionId,
      razorpayPaymentId,
      razorpaySignature,
    );
    return isValid || false;
  }

  /**
   * Get provider info for frontend
   */
  getProviderInfo(currency?: string, region?: string) {
    return paymentProviderFactory.getProviderInfo(currency, region);
  }

  /**
   * Get available plans
   */
  getAvailablePlans() {
    return Object.entries(PLAN_CONFIG).map(([tier, config]) => ({
      tier,
      ...config,
    }));
  }

  // ==========================================
  // WEBHOOK HANDLERS (Called from Express webhook routes)
  // ==========================================

  /**
   * Handle subscription activated webhook
   */
  async handleSubscriptionActivated(event: any, provider: PaymentProviderType): Promise<void> {
    const externalSubId = this.extractSubscriptionId(event, provider);
    const subscription = await this.storage.getSubscriptionByExternalId(externalSubId, provider as PaymentProvider);

    if (subscription) {
      await this.storage.updateSubscription(subscription.id, { status: SubscriptionStatus.ACTIVE });
    }
  }

  /**
   * Handle subscription charged webhook (payment success)
   */
  async handleSubscriptionCharged(event: any, provider: PaymentProviderType): Promise<void> {
    const externalSubId = this.extractSubscriptionId(event, provider);
    const paymentData = this.extractPaymentData(event, provider);

    // Find subscription
    const subscription = await this.storage.getSubscriptionByExternalId(externalSubId, provider as PaymentProvider);
    if (!subscription) return;

    // Check for duplicate payment (idempotency)
    const existingPayment = await this.storage.getPaymentByExternalId(paymentData.id, provider as PaymentProvider);
    if (existingPayment) {
      console.log('Payment already processed, skipping');
      return;
    }

    // Create payment record
    const paymentId = randomUUID();
    await this.storage.createPayment({
      id: paymentId,
      userId: subscription.userId,
      subscriptionId: subscription.id,
      paymentProvider: provider as PaymentProvider,
      externalPaymentId: paymentData.id,
      externalOrderId: paymentData.orderId || null,
      externalInvoiceId: null,
      signature: null,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: PaymentStatus.CAPTURED,
      method: paymentData.method || null,
      errorCode: null,
      errorDescription: null,
    });

    // Update subscription period
    await this.storage.updateSubscription(subscription.id, {
      currentPeriodStart: paymentData.periodStart,
      currentPeriodEnd: paymentData.periodEnd,
    });

    // Reset organization usage if applicable
    if (subscription.organizationId) {
      const org = await this.storage.getOrganization(subscription.organizationId);
      if (org) {
        // Note: Usage count reset should be handled by a separate service
        // This is just updating the subscription
      }
    }
  }

  /**
   * Handle subscription cancelled webhook
   */
  async handleSubscriptionCancelled(event: any, provider: PaymentProviderType): Promise<void> {
    const externalSubId = this.extractSubscriptionId(event, provider);
    const subscription = await this.storage.getSubscriptionByExternalId(externalSubId, provider as PaymentProvider);

    if (!subscription) return;

    await this.storage.updateSubscription(subscription.id, {
      status: SubscriptionStatus.CANCELLED,
      cancelledAt: new Date(),
    });

    // Downgrade organization to FREE
    if (subscription.organizationId) {
      await this.storage.updateOrganization(subscription.organizationId, {
        planTier: 'FREE',
        monthlyLimit: 3,
        activeSubscriptionId: null,
      });
    }
  }

  /**
   * Handle payment failed webhook
   */
  async handlePaymentFailed(event: any, provider: PaymentProviderType): Promise<void> {
    const paymentData = this.extractPaymentData(event, provider);
    const subscription = await this.storage.getSubscriptionByExternalId(
      paymentData.subscriptionId || '',
      provider as PaymentProvider,
    );

    if (!subscription) return;

    // Record failed payment
    const paymentId = randomUUID();
    await this.storage.createPayment({
      id: paymentId,
      userId: subscription.userId,
      subscriptionId: subscription.id,
      paymentProvider: provider as PaymentProvider,
      externalPaymentId: paymentData.id,
      externalOrderId: paymentData.orderId || null,
      externalInvoiceId: null,
      signature: null,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: PaymentStatus.FAILED,
      method: paymentData.method || null,
      errorCode: paymentData.errorCode || null,
      errorDescription: paymentData.errorDescription || null,
    });

    // Update subscription status
    await this.storage.updateSubscription(subscription.id, { status: SubscriptionStatus.PAST_DUE });
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  private extractSubscriptionId(event: any, provider: PaymentProviderType): string {
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

  private extractPaymentData(event: any, provider: PaymentProviderType): {
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
