import { Global, Module } from '@nestjs/common';
import { StorageService } from './services/storage.service';

/**
 * US-INFRA-001 AC4 — `@Global()`, so any service in any module can declare `StorageService` in
 * its constructor without that module re-providing it. Same pattern as `DatabaseModule`.
 *
 * Global is right here for the same reason it is right for Prisma: there is exactly one bucket
 * and one client, and re-providing it per module would create a second `S3Client` per module —
 * each with its own connection pool — for no benefit. Both downstream consumers
 * (`US-INFRA-002` in ai-generation, `US-INFRA-003` in infographics) sit in different modules.
 */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
