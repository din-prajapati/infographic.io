import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export default defineConfig({
  testDir: '.',
  testMatch: ['us-edit-031-v3-slice.spec.ts', 'v3-approved-shell.spec.ts', 'v3-element-toolbars.spec.ts', 'v3-color-paints.spec.ts', 'v3-annotations.spec.ts', 'v3-elements-library.spec.ts', 'v3-layers-panel.spec.ts', 'v3-arrange.spec.ts', 'v3-responsive.spec.ts'],
  outputDir: '../.e2e-artifacts/us-edit-031',
  timeout: 45_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:5181', headless: true, viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure', screenshot: 'only-on-failure', channel: 'chrome' },
  webServer: {
    // Vite only: no backend, DB, browser opening or external generation calls.
    command: `node --input-type=module -e "import {createServer} from 'vite';const server=await createServer({configFile:'vite.config.ts',server:{host:'127.0.0.1',port:5181,strictPort:true,open:false}});await server.listen();"`,
    cwd: root,
    url: 'http://127.0.0.1:5181',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
