/**
 * Flow 6 — Cross-Browser Smoke
 *
 * QA Checklist rows covered:
 *   F6-01  chrome-headed project   — Chrome, Flows 1+3 smoke
 *   F6-02  firefox-smoke project   — Firefox, page-load smoke
 *   F6-03  msedge-smoke project    — Edge, page-load smoke
 *   F6-04  responsive-1280 project — 1280×800 viewport, layout smoke
 *
 * Run all four browsers:
 *   npx playwright test e2e/flow6-cross-browser-smoke.spec.ts
 *
 * Run a single browser:
 *   npx playwright test e2e/flow6-cross-browser-smoke.spec.ts --project=firefox-smoke
 *
 * Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.
 */
import { test, expect } from "@playwright/test";
import process from "node:process";

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

async function ensureLoggedIn(page: import("@playwright/test").Page) {
  const res = await page.goto("/templates", { waitUntil: "load" });
  if (!res || !res.ok()) {
    throw new Error(
      `Cannot load /templates (HTTP ${res?.status() ?? "no response"}). Is the app running? ${process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000"}`,
    );
  }

  const galleryHeading = page.getByRole("heading", { name: /template gallery/i });

  // React's useEffect auth check fires after the `load` event — the URL may
  // still show /templates when `goto()` returns, then redirect to /auth a few
  // milliseconds later. Wait up to 5s for the gallery; if it doesn't appear,
  // assume the SPA redirected to /auth and proceed with login.
  const onTemplates = await galleryHeading
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false);

  if (!onTemplates) {
    // Auth redirect in progress — wait for the login form to settle
    await expect(page.getByTestId("input-email")).toBeVisible({ timeout: 10_000 });

    if (!email || !password) {
      test.skip(
        true,
        "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env to run cross-browser smoke.",
      );
    }
    await page.getByTestId("input-email").fill(email!);
    await page.getByTestId("input-password").fill(password!);
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 30_000 });
    await page.goto("/templates", { waitUntil: "load" });
  }

  // Always block until gallery is rendered — callers can trust the page is ready
  await expect(galleryHeading).toBeVisible({ timeout: 20_000 });
}

test.describe("Flow 6 — Cross-Browser Smoke", () => {
  // F6-S1: /auth page loads without crashing — no login needed
  test("F6-S1: /auth page — email input, password input, Google button visible", async ({
    page,
  }) => {
    await page.goto("/auth", { waitUntil: "load" });
    await expect(page.getByTestId("input-email")).toBeVisible();
    await expect(page.getByTestId("input-password")).toBeVisible();
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
  });

  // F6-S2: /templates page loads — template gallery heading + at least one card
  test("F6-S2: /templates page — gallery heading and template cards visible", async ({
    page,
  }) => {
    await ensureLoggedIn(page);
    await expect(
      page.getByRole("heading", { name: /template gallery/i }),
    ).toBeVisible();
    // At least one "Use Template" button means cards rendered
    await expect(
      page.getByRole("button", { name: /use template/i }).first(),
    ).toBeVisible();
  });

  // F6-S3: /editor page navigable — canvas element renders
  test("F6-S3: /editor page — design canvas renders after opening a template", async ({
    page,
  }) => {
    await ensureLoggedIn(page);
    const useTemplate = page
      .getByRole("button", { name: /use template/i })
      .first();
    await useTemplate.scrollIntoViewIfNeeded();
    await Promise.all([
      page.waitForURL(/\/editor\?.*templateId=/, { timeout: 30_000 }),
      useTemplate.click(),
    ]);
    await expect(
      page.locator('[data-testid="design-canvas"]'),
    ).toBeVisible();
  });

  // F6-S4: No horizontal overflow — important for the responsive-1280 project
  test("F6-S4: /templates — no horizontal scrollbar (layout not broken)", async ({
    page,
  }) => {
    await ensureLoggedIn(page);
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    // Allow ≤5px rounding from sub-pixel rendering
    expect(overflow).toBeLessThanOrEqual(5);
  });
});
