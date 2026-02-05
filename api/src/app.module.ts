import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard, ThrottlerStorage } from '@nestjs/throttler';
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


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(__dirname, '../../.env.production'), // Production (if exists)
        resolve(__dirname, '../../.env'),             // Development/fallback
      ],
      // In production, prefer system environment variables over .env files
      ignoreEnvFile: process.env.NODE_ENV === 'production' && !!process.env.DATABASE_URL,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{
        name: 'default',
        ttl: 60000,
        limit: 100,
      }],
    }),
    DatabaseModule,
    AuthModule,
    InfographicsModule,
    TemplatesModule,
    AiGenerationModule,
    DesignsModule,
    ConversationsModule,
    PaymentsModule,
    UsersModule,
  ],
  providers: [
    Reflector,
    {
      provide: APP_GUARD,
      useFactory: (options, storage, reflector) => {
        return new ThrottlerGuard(options, storage, reflector);
      },
      inject: ['THROTTLER:MODULE_OPTIONS', ThrottlerStorage, Reflector],
    },
  ],
})
export class AppModule {}
