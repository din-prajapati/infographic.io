import { Controller, Get, HttpCode, Inject } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../../common/services/prisma.service';
import { isCheckoutDisabled } from '../payments/checkout-kill-switch';

function readVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../../../package.json'), 'utf-8'));
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

// Matches the release-tagging pattern already used in instrument.ts (Sentry).
const VERSION = readVersion();
const COMMIT_SHA = process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) || 'local';

@Controller('health')
export class HealthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(200)
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    // `checkoutDisabled` is the checkout kill-switch (BETA_MODE) as the running
    // service actually sees it. BL-29 happened because the flag's state was
    // assumed from configuration rather than observed; this makes "is checkout
    // off right now?" a question you answer by asking the service.
    return {
      status: 'ok',
      db: 'connected',
      uptime: process.uptime(),
      version: VERSION,
      commitSha: COMMIT_SHA,
      checkoutDisabled: isCheckoutDisabled(),
    };
  }
}
