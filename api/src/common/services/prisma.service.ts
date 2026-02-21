import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3;

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn'] : [],
      errorFormat: 'minimal',
    });
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= this.maxReconnectAttempts; attempt++) {
      try {
        await this.$connect();
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.logger.log('✅ Database connected successfully');
        return;
      } catch (error: any) {
        this.isConnected = false;
        this.logger.warn(
          `⚠️ Database connection attempt ${attempt}/${this.maxReconnectAttempts} failed`,
        );
        this.logger.warn(`Database error: ${error?.message || error}`);

        if (attempt < this.maxReconnectAttempts) {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          this.logger.log(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          this.logger.warn('⚠️  Database connection failed - running in limited mode');
          // Don't throw - allow app to continue without database
        }
      }
    }
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    try {
      // Disconnect if currently connected
      if (this.isConnected) {
        await this.$disconnect().catch(() => {
          // Ignore disconnect errors
        });
      }

      // Wait a bit before reconnecting
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reconnect
      await this.$connect();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.logger.log('✅ Database reconnected successfully');
    } catch (error: any) {
      this.isConnected = false;
      this.logger.warn(`⚠️ Reconnection attempt ${this.reconnectAttempts} failed: ${error?.message || error}`);
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      try {
        await this.$disconnect();
        this.logger.log('✅ Database disconnected');
      } catch (error: any) {
        this.logger.warn(`⚠️ Error disconnecting: ${error?.message || error}`);
      }
    }
  }

  isDatabaseAvailable(): boolean {
    return this.isConnected;
  }
}
