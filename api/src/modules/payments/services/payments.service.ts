import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PaymentProvider, SubscriptionStatus, PaymentStatus, PlanTier } from '@prisma/client';
import { SubscriptionStorageService } from './subscription-storage.service';
import { PLAN_CONFIG } from '@shared/schema';

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
  private readonly logger = new Logger(PaymentsService.name);

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
  ) {}

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
    if (!this.storage) {
      throw new BadRequestException(
        'PaymentsService: SubscriptionStorageService not injected. Check PaymentsModule providers.',
      );
    }
    // Get user from database
    let user = await this.storage.getUser(userId);
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

    // Get provider-specific plan ID (for Razorpay: use _MONTHLY/_ANNUAL when set, else default)
    const externalPlanId = this.getExternalPlanId(planTier, providerName, billingPeriod);
    if (!externalPlanId) {
      throw new BadRequestException(`Plan ${planTier} not configured for ${providerName}`);
    }

    // PT-03 fix: Cancel any existing active or pending subscription before creating a new one
    const existingSubscription = await this.storage.getCurrentSubscriptionByUserId(userId);
    if (existingSubscription) {
      try {
        const existingProvider = paymentProviderFactory.getProvider(null, existingSubscription.paymentProvider as PaymentProviderType);
        await existingProvider.cancelSubscription(existingSubscription.externalSubscriptionId, false);
        await this.storage.updateSubscription(existingSubscription.id, {
          status: SubscriptionStatus.CANCELLED,
          cancelledAt: new Date(),
        });
      } catch (cancelErr: unknown) {
        const desc = this.providerCancelErrorDescription(cancelErr);
        if (this.isBenignSubscriptionCancelFailure(desc)) {
          this.logger.debug(
            `Prior subscription ${existingSubscription.externalSubscriptionId} not cancelled via API (expected): ${desc}`,
          );
          try {
            await this.storage.updateSubscription(existingSubscription.id, {
              status: SubscriptionStatus.EXPIRED,
              cancelledAt: new Date(),
            });
          } catch (syncErr: unknown) {
            this.logger.warn(
              `Could not sync local subscription to EXPIRED: ${this.providerCancelErrorDescription(syncErr)}`,
            );
          }
        } else {
          this.logger.warn(
            `Failed to cancel existing subscription before upgrade (ext=${existingSubscription.externalSubscriptionId}): ${desc}`,
          );
        }
        // Continue anyway — do not block new subscription creation
      }
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
      let customer: { id: string };
      try {
        customer = await provider.createCustomer(user.email, user.name || user.email);
      } catch (createCustomerErr: any) {
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
      try {
        providerSubscription = await provider.createSubscription({
          planId: externalPlanId,
          customerId: externalCustomerId,
          totalCount: billingPeriod === 'annual' ? 1 : 12, // 1 year or 12 months
          quantity: 1,
          notify: true,
        });
      } catch (razorpayErr: any) {
        throw razorpayErr;
      }
    }

    // Create subscription record in database
    const subscriptionId = randomUUID();
    const now = new Date();
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
      status: SubscriptionStatus.PENDING, // PT-04 fix: stays PENDING until webhook fires
      billingPeriod: billingPeriod === 'annual' ? 'ANNUAL' : 'MONTHLY',
      currentPeriodStart: providerSubscription.currentPeriodStart,
      currentPeriodEnd: providerSubscription.currentPeriodEnd,
      amount: finalPrice * 100, // Convert to paise/cents
      currency,
      cancelAtPeriodEnd: false,
      cancelledAt: null,
    });
    } catch (storageErr: any) {
      throw storageErr;
    }

    // PT-04 fix: Do NOT upgrade org plan here.
    // Org plan is upgraded in handleSubscriptionCharged() on the first successful invoice
    // (subscription.charged). Authenticated-only subs (e.g. UPI mandate, 0 invoices) stay PENDING.

    return {
      subscription,
      providerSubscription,
      provider: providerName,
      shortUrl: providerSubscription.shortUrl,
      checkoutUrl,
    };
  }

  /**
   * Get current subscription for a user.
   * If currentPeriodEnd is epoch/invalid, refreshes from Razorpay and updates DB.
   */
  async getCurrentSubscription(userId: string) {
    const subscription = await this.storage.getCurrentSubscriptionByUserId(userId);
    if (!subscription) return null;

    const periodEndTime = new Date(subscription.currentPeriodEnd).getTime();
    const isEpochOrInvalid = Number.isNaN(periodEndTime) || periodEndTime < 86400000; // Before 2 Jan 1970

    if (isEpochOrInvalid && subscription.paymentProvider === 'RAZORPAY') {
      try {
        const provider = paymentProviderFactory.getProvider(null, 'RAZORPAY');
        const refreshed = await provider.fetchSubscription(subscription.externalSubscriptionId);
        if (refreshed.currentPeriodEnd.getTime() > 86400000) {
          await this.storage.updateSubscription(subscription.id, {
            currentPeriodStart: refreshed.currentPeriodStart,
            currentPeriodEnd: refreshed.currentPeriodEnd,
          });
          return this.storage.getSubscription(subscription.id);
        }
      } catch (err) {
        // Log but don't fail - return existing subscription
        console.warn('Failed to refresh subscription from Razorpay:', err?.message || err);
      }
    }

    return subscription;
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

    const isPending = subscription.status === SubscriptionStatus.PENDING;
    // Unpaid / in-checkout: no billing period to honor — cancel at provider now and clear local row.
    const cancelImmediately = immediate || isPending;

    const provider = paymentProviderFactory.getProvider(null, subscription.paymentProvider as PaymentProviderType);
    try {
      await provider.cancelSubscription(subscription.externalSubscriptionId, !cancelImmediately); // cancelAtCycleEnd
    } catch (providerErr: unknown) {
      const desc = this.providerCancelErrorDescription(providerErr);
      if (this.isBenignSubscriptionCancelFailure(desc)) {
        this.logger.debug(`Provider cancel treated as no-op: ${desc}`);
      } else if (isPending) {
        // Abandoned checkout: still clear local PENDING so Billing/Pricing recover even if Razorpay returns an edge-case error.
        this.logger.warn(
          `PENDING cancel: provider error (${desc}) — syncing local CANCELLED + FREE anyway`,
        );
      } else {
        throw new BadRequestException(desc || 'Failed to cancel subscription with payment provider');
      }
    }

    let updatedSubscription;
    if (cancelImmediately) {
      updatedSubscription = await this.storage.updateSubscription(subscription.id, {
        status: SubscriptionStatus.CANCELLED,
        cancelAtPeriodEnd: false,
        cancelledAt: new Date(),
      });
      if (subscription.organizationId) {
        await this.storage.updateOrganization(subscription.organizationId, {
          planTier: 'FREE',
          monthlyLimit: 3,
          activeSubscriptionId: null,
        });
      }
    } else {
      updatedSubscription = await this.storage.updateSubscription(subscription.id, {
        status: SubscriptionStatus.ACTIVE,
        cancelAtPeriodEnd: true,
        cancelledAt: null,
      });
    }

    if (!updatedSubscription) {
      throw new BadRequestException('Failed to cancel subscription');
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
   * PT-04: Org tier/limits only after a successful subscription invoice (subscription.charged).
   * Not used for subscription.authenticated — Razorpay can be Authenticated with 0 invoices charged.
   */
  private async upgradeOrganizationForActiveSubscription(subscription: {
    id: string;
    organizationId: string | null;
    planTier: PlanTier;
  }): Promise<void> {
    if (!subscription.organizationId) return;
    const planConfig = PLAN_CONFIG[subscription.planTier];
    await this.storage.updateOrganization(subscription.organizationId, {
      planTier: subscription.planTier,
      monthlyLimit: planConfig.limit,
      activeSubscriptionId: subscription.id,
    });
  }

  /**
   * Razorpay: subscription.authenticated (and sometimes subscription.activated) means the
   * mandate / payment method is registered — not necessarily that the first recurring invoice was paid.
   * UPI test flows can complete “success” here while Dashboard still shows 0 of N invoices charged.
   * We keep PENDING and do not upgrade the org until subscription.charged (see handleSubscriptionCharged).
   */
  async handleSubscriptionActivated(event: any, provider: PaymentProviderType): Promise<void> {
    const externalSubId = this.extractSubscriptionId(event, provider);
    const subscription = await this.storage.getSubscriptionByExternalId(externalSubId, provider as PaymentProvider);

    if (!subscription) return;

    this.logger.log(
      `Webhook ${provider} subscription.authenticated/activated for ${externalSubId}: acknowledged; ACTIVE + org upgrade on subscription.charged only`,
    );
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
      const latest = await this.storage.getSubscriptionByExternalId(externalSubId, provider as PaymentProvider);
      if (latest?.status === SubscriptionStatus.PENDING) {
        this.logger.warn(
          `subscription.charged replay: payment ${paymentData.id} already stored but subscription still PENDING — activating`,
        );
        await this.storage.updateSubscription(latest.id, { status: SubscriptionStatus.ACTIVE });
        await this.upgradeOrganizationForActiveSubscription(latest);
      } else {
        this.logger.debug('Payment already processed, skipping');
      }
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

    const periodUpdate = {
      currentPeriodStart: paymentData.periodStart,
      currentPeriodEnd: paymentData.periodEnd,
    };

    if (subscription.status === SubscriptionStatus.PENDING) {
      await this.storage.updateSubscription(subscription.id, {
        ...periodUpdate,
        status: SubscriptionStatus.ACTIVE,
      });
      await this.upgradeOrganizationForActiveSubscription(subscription);
    } else {
      await this.storage.updateSubscription(subscription.id, periodUpdate);
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

    // Idempotency: skip if this payment failure was already recorded
    const existingPayment = await this.storage.getPaymentByExternalId(paymentData.id, provider as PaymentProvider);
    if (existingPayment) {
      console.log('Payment failure already processed, skipping');
      return;
    }

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
        const now = Date.now() / 1000;
        const fallbackEnd = now + 30 * 24 * 60 * 60;
        const periodStart = subscription?.current_start && subscription.current_start > 0
          ? subscription.current_start
          : now;
        const periodEnd = subscription?.current_end && subscription.current_end > 0
          ? subscription.current_end
          : fallbackEnd;
        return {
          id: payment.id,
          orderId: payment.order_id,
          subscriptionId: subscription?.id || payment?.subscription_id,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.method,
          errorCode: payment.error_code,
          errorDescription: payment.error_description,
          periodStart: new Date(periodStart * 1000),
          periodEnd: new Date(periodEnd * 1000),
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

  /** Human-readable message from provider/SDK cancel errors (avoids dumping raw objects in logs). */
  private providerCancelErrorDescription(err: unknown): string {
    if (err == null) return '';
    if (typeof err === 'string') return err;
    if (err instanceof Error && err.message) return err.message;
    const rec = err as Record<string, unknown>;
    const inner = rec.error as Record<string, unknown> | undefined;
    const fromInner =
      typeof inner?.description === 'string' ? inner.description : '';
    const fromRec = typeof rec.description === 'string' ? rec.description : '';
    const fromMsg = typeof rec.message === 'string' ? rec.message : '';
    if (fromInner) return fromInner;
    if (fromRec) return fromRec;
    if (fromMsg) return fromMsg;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }

  /**
   * Provider cancel can fail harmlessly (already terminal, wrong state) or with Razorpay plain-object errors.
   * Used before upgrades and in user-initiated cancel.
   */
  private isBenignSubscriptionCancelFailure(description: string): boolean {
    const d = description.toLowerCase();
    return (
      (d.includes('not cancellable') && d.includes('expired')) ||
      d.includes('already cancelled') ||
      d.includes('already canceled') ||
      d.includes('already been cancelled') ||
      d.includes('subscription is cancelled') ||
      d.includes('subscription has been cancelled')
    );
  }
}
