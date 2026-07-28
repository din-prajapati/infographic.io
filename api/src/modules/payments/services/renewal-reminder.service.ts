import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SubscriptionStatus, PlanTier } from '@prisma/client';
import { prisma } from '../../../database/prisma.client';
import { EmailService } from '../../email/email.service';
import { renewalReminderTemplate } from '../../email/templates/renewal-reminder.template';

/**
 * Sends renewal reminder emails ~3 days before subscription auto-charges.
 *
 * Cron: 08:00 UTC daily (AC5).
 * Eligibility: ACTIVE, non-FREE, currentPeriodEnd within 72h, not already reminded
 * this billing cycle (AC1).
 * On send success: writes renewalReminderSentAt = now (AC3).
 * On failure: logs warn, continues; does NOT write the field (AC4).
 */
@Injectable()
export class RenewalReminderService {
  private readonly logger = new Logger(RenewalReminderService.name);

  constructor(private readonly emailService: EmailService) {}

  @Cron('0 8 * * *')
  async sendRenewalReminders(): Promise<void> {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 72 * 60 * 60 * 1000); // +72 hours

    // Step 1 — DB query: ACTIVE non-FREE subscriptions renewing in the next 72h (AC1)
    const candidates = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        planTier: { not: PlanTier.FREE },
        currentPeriodEnd: {
          gt: now,
          lte: windowEnd,
        },
      },
      include: { user: true },
    });

    // Step 2 — In-memory filter: exclude if already reminded for the current billing
    // cycle. Prisma cannot compare two columns in a WHERE clause, so we filter here (AC1).
    const qualifying = candidates.filter((sub) => {
      if (!sub.renewalReminderSentAt) return true; // never sent
      return sub.renewalReminderSentAt < sub.currentPeriodStart; // sent in a prior cycle
    });

    for (const sub of qualifying) {
      const amountInRupees = Math.round(sub.amount / 100);
      const renewalDate = sub.currentPeriodEnd.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      // Send reminder email (AC2)
      let result: { sent: boolean; dev?: boolean } | undefined;
      try {
        const { subject, html } = renewalReminderTemplate({
          userName: sub.user.name ?? sub.user.email,
          planTier: sub.planTier,
          renewalDate,
          amountInRupees,
        });
        result = await this.emailService.send({ to: sub.user.email, subject, html });
      } catch (emailErr: unknown) {
        // AC4: EmailService threw — log, skip renewalReminderSentAt update, continue
        this.logger.warn(
          `Renewal reminder email threw for subscription ${sub.id}: ` +
            (emailErr instanceof Error ? emailErr.message : String(emailErr)),
        );
        continue;
      }

      if (result?.sent) {
        // AC3: Write renewalReminderSentAt only on confirmed delivery
        try {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { renewalReminderSentAt: now },
          });
        } catch (updateErr: unknown) {
          this.logger.warn(
            `Failed to write renewalReminderSentAt for subscription ${sub.id}: ` +
              (updateErr instanceof Error ? updateErr.message : String(updateErr)),
          );
        }
      } else {
        // AC4: sent=false — log and skip update; continue to next subscription
        this.logger.warn(
          `Renewal reminder not delivered for subscription ${sub.id} (sent=false) — ` +
            `renewalReminderSentAt not updated`,
        );
      }
    }
  }
}
