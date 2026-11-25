import { defineConfig } from '@playwright/test';
import base from '../mocked.config';

// V3 editor mocked suite (Vite only). Real-backend editor specs use real-backend/playwright.config.ts.
export default defineConfig({ ...base, testDir: '.', testMatch: ['**/*.spec.ts'], testIgnore: ['real-backend/**'], outputDir: '../../.e2e-artifacts/us-edit-031' });
