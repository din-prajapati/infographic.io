import { test, expect } from "@playwright/test";

/**
 * Smoke tests for /pricing + payment API wiring.
 * Full Razorpay card checkout still requires manual QA (third-party modal).
 *
 * Run: npm run test:e2e -- e2e/pricing-payments.spec.ts
 * Requires: dev server (playwright.config starts `npm run dev` locally).
 */

test.describe("Pricing & payment smoke", () => {
  test("pricing page loads and shows core plans", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });

    // No page title heading — top nav + segment toggle + plan cards (PricingPage.tsx)
    await expect(page.locator("nav").getByRole("link", { name: "Pricing", exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: "Individual" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Enterprise" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Solo", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Enterprise" }).click();
    await expect(page.getByRole("heading", { name: "Team", exact: true })).toBeVisible();
  });

  test("provider-info request succeeds when API is up", async ({ page }) => {
    const res = page.waitForResponse(
      (r) => r.url().includes("/api/v1/payments/provider-info") && r.status() < 500,
      { timeout: 45_000 },
    );
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });
    const response = await res;
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json).toHaveProperty("provider");
  });
});
