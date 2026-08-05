/**
 * US-PANEL-01 — Right Panel: brand indicator + honest no-brand default
 *
 * Covers:
 *   TC-PANEL-01-01  AC1 happy-path  — selected palette → name + 5 dots
 *   TC-PANEL-01-02  AC2 null-input  — fresh editor → "None — select in Design tab"
 *   TC-PANEL-01-03  AC2 null-input  — clicking the "None" indicator activates the Design tab
 *   TC-PANEL-01-04  AC1 happy-path  — switching palettes updates the indicator, no reload
 *   TC-PANEL-01-08  AC4 error-path  — malformed localStorage palette → "None", no crash
 *   TC-PANEL-01-09  AC5 happy-path  — Quick Styles copy points at the post-generation flow
 *
 * Run:
 *   npx playwright test e2e/us-panel-01-brand-indicator.spec.ts --headed
 *   TEST_USER_EMAIL=x TEST_USER_PASSWORD=y npx playwright test e2e/us-panel-01-brand-indicator.spec.ts
 */

import { test, expect, type Page } from "@playwright/test";
import process from "node:process";

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

const CUSTOM_PALETTES_KEY = "custom-brand-palettes";

// Auth helper — same fixture pattern as us-ai-039/040/042, including the
// `redirect_to_auth` trap those specs documented.
async function ensureLoggedIn(page: Page) {
  const res = await page.goto("/my-designs", { waitUntil: "load" });
  if (!res || !res.ok()) {
    throw new Error(
      `Cannot load /my-designs (HTTP ${res?.status() ?? "no response"}). ` +
        `Start the app: npm run dev`,
    );
  }
  if (page.url().includes("/auth")) {
    if (!email || !password) {
      test.skip(true, "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env or shell.");
    }
    await page.getByTestId("input-email").fill(email!);
    await page.getByTestId("input-password").fill(password!);
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 30_000 });
    await page.goto("/my-designs", { waitUntil: "load" });
    if (page.url().includes("/auth")) {
      await page.evaluate(() => localStorage.removeItem("redirect_to_auth"));
      await page.goto("/my-designs", { waitUntil: "load" });
    }
    await expect(page, "still on /auth after login — session did not stick")
      .not.toHaveURL(/\/auth/, { timeout: 15_000 });
  }
}

/** Land in the editor with a known-clean palette state. */
async function openEditor(page: Page, seedCustomPalettes?: unknown) {
  await page.goto("/editor", { waitUntil: "load" });
  await page.evaluate(
    ({ key, seed }) => {
      if (seed === undefined) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(seed));
    },
    { key: CUSTOM_PALETTES_KEY, seed: seedCustomPalettes },
  );
  // Palettes are read once on mount — reload so the seed above is what the panel sees.
  await page.reload({ waitUntil: "load" });
  await expect(page.getByTestId("brand-indicator")).toBeVisible({ timeout: 20_000 });
}

const indicator = (page: Page) => page.getByTestId("brand-indicator");
const indicatorName = (page: Page) => page.getByTestId("brand-indicator-name");
const indicatorDots = (page: Page) => page.getByTestId("brand-indicator-dot");

// ---------------------------------------------------------------------------
test.describe("US-PANEL-01: right-panel brand indicator", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  // ---- TC-PANEL-01-02 ------------------------------------------------------
  test(
    "TC-PANEL-01-02: fresh editor shows no brand selected (AC2)",
    async ({ page }) => {
      await openEditor(page);

      // D1: nothing is auto-selected, so a generation cannot silently carry a
      // palette the agent never chose.
      await expect(indicatorName(page)).toHaveText("None — select in Design tab");
      await expect(indicatorDots(page)).toHaveCount(0);
    },
  );

  // ---- TC-PANEL-01-01 ------------------------------------------------------
  test(
    "TC-PANEL-01-01: selecting a palette shows its name and swatches (AC1)",
    async ({ page }) => {
      await openEditor(page);

      await page.getByRole("button", { name: /Modern Blue/ }).click();

      await expect(indicatorName(page)).toHaveText("Modern Blue");
      // Modern Blue has 5 colours; the indicator caps at 5.
      await expect(indicatorDots(page)).toHaveCount(5);
    },
  );

  // ---- TC-PANEL-01-04 ------------------------------------------------------
  test(
    "TC-PANEL-01-04: switching palettes updates the indicator in place (AC1)",
    async ({ page }) => {
      await openEditor(page);

      await page.getByRole("button", { name: /Modern Blue/ }).click();
      await expect(indicatorName(page)).toHaveText("Modern Blue");

      await page.getByRole("button", { name: /Natural Green/ }).click();
      await expect(indicatorName(page)).toHaveText("Natural Green");

      // No navigation occurred — still the same editor document.
      await expect(page).toHaveURL(/\/editor/);
    },
  );

  // ---- TC-PANEL-01-03 ------------------------------------------------------
  test(
    "TC-PANEL-01-03: clicking the empty indicator activates the Design tab (AC2)",
    async ({ page }) => {
      await openEditor(page);

      // Move away from Design first, otherwise the assertion proves nothing —
      // Design is the default tab.
      await page.getByRole("button", { name: "Property", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Brand Styles" })).toBeHidden();

      await indicator(page).click();

      await expect(page.getByRole("heading", { name: "Brand Styles" })).toBeVisible({
        timeout: 5_000,
      });
    },
  );

  // ---- TC-PANEL-01-08 ------------------------------------------------------
  test(
    "TC-PANEL-01-08: a malformed stored palette degrades to the None state (AC4)",
    async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      // The realistic corruption shapes: empty colours, null colours, and a
      // half-written entry with no colours key at all.
      await openEditor(page, [
        { id: "broken-empty", name: "Broken Empty", colors: [], description: "" },
        { id: "broken-null", name: "Broken Null", colors: null, description: "" },
        { id: "broken-missing", name: "Broken Missing", description: "" },
      ]);

      // Panel rendered, indicator present, still reporting no brand.
      await expect(indicatorName(page)).toHaveText("None — select in Design tab");

      // Unusable palettes are dropped at load rather than offered as cards that
      // would throw on `colors[0]` during render.
      for (const name of ["Broken Empty", "Broken Null", "Broken Missing"]) {
        await expect(page.getByRole("button", { name: new RegExp(name) })).toHaveCount(0);
      }

      // The panel is still alive and the built-in palettes still work.
      await expect(page.getByRole("heading", { name: "Brand Styles" })).toBeVisible();
      await page.getByRole("button", { name: /Modern Blue/ }).click();
      await expect(indicatorName(page)).toHaveText("Modern Blue");
      expect(
        consoleErrors.filter((e) => /palette|colors|undefined is not/i.test(e)),
        `unexpected console errors: ${consoleErrors.join(" | ")}`,
      ).toHaveLength(0);
    },
  );

  // ---- TC-PANEL-01-09 ------------------------------------------------------
  test(
    "TC-PANEL-01-09: Quick Styles copy points at the post-generation flow (AC5)",
    async ({ page }) => {
      await openEditor(page);

      await expect(
        page.getByText("Add styled text to your canvas after loading a generated design."),
      ).toBeVisible();

      // The old copy implied Quick Styles were tied to generation — it must be gone.
      await expect(
        page.getByText("Quickly add pre-styled text elements to your canvas"),
      ).toHaveCount(0);
    },
  );
});
