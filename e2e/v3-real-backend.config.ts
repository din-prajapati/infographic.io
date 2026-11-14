import { defineConfig } from '@playwright/test';

// Real-backend V3 listing journey. Reuses the already running stack (Express :5000 -> NestJS -> Prisma dev DB -> R2);
// there is deliberately no webServer and no default to staging. Override with PLAYWRIGHT_BASE_URL only on purpose.
export default defineConfig({
  testDir: '.',
  testMatch: ['v3-listing-real-backend.spec.ts', 'v3-editor-url-real-backend.spec.ts'],
  outputDir: '../.e2e-artifacts/v3-real-backend',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5000',
    headless: true,
    viewport: { width: 1242, height: 668 },
    channel: 'chrome',
    acceptDownloads: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
