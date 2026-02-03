import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../../common/services/prisma.service';
import { PaymentProvider, SubscriptionStatus, PaymentStatus, PlanTier } from '@prisma/client';

const DEBUG_LOG_PATH = path.join(__dirname, '../../../../..', '.cursor', 'debug.log');
function debugLog(location: string, message: string, data: object, hypothesisId: string) {
  try {
    fs.appendFileSync(DEBUG_LOG_PATH, JSON.stringify({ location, message, data, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId }) + '\n');
  } catch (_) {}
}

@Injectable()
export class SubscriptionStorageService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  // User operations
  async getUser(id: string) {
    // #region agent log
    debugLog('subscription-storage.service.ts:getUser', 'getUser called', { id, hasPrisma: !!this.prisma }, 'D');
    // #endregion
    if (!this.prisma) {
      throw new InternalServerErrorException(
        'SubscriptionStorageService: PrismaService not injected. Check PaymentsModule providers.',
      );
    }
    return this.prisma.user.findUnique({
      where: { id },
      include: { organization: true },
    });
  }

  async createUser(user: { id: string; email: string; name?: string }) {
    return this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name || null,
        password: '', // Password should be set separately via auth service
      },
    });
  }

  async updateUser(
    id: string,
    data: Partial<{
      razorpayCustomerId: string;
      stripeCustomerId: string;
      paddleCustomerId: string;
    }>,
  ) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  // Subscription operations
  async getSubscription(id: string) {
    return this.prisma.subscription.findUnique({
      where: { id },
      include: { user: true, organization: true },
    });
  }

  async getActiveSubscriptionByUserId(userId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      include: { user: true, organization: true },
    });
  }

  async getSubscriptionByExternalId(
    externalId: string,
    provider: PaymentProvider,
  ) {
    return this.prisma.subscription.findFirst({
      where: {
        externalSubscriptionId: externalId,
        paymentProvider: provider,
      },
      include: { user: true, organization: true },
    });
  }

  async createSubscription(data: {
    id: string;
    userId: string;
    organizationId?: string | null;
    paymentProvider: PaymentProvider;
    externalSubscriptionId: string;
    externalPlanId: string;
    externalCustomerId?: string | null;
    planTier: PlanTier;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    amount: number;
    currency: string;
    cancelAtPeriodEnd?: boolean;
    cancelledAt?: Date | null;
  }) {
    return this.prisma.subscription.create({
      data: {
        id: data.id,
        userId: data.userId,
        organizationId: data.organizationId,
        paymentProvider: data.paymentProvider,
        externalSubscriptionId: data.externalSubscriptionId,
        externalPlanId: data.externalPlanId,
        externalCustomerId: data.externalCustomerId,
        planTier: data.planTier,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        amount: data.amount,
        currency: data.currency,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
        cancelledAt: data.cancelledAt,
      },
      include: { user: true, organization: true },
    });
  }

  async updateSubscription(
    id: string,
    data: Partial<{
      status: SubscriptionStatus;
      planTier: PlanTier;
      externalPlanId: string;
      amount: number;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
      cancelAtPeriodEnd: boolean;
      cancelledAt: Date | null;
    }>,
  ) {
    return this.prisma.subscription.update({
      where: { id },
      data,
      include: { user: true, organization: true },
    });
  }

  // Payment operations
  async getPaymentByExternalId(
    externalId: string,
    provider: PaymentProvider,
  ) {
    return this.prisma.payment.findFirst({
      where: {
        externalPaymentId: externalId,
        paymentProvider: provider,
      },
    });
  }

  async createPayment(data: {
    id: string;
    userId: string;
    subscriptionId?: string | null;
    paymentProvider: PaymentProvider;
    externalPaymentId: string;
    externalOrderId?: string | null;
    externalInvoiceId?: string | null;
    signature?: string | null;
    amount: number;
    currency: string;
    status: PaymentStatus;
    method?: string | null;
    errorCode?: string | null;
    errorDescription?: string | null;
  }) {
    return this.prisma.payment.create({
      data: {
        id: data.id,
        userId: data.userId,
        subscriptionId: data.subscriptionId,
        paymentProvider: data.paymentProvider,
        externalPaymentId: data.externalPaymentId,
        externalOrderId: data.externalOrderId,
        externalInvoiceId: data.externalInvoiceId,
        signature: data.signature,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        method: data.method,
        errorCode: data.errorCode,
        errorDescription: data.errorDescription,
      },
    });
  }

  async getPaymentsByUserId(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { subscription: true },
    });
  }

  // Organization operations
  async getOrganization(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
    });
  }

  async updateOrganization(
    id: string,
    data: Partial<{
      planTier: string;
      monthlyLimit: number;
      activeSubscriptionId: string | null;
      razorpayCustomerId: string | null;
      stripeCustomerId: string | null;
      paddleCustomerId: string | null;
    }>,
  ) {
    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }
}
