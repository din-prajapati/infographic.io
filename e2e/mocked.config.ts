import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Mocked E2E suites: Vite only, every /api call answered by page.route() inside the spec.
 * No backend, no database, no external AI or storage calls, so these are fast and deterministic.
 *
 * Folders covered: editor (V3), workspace, listings, agent-brand.
 * Run one module:  npx playwright test -c e2e/mocked.config.ts listings/
 * Or via the runner: npm run test:module -- listings --e2e
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export default defineConfig({
  testDir: '.',
  testMatch: ['editor/**/*.spec.ts', 'workspace/**/*.spec.ts', 'listings/**/*.spec.ts', 'agent-brand/**/*.spec.ts', 'settings/**/*.spec.ts'],
  testIgnore: ['**/real-backend/**'],
  outputDir: '../.e2e-artifacts/mocked',
  timeout: 45_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:5181', headless: true, viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure', screenshot: 'only-on-failure', channel: 'chrome' },
  webServer: {
    command: `node --input-type=module -e "import {createServer} from 'vite';const server=await createServer({configFile:'vite.config.ts',server:{host:'127.0.0.1',port:5181,strictPort:true,open:false}});await server.listen();"`,
    cwd: root,
    url: 'http://127.0.0.1:5181',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
