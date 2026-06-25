import "dotenv/config";
import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

const isCi = process.env.CI === "true";

const CROSS_BROWSER_SPEC = /flow6-cross-browser-smoke\.spec\.ts/;

/**
 * Local: headed Google Chrome, maximized (system Chrome).
 * CI: headless bundled Chromium, fixed viewport.
 *
 * Cross-browser smoke (local only): Firefox, Edge, and Responsive Chrome
 * are added as separate projects scoped to flow6-cross-browser-smoke.spec.ts.
 * Run with: npx playwright test e2e/flow6-cross-browser-smoke.spec.ts
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: !!isCi,
  retries: isCi ? 1 : 0,
  workers: 1,
  reporter: isCi ? "github" : "list",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    actionTimeout: 25_000,
    navigationTimeout: 45_000,
  },
  webServer: isCi
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe",
      },
  projects: [
    isCi
      ? {
          name: "chromium-ci",
          testMatch: /.*\.spec\.ts/,
          use: {
            ...devices["Desktop Chrome"],
            headless: true,
            viewport: { width: 1280, height: 800 },
          },
        }
      : {
          name: "chrome-headed",
          testMatch: /.*\.spec\.ts/,
          // Do not spread `devices["Desktop Chrome"]` here: its `deviceScaleFactor`
          // is incompatible with `viewport: null` (maximized window).
          use: {
            channel: "chrome",
            headless: false,
            viewport: null,
            launchOptions: {
              args: ["--start-maximized"],
            },
          },
        },
    // Cross-browser smoke — local only, scoped to flow6 spec
    ...(!isCi
      ? [
          {
            name: "firefox-smoke",
            testMatch: CROSS_BROWSER_SPEC,
            use: {
              ...devices["Desktop Firefox"],
              headless: true,
            },
          },
          {
            name: "msedge-smoke",
            testMatch: CROSS_BROWSER_SPEC,
            use: {
              channel: "msedge",
              headless: true,
              viewport: { width: 1280, height: 800 },
            },
          },
          {
            name: "responsive-1280",
            testMatch: CROSS_BROWSER_SPEC,
            use: {
              channel: "chrome",
              headless: false,
              viewport: { width: 1280, height: 800 },
            },
          },
        ]
      : []),
  ],
});
