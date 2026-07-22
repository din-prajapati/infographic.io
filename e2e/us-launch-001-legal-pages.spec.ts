/**
 * US-LAUNCH-001 — Legal & policy pages (E2E)
 *
 * Public pages, no auth required. Covers:
 *   TC-LAUNCH-001-01 (routes render, no 404, no auth redirect)
 *   TC-LAUNCH-001-02 (footer links navigate)
 *   TC-LAUNCH-001-04 (no horizontal scroll at 375px)
 *
 * Run: npx playwright test e2e/us-launch-001-legal-pages.spec.ts
 */
import { test, expect } from "@playwright/test";

const legalPages = [
  { path: "/terms", heading: "Terms of Service" },
  { path: "/privacy", heading: "Privacy Policy" },
  { path: "/refund-policy", heading: "Refund & Cancellation Policy" },
  { path: "/cookies", heading: "Cookie Policy" },
];

test.describe("US-LAUNCH-001 — legal & policy pages", () => {
  // AC1 — TC-LAUNCH-001-01
  for (const { path, heading } of legalPages) {
    test(`TC-LAUNCH-001-01 [P0] ${path} renders public content (no 404, no auth redirect)`, async ({ page }) => {
      await page.goto(path, { waitUntil: "load" });
      // stayed on the page — not bounced to /auth by a ProtectedRoute
      await expect(page).toHaveURL(new RegExp(`${path.replace("/", "\\/")}$`));
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(page.getByText("404 - Page Not Found")).toHaveCount(0);
      // US-LAUNCH-011: brand must say "Buildographic" in nav and footer
      await expect(page.getByRole("navigation").getByText("Buildographic")).toBeVisible();
      await expect(page.locator("footer")).toContainText("Buildographic");
    });
  }

  // AC4 — TC-LAUNCH-001-02 (footer links on the public pricing page).
  // Asserted by href, not display text: AC4 requires links *to* the three pages,
  // and the copy varies across footers ("Refund & Cancellation" vs "…Policy").
  test("TC-LAUNCH-001-02 [P0] footer links point to and navigate to all three legal pages", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "load" });
    for (const { path } of legalPages) {
      await expect(page.locator(`a[href="${path}"]`).first()).toBeVisible();
    }
    // click-through one to prove navigation works end-to-end
    await page.locator('a[href="/privacy"]').first().click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
  });

  // AC5 — TC-LAUNCH-001-04
  test("TC-LAUNCH-001-04 [P1] no horizontal scroll at 375px on any legal page", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    for (const { path } of legalPages) {
      await page.goto(path, { waitUntil: "load" });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(2);
    }
  });
});
