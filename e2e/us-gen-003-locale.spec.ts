/**
 * US-GEN-003 — locale-aware output formatting (client surface).
 *
 * Covers:
 *   TC-GEN-003-10  AC6 — locale chip reflects the resolved locale; clicking it overrides
 *   TC-GEN-003-11  AC7 — placeholder follows the locale instead of teaching "$450,000"
 *   TC-GEN-003-12  AC4 — an unsupported market is never blocked
 *
 * Run (see the US-PANEL-01 runtime note — do NOT reuse a stale dev server):
 *   BROWSER=none npx vite --port 5200 --strictPort
 *   PLAYWRIGHT_BASE_URL=http://localhost:5200 \
 *     npx playwright test e2e/us-gen-003-locale.spec.ts --project=chrome-headed
 */

import { test, expect, type Page } from "@playwright/test";
import process from "node:process";

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

async function ensureLoggedIn(page: Page) {
  const res = await page.goto("/my-designs", { waitUntil: "load" });
  if (!res || !res.ok()) {
    throw new Error(
      `Cannot load /my-designs (HTTP ${res?.status() ?? "no response"}). Start the app.`,
    );
  }
  if (page.url().includes("/auth")) {
    if (!email || !password) {
      test.skip(true, "Set TEST_USER_EMAIL and TEST_USER_PASSWORD.");
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
  }
}

/** Land in the editor with the Property tab open — the locale chip lives beside Price. */
async function openPropertyTab(page: Page) {
  await page.goto("/editor", { waitUntil: "load" });
  await page.getByRole("button", { name: "Property", exact: true }).click();
  await expect(page.getByTestId("locale-indicator")).toBeVisible({ timeout: 20_000 });
}

const chip = (page: Page) => page.getByTestId("locale-indicator-label");
const priceField = (page: Page) => page.locator("#price");

// ---------------------------------------------------------------------------
test.describe("US-GEN-003: locale-aware output", () => {
  test.describe("from an India timezone", () => {
    test.use({ timezoneId: "Asia/Kolkata" });

    test(
      "TC-GEN-003-11: the price placeholder follows the locale, not the dollar (AC7)",
      async ({ page }) => {
        await ensureLoggedIn(page);
        await openPropertyTab(page);

        // The old fixed "$450,000" taught the wrong currency into the very field
        // the resolver reads.
        await expect(priceField(page)).toHaveAttribute("placeholder", "₹85,00,000");
      },
    );

    test(
      "TC-GEN-003-10: chip reflects the resolved locale and can be overridden (AC6)",
      async ({ page }) => {
        await ensureLoggedIn(page);
        await openPropertyTab(page);

        // Resolved from timezone, flagged as automatic.
        await expect(chip(page)).toContainText("en-IN");
        await expect(chip(page)).toContainText("(auto)");

        // A typed ₹ resolves the same way but is no longer "auto" once overridden.
        await priceField(page).fill("₹85,00,000");
        await expect(chip(page)).toContainText("₹");

        // Cycle: auto → en-IN (explicit) → en-US.
        await page.getByTestId("locale-indicator").click();
        await expect(chip(page)).toContainText("en-IN");
        await expect(chip(page)).not.toContainText("(auto)");

        await page.getByTestId("locale-indicator").click();
        await expect(chip(page)).toContainText("en-US");
        await expect(chip(page)).toContainText("$");
      },
    );
  });

  test.describe("from an unsupported market", () => {
    test.use({ timezoneId: "Asia/Dubai" });

    test(
      "TC-GEN-003-12: an unsupported currency is echoed, never blocked (AC4)",
      async ({ page }) => {
        await ensureLoggedIn(page);
        await openPropertyTab(page);

        await priceField(page).fill("AED 1,200,000");

        // Passthrough: we have no AED table entry, so we say so plainly and keep
        // the agent's own currency rather than inventing one.
        await expect(chip(page)).toContainText("AED");
        await expect(chip(page)).toContainText("as typed");
        await expect(chip(page)).not.toContainText("$");

        // Nothing about the unsupported market disables generation.
        const generate = page.getByRole("button", { name: /Quick Generate/i });
        await expect(generate).toBeEnabled();
      },
    );
  });
});
