/**
 * US-AI-039 — Format Picker: Canva-style single-modal reorg
 *
 * First automated coverage of this component (AC9). Existing specs reach the
 * editor via direct page.goto("/editor") and bypass the format picker entirely
 * — confirmed by grep: none reference this flow.
 *
 * Covers:
 *   TC-AI-039-01  Rail shows all platform groups + Custom size, no Continue button
 *   TC-AI-039-02  Click "Facebook" in rail → Facebook tiles appear inline
 *   TC-AI-039-03  Click a tile → "Start Blank" + library grid inline, no navigation
 *   TC-AI-039-04  Click "Custom size" in rail → form appears; submit 900×1200 → editor
 *
 * Run:
 *   npx playwright test e2e/us-ai-039-format-picker-reorg.spec.ts --headed
 *   TEST_USER_EMAIL=x TEST_USER_PASSWORD=y npx playwright test e2e/us-ai-039-format-picker-reorg.spec.ts
 */

import { test, expect } from "@playwright/test";
import process from "node:process";

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

// Auth helper — reused from qa-canvas-editor.spec.ts fixture pattern.
async function ensureLoggedIn(page: import("@playwright/test").Page) {
  const res = await page.goto("/my-designs", { waitUntil: "load" });
  if (!res || !res.ok()) {
    throw new Error(
      `Cannot load /my-designs (HTTP ${res?.status() ?? "no response"}). ` +
        `Start the app: npm run dev`,
    );
  }
  if (page.url().includes("/auth")) {
    if (!email || !password) {
      test.skip(
        true,
        "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env or shell.",
      );
    }
    await page.getByTestId("input-email").fill(email!);
    await page.getByTestId("input-password").fill(password!);
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 30_000 });
  }
}

// Opens the Format Picker via the "New Design" button on /my-designs.
async function openFormatPicker(page: import("@playwright/test").Page) {
  // Ensure on My Designs page (auth guard may have redirected there already).
  if (!page.url().includes("/my-designs")) {
    await page.goto("/my-designs", { waitUntil: "load" });
  }
  await page.getByRole("button", { name: "New Design" }).click();
  // Wait for the dialog to be present.
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 8_000 });
}

// ---------------------------------------------------------------------------
// US-AI-039 — Format Picker reorg
// ---------------------------------------------------------------------------
test.describe("US-AI-039: Format Picker — Canva-style single-modal reorg", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  // ---- TC-AI-039-01 --------------------------------------------------------
  test(
    "TC-AI-039-01: dialog shows rail with all platform groups + Custom size, no Continue button",
    async ({ page }) => {
      await openFormatPicker(page);
      const dialog = page.getByRole("dialog");

      // Rail must contain every FORMAT_TAXONOMY platform group.
      const expectedCategories = [
        "Instagram",
        "Facebook",
        "Print",
        "Email",
        "Other",
        "Custom size",
      ];
      for (const cat of expectedCategories) {
        await expect(
          dialog.getByRole("button", { name: cat }),
        ).toBeVisible({ timeout: 5_000 });
      }

      // The old step-based "Continue" button must be gone (AC1).
      await expect(
        dialog.getByRole("button", { name: "Continue" }),
      ).not.toBeVisible();
    },
  );

  // ---- TC-AI-039-02 --------------------------------------------------------
  test(
    "TC-AI-039-02: clicking Facebook in rail shows Facebook format tiles inline",
    async ({ page }) => {
      await openFormatPicker(page);
      const dialog = page.getByRole("dialog");

      // Click "Facebook" in the rail.
      await dialog.getByRole("button", { name: "Facebook" }).click();

      // Facebook-specific tiles must appear inside the same dialog (AC2).
      // "Post" and "Cover" are unique to the Facebook group in the taxonomy.
      await expect(
        dialog.getByRole("button", { name: "Cover" }),
      ).toBeVisible({ timeout: 5_000 });

      // Dialog must still be open — no step transition (AC1).
      await expect(dialog).toBeVisible();

      // No "Continue" button (AC1 — regression check).
      await expect(
        dialog.getByRole("button", { name: "Continue" }),
      ).not.toBeVisible();
    },
  );

  // ---- TC-AI-039-03 --------------------------------------------------------
  test(
    "TC-AI-039-03: selecting a format tile reveals inline library without navigation",
    async ({ page }) => {
      await openFormatPicker(page);
      const dialog = page.getByRole("dialog");

      // Navigate to Facebook to get a tile with a distinctive name.
      await dialog.getByRole("button", { name: "Facebook" }).click();

      // Record current URL before selecting a tile.
      const urlBefore = page.url();

      // Click the "Cover" tile.
      await dialog.getByRole("button", { name: "Cover" }).click();

      // "Start Blank" must appear inline in the same dialog (AC3).
      await expect(
        dialog.getByRole("button", { name: "Start Blank" }),
      ).toBeVisible({ timeout: 5_000 });

      // URL must not have changed — no page navigation happened (AC3).
      expect(page.url()).toBe(urlBefore);

      // Dialog still open.
      await expect(dialog).toBeVisible();

      // No "Continue" button (AC1 — regression check).
      await expect(
        dialog.getByRole("button", { name: "Continue" }),
      ).not.toBeVisible();
    },
  );

  // ---- TC-AI-039-04 --------------------------------------------------------
  test(
    "TC-AI-039-04: Custom size rail item → submit 900×1200 → editor opens",
    async ({ page }) => {
      await openFormatPicker(page);
      const dialog = page.getByRole("dialog");

      // Click "Custom size" in the rail (AC4).
      await dialog.getByRole("button", { name: "Custom size" }).click();

      // Width/height inputs must be visible inside the same dialog.
      await expect(dialog.locator("#custom-width")).toBeVisible({
        timeout: 5_000,
      });
      await expect(dialog.locator("#custom-height")).toBeVisible();

      // No "Continue" button gating the form (AC1).
      await expect(
        dialog.getByRole("button", { name: "Continue" }),
      ).not.toBeVisible();

      // Fill in dimensions.
      await dialog.locator("#custom-width").fill("900");
      await dialog.locator("#custom-height").fill("1200");

      // Submit — should close dialog and navigate to the editor.
      await dialog
        .getByRole("button", { name: "Start with this size" })
        .click();

      await expect(page).toHaveURL(/\/editor/, { timeout: 15_000 });
    },
  );
});
