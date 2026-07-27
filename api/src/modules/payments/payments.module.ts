import { Module } from '@nestjs/common';
import { PaymentsController } from './controllers/payments.controller';
import { UsageAnalyticsController } from './controllers/usage-analytics.controller';
import { PaymentsService } from './services/payments.service';
import { SubscriptionStorageService } from './services/subscription-storage.service';
import { UsageAnalyticsService } from './services/usage-analytics.service';
import { RenewalReminderService } from './services/renewal-reminder.service';
import { PrismaService } from '../../common/services/prisma.service';
import { DatabaseModule } from '../../database/database.module';
import { EmailModule } from '../email/email.module';
import { EmailService } from '../email/email.service';

@Module({
  imports: [DatabaseModule, EmailModule],
  controllers: [PaymentsController, UsageAnalyticsController],
  providers: [
    // Use global PrismaService from DatabaseModule (inject below); do not re-provide to avoid duplicate instances
    {
      provide: SubscriptionStorageService,
      useFactory: (prisma: PrismaService) => new SubscriptionStorageService(prisma),
      inject: [PrismaService],
    },
    UsageAnalyticsService,
    {
      provide: PaymentsService,
      useFactory: (storage: SubscriptionStorageService, emailService: EmailService) =>
        new PaymentsService(storage, emailService),
      inject: [SubscriptionStorageService, EmailService],
    },
    {
      provide: RenewalReminderService,
      useFactory: (emailService: EmailService) => new RenewalReminderService(emailService),
      inject: [EmailService],
    },
  ],
  exports: [PaymentsService, UsageAnalyticsService],
})
export class PaymentsModule {}
