import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, Reflector } from '@nestjs/core';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { ThrottlerModule, ThrottlerStorage } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { resolve } from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { InfographicsModule } from './modules/infographics/infographics.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { AiGenerationModule } from './modules/ai-generation/ai-generation.module';
import { DesignsModule } from './modules/designs/designs.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './database/database.module';
import { StorageModule } from './modules/storage/storage.module';
import { HealthModule } from './modules/health/health.module';
import { EmailModule } from './modules/email/email.module';
import { ProxyAwareThrottlerGuard } from './common/guards/proxy-aware-throttler.guard';
import { validate } from './config/env.validation';


@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(__dirname, '../../.env.production'), // Production (if exists)
        resolve(__dirname, '../../.env'),             // Development/fallback
      ],
      // In production, prefer system environment variables over .env files
      ignoreEnvFile: process.env.NODE_ENV === 'production' && !!process.env.DATABASE_URL,
      validate,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{
        name: 'default',
        ttl: 60000,
        limit: 100,
      }],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    // @Global() like DatabaseModule — US-INFRA-002/003 consume it from other modules.
    StorageModule,
    AuthModule,
    InfographicsModule,
    TemplatesModule,
    AiGenerationModule,
    DesignsModule,
    ConversationsModule,
    PaymentsModule,
    UsersModule,
    HealthModule,
    EmailModule,
  ],
  providers: [
    Reflector,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      // US-LAUNCH-014 AC11 — the proxy-aware subclass replaces the stock ThrottlerGuard so
      // the tracker is the real client rather than the Express proxy's localhost address.
      // Without it the per-IP limits in auth.controller.ts would apply to all users at once.
      provide: APP_GUARD,
      useFactory: (options, storage, reflector) => {
        return new ProxyAwareThrottlerGuard(options, storage, reflector);
      },
      inject: ['THROTTLER:MODULE_OPTIONS', ThrottlerStorage, Reflector],
    },
  ],
})
export class AppModule {}
