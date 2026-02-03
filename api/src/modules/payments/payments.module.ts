import { Module } from '@nestjs/common';
import { PaymentsController } from './controllers/payments.controller';
import { UsageAnalyticsController } from './controllers/usage-analytics.controller';
import { PaymentsService } from './services/payments.service';
import { SubscriptionStorageService } from './services/subscription-storage.service';
import { UsageAnalyticsService } from './services/usage-analytics.service';
import { PrismaService } from '../../common/services/prisma.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
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
      useFactory: (storage: SubscriptionStorageService) => new PaymentsService(storage),
      inject: [SubscriptionStorageService],
    },
  ],
  exports: [PaymentsService, UsageAnalyticsService],
})
export class PaymentsModule {}
