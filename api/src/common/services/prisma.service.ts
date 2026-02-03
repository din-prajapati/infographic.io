import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3;

  constructor() {
    // Prisma 6: Connection URL is read from DATABASE_URL env var automatically
    // Configure Prisma to handle Neon serverless connections better
    // Use minimal logging to reduce noise from expected connection errors
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn'] : [], // Only warnings, suppress errors
      errorFormat: 'minimal',
    });

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.service.ts:17',message:'PrismaService constructor - setting up',data:{logLevel:process.env.NODE_ENV === 'development' ? 'warn' : 'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run11',hypothesisId:'V'})}).catch(()=>{});
    // #endregion
  }

  async onModuleInit() {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.service.ts:22',message:'onModuleInit - setting up middleware',data:{hasUseMethod:typeof this.$use === 'function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run11',hypothesisId:'W'})}).catch(()=>{});
    // #endregion
    
    // Set up middleware after connection (if $use is available)
    if (typeof this.$use === 'function') {
      // Handle runtime connection errors (E57P01 - Neon auto-pause)
      this.$use(async (params, next) => {
        try {
          return await next(params);
        } catch (error: any) {
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.service.ts:29',message:'Prisma query error caught',data:{errorCode:error?.code,errorMessage:error?.message,errorKind:error?.kind,hasCause:error?.cause!==undefined,causeCode:error?.cause?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run11',hypothesisId:'X'})}).catch(()=>{});
          // #endregion
          
          // Check for Neon connection termination errors
          const errorString = JSON.stringify(error);
          const isConnectionError = 
            error?.code === 'P1011' ||
            error?.code === 'E57P01' ||
            (error?.kind === 'Db' && (
              error?.message?.includes('terminating connection') ||
              error?.message?.includes('E57P01') ||
              errorString?.includes('E57P01') ||
              errorString?.includes('terminating connection')
            )) ||
            error?.cause?.code === 'E57P01' ||
            (error?.cause && typeof error.cause === 'object' && 'code' in error.cause && (
              error.cause.code === 'E57P01' || 
              String(error.cause.code).includes('E57P01')
            )) ||
            error?.message?.includes('terminating connection') ||
            error?.message?.includes('E57P01') ||
            errorString?.includes('E57P01');
          
          if (isConnectionError) {
            this.logger.warn(
              `⚠️ Database connection terminated (likely Neon auto-pause). Attempting to reconnect...`,
            );
            
            // #region agent log
            fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.service.ts:50',message:'Connection error detected, attempting reconnect',data:{errorCode:error?.code,errorKind:error?.kind},timestamp:Date.now(),sessionId:'debug-session',runId:'run11',hypothesisId:'Y'})}).catch(()=>{});
            // #endregion
            
            await this.handleReconnect();
            
            try {
              // #region agent log
              fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.service.ts:56',message:'Retrying query after reconnect',data:{model:params.model,action:params.action},timestamp:Date.now(),sessionId:'debug-session',runId:'run11',hypothesisId:'Z'})}).catch(()=>{});
              // #endregion
              return await next(params);
            } catch (retryError: any) {
              this.logger.error(
                `❌ Retry failed after reconnection: ${retryError?.message || retryError}`,
              );
              throw retryError;
            }
          }
          throw error;
        }
      });
    } else {
      this.logger.warn('⚠️ Prisma $use middleware not available - connection error handling limited');
    }
    
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
