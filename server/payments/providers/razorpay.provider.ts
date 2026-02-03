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

// RazorPay SDK types (simplified for this implementation)
interface RazorpayInstance {
  customers: {
    create(params: any): Promise<any>;
  };
  plans: {
    create(params: any): Promise<any>;
  };
  subscriptions: {
    create(params: any): Promise<any>;
    fetch(id: string): Promise<any>;
    update(id: string, params: any): Promise<any>;
    cancel(id: string, cancelAtCycleEnd: boolean): Promise<any>;
  };
  payments: {
    fetch(id: string): Promise<any>;
    refund(id: string, params?: any): Promise<any>;
  };
  invoices: {
    fetch(id: string): Promise<any>;
  };
}

/**
 * RazorPay Provider Implementation
 * Implements IPaymentProvider interface for RazorPay integration
 */
export class RazorpayProvider implements IPaymentProvider {
  private razorpay: RazorpayInstance | null = null;
  private keyId: string;
  private keySecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  }

  private async getRazorpayInstance(): Promise<RazorpayInstance> {
    if (!this.razorpay) {
      if (!this.keyId || !this.keySecret) {
        throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required');
      }
      
      // Dynamic import for Razorpay SDK
      const Razorpay = (await import('razorpay')).default;
      this.razorpay = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });
    }
    return this.razorpay;
  }

  getProviderName(): PaymentProviderType {
    return 'RAZORPAY';
  }

  async createCustomer(email: string, name: string, phone?: string): Promise<CustomerResponse> {
    const razorpay = await this.getRazorpayInstance();
    const customer = await razorpay.customers.create({
      email,
      name,
      contact: phone,
      fail_existing: 0,
    });

    return {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      provider: 'RAZORPAY',
    };
  }

  async createPlan(params: CreatePlanParams): Promise<PlanResponse> {
    const razorpay = await this.getRazorpayInstance();
    const plan = await razorpay.plans.create({
      period: params.period,
      interval: params.interval,
      item: {
        name: params.name,
        amount: params.amount,
        currency: params.currency,
        description: params.description,
      },
    });

    return {
      id: plan.id,
      name: params.name,
      amount: params.amount,
      currency: params.currency,
      interval: `${params.interval} ${params.period}`,
      provider: 'RAZORPAY',
    };
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResponse> {
    const razorpay = await this.getRazorpayInstance();
    // Razorpay requires start_at >= their server time; use 60s buffer to avoid clock skew
    const startAt = params.startAt ?? Math.floor(Date.now() / 1000) + 60;
    const subscription = await razorpay.subscriptions.create({
      plan_id: params.planId,
      customer_id: params.customerId,
      total_count: params.totalCount,
      quantity: params.quantity || 1,
      start_at: startAt,
      customer_notify: params.notify ? 1 : 0,
      addons: [],
      notes: {},
    });

    return {
      id: subscription.id,
      customerId: subscription.customer_id,
      planId: subscription.plan_id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_start * 1000),
      currentPeriodEnd: new Date(subscription.current_end * 1000),
      amount: subscription.amount || 0,
      currency: subscription.currency || 'INR',
      provider: 'RAZORPAY',
      shortUrl: subscription.short_url,
    };
  }

  async fetchSubscription(subscriptionId: string): Promise<SubscriptionResponse> {
    const razorpay = await this.getRazorpayInstance();
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);

    return {
      id: subscription.id,
      customerId: subscription.customer_id,
      planId: subscription.plan_id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_start * 1000),
      currentPeriodEnd: new Date(subscription.current_end * 1000),
      amount: subscription.amount || 0,
      currency: subscription.currency || 'INR',
      provider: 'RAZORPAY',
      shortUrl: subscription.short_url,
    };
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelAtCycleEnd: boolean = true,
  ): Promise<SubscriptionResponse> {
    const razorpay = await this.getRazorpayInstance();
    const subscription = await razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);

    return {
      id: subscription.id,
      customerId: subscription.customer_id,
      planId: subscription.plan_id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_start * 1000),
      currentPeriodEnd: new Date(subscription.current_end * 1000),
      amount: subscription.amount || 0,
      currency: subscription.currency || 'INR',
      provider: 'RAZORPAY',
    };
  }

  async updateSubscription(
    subscriptionId: string,
    params: UpdateSubscriptionParams,
  ): Promise<SubscriptionResponse> {
    const razorpay = await this.getRazorpayInstance();
    const subscription = await razorpay.subscriptions.update(subscriptionId, {
      plan_id: params.planId,
      quantity: params.quantity,
      schedule_change_at: params.scheduleChangeAt || 'cycle_end',
    });

    return {
      id: subscription.id,
      customerId: subscription.customer_id,
      planId: subscription.plan_id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_start * 1000),
      currentPeriodEnd: new Date(subscription.current_end * 1000),
      amount: subscription.amount || 0,
      currency: subscription.currency || 'INR',
      provider: 'RAZORPAY',
    };
  }

  async fetchPayment(paymentId: string): Promise<PaymentResponse> {
    const razorpay = await this.getRazorpayInstance();
    const payment = await razorpay.payments.fetch(paymentId);

    return {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      provider: 'RAZORPAY',
    };
  }

  async refundPayment(paymentId: string, amount?: number): Promise<RefundResponse> {
    const razorpay = await this.getRazorpayInstance();
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount,
    });

    return {
      id: refund.id,
      paymentId: refund.payment_id,
      amount: refund.amount,
      status: refund.status,
      provider: 'RAZORPAY',
    };
  }

  async fetchInvoice(invoiceId: string): Promise<InvoiceResponse> {
    const razorpay = await this.getRazorpayInstance();
    const invoice = await razorpay.invoices.fetch(invoiceId);

    return {
      id: invoice.id,
      amount: invoice.amount,
      amountPaid: invoice.amount_paid,
      amountDue: invoice.amount_due,
      currency: invoice.currency,
      status: invoice.status,
      provider: 'RAZORPAY',
    };
  }

  verifyWebhookSignature(webhookBody: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(webhookBody)
      .digest('hex');

    return expectedSignature === signature;
  }

  verifyPaymentSignature(subscriptionId: string, paymentId: string, signature: string): boolean {
    const body = subscriptionId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  }
}

export const razorpayProvider = new RazorpayProvider();
