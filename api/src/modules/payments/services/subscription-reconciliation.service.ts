import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PaymentProvider, SubscriptionStatus, PlanTier } from '@prisma/client';
import { PLAN_CONFIG } from '@shared/schema';
import { prisma } from '../../../database/prisma.client';
import { paymentProviderFactory } from '../../../../../server/payments/providers/payment-provider.factory';
import type { PaymentProviderType } from '../../../../../server/payments/interfaces/payment-provider.interface';

/**
 * Reconciles local subscription state against the payment provider.
 *
 * Webhooks are the primary mechanism and this is the safety net underneath them.
 * It exists because the 2026-10-16 production run showed three distinct ways a
 * webhook never lands, none of which the application could detect:
 *
 *  1. **The event was not subscribed.** `subscription.halted`, `subscription.pending`
 *     and both refund events were switched off at the provider until 2026-10-19,
 *     so their handlers — correct, tested, deployed — were never called. Nothing
 *     in the system noticed.
 *  2. **The service was not up.** Express verifies the signature and forwards to
 *     NestJS; during a cold start that forward fails with ECONNREFUSED and the
 *     caller gets a 500. On production that window follows every deploy, and
 *     every merge to `main` is a deploy.
 *  3. **Delivery simply failed.** Retries help and are not guaranteed.
 *
 * It also backstops the grace period. `PAST_DUE` deliberately keeps entitlement
 * while the provider retries, and that window is closed by `subscription.halted`
 * arriving. If it never arrives, a customer who stopped paying would keep their
 * plan indefinitely. Here, a paid period that has elapsed ends the grace whatever
 * the provider did or did not send.
 *
 * Principles:
 *  - **The provider is the source of truth for money.** Local state yields to it.
 *  - **Never grant on silence.** A fetch that fails leaves the row alone; it does
 *    not promote anyone. Every promotion requires a positive paid-cycle count,
 *    the same rule the sync endpoint uses.
 *  - **One bad subscription must not stop the sweep.** Each is isolated.
 */
@Injectable()
export class SubscriptionReconciliationService {
  private readonly logger = new Logger(SubscriptionReconciliationService.name);

  /**
   * Bound on how many subscriptions one sweep will touch.
   *
   * Each one costs a provider API call. At present scale this never binds; it is
   * here so that growth turns into a slower convergence rather than a rate-limit
   * incident. Least-recently-updated first, so nothing is starved.
   */
  private static readonly BATCH_LIMIT = 200;

  /** Statuses worth checking. Terminal ones are left alone. */
  private static readonly RECONCILABLE: SubscriptionStatus[] = [
    SubscriptionStatus.PENDING,
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.PAST_DUE,
    SubscriptionStatus.HALTED,
    SubscriptionStatus.PAUSED,
  ];

  @Cron('0 * * * *')
  async reconcile(): Promise<void> {
    const started = Date.now();
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: { in: SubscriptionReconciliationService.RECONCILABLE },
        externalSubscriptionId: { not: '' },
      },
      orderBy: { updatedAt: 'asc' },
      take: SubscriptionReconciliationService.BATCH_LIMIT,
    });

    if (subscriptions.length === 0) return;

    let changed = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        if (await this.reconcileOne(sub)) changed += 1;
      } catch (err: unknown) {
        failed += 1;
        this.logger.warn(
          `Reconcile failed for subscription ${sub.id} (${sub.externalSubscriptionId}): ` +
            (err instanceof Error ? err.message : String(err)),
        );
      }
    }

    this.logger.log(
      `Reconciled ${subscriptions.length} subscription(s) in ${Date.now() - started}ms — ` +
        `${changed} corrected, ${failed} unreachable`,
    );
  }

  /** @returns whether anything was corrected. */
  private async reconcileOne(sub: {
    id: string;
    userId: string;
    organizationId: string | null;
    status: SubscriptionStatus;
    planTier: string;
    paymentProvider: PaymentProvider;
    externalSubscriptionId: string;
    currentPeriodEnd: Date | null;
  }): Promise<boolean> {
    const provider = paymentProviderFactory.getProvider(
      null,
      sub.paymentProvider as PaymentProviderType,
    );
    const remote = await provider.fetchSubscription(sub.externalSubscriptionId);
    const remoteStatus = String(remote.status ?? '').toLowerCase();
    const paidCount = remote.paidCount;
    const hasCapturedPayment = typeof paidCount === 'number' && paidCount >= 1;

    const target = this.targetStatus(sub, remoteStatus, hasCapturedPayment);

    if (target === null || target === sub.status) {
      return false;
    }

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: target,
        ...(target === SubscriptionStatus.CANCELLED ? { cancelledAt: new Date() } : {}),
      },
    });

    if (sub.organizationId) {
      if (target === SubscriptionStatus.ACTIVE) {
        // Repairing a missed activation means repairing the entitlement too.
        // `resolveEffectiveTier` short-circuits on a FREE organisation, so a row
        // promoted to ACTIVE while its org still reads FREE would leave a paying
        // customer on 3 designs a month — the webhook path upgrades here for the
        // same reason.
        const planConfig = PLAN_CONFIG[sub.planTier as PlanTier];
        await prisma.organization.update({
          where: { id: sub.organizationId },
          data: {
            planTier: sub.planTier as PlanTier,
            monthlyLimit: planConfig?.limit ?? 3,
            activeSubscriptionId: sub.id,
          },
        });
      } else if (target === SubscriptionStatus.CANCELLED) {
        // Only cancellation clears the tier stamp, matching the webhook handlers:
        // entitlement is resolved from subscription status at read time, so HALTED
        // already withdraws it, and keeping the stamp means a recovered payment
        // restores access in one status change.
        await prisma.organization.update({
          where: { id: sub.organizationId },
          data: { planTier: 'FREE', monthlyLimit: 3, activeSubscriptionId: null },
        });
      }
    }

    this.logger.warn(
      `Reconciled subscription ${sub.id}: ${sub.status} → ${target} ` +
        `(provider=${remoteStatus}, paidCount=${paidCount ?? 'not reported'})`,
    );

    await prisma.subscriptionEvent
      .create({
        data: {
          userId: sub.userId,
          subscriptionId: sub.id,
          eventType: 'reconciliation',
          provider: sub.paymentProvider,
          providerStatus: remoteStatus,
          localStatus: target,
          promoted: target === SubscriptionStatus.ACTIVE,
          message: `Corrected ${sub.status} → ${target} from provider state.`,
          metadata: { paidCount: paidCount ?? null },
        },
      })
      .catch(() => undefined); // audit write must never fail the correction

    return true;
  }

  /**
   * What the local status should be. `null` means leave it alone.
   *
   * Order matters: the provider's own terminal verdicts win, then the grace
   * backstop, then the missed-activation repair.
   */
  private targetStatus(
    sub: { status: SubscriptionStatus; currentPeriodEnd: Date | null },
    remoteStatus: string,
    hasCapturedPayment: boolean,
  ): SubscriptionStatus | null {
    // The provider has stopped the subscription.
    if (remoteStatus === 'cancelled') return SubscriptionStatus.CANCELLED;
    if (remoteStatus === 'expired' || remoteStatus === 'completed') return SubscriptionStatus.EXPIRED;
    if (remoteStatus === 'halted') return SubscriptionStatus.HALTED;
    if (remoteStatus === 'paused') return SubscriptionStatus.PAUSED;

    // A failed renewal the provider is still retrying.
    if (remoteStatus === 'pending') return SubscriptionStatus.PAST_DUE;

    // Grace backstop. PAST_DUE keeps entitlement while the provider retries, on
    // the assumption that `subscription.halted` will close the window. If that
    // event never arrives, this ends it instead: a billing period that has
    // elapsed without payment is not a plan any more.
    if (
      sub.status === SubscriptionStatus.PAST_DUE &&
      sub.currentPeriodEnd &&
      sub.currentPeriodEnd.getTime() < Date.now()
    ) {
      return SubscriptionStatus.HALTED;
    }

    // Missed activation — the `subscription.charged` webhook never landed, but the
    // money did. Same bar as the sync endpoint: a positive paid-cycle count, never
    // provider status alone, which can read `active` with nothing collected.
    if (sub.status === SubscriptionStatus.PENDING && remoteStatus === 'active' && hasCapturedPayment) {
      return SubscriptionStatus.ACTIVE;
    }

    return null;
  }
}
