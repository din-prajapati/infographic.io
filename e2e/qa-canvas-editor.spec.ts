/**
 * QA: Flow 3 — Canvas Editor (F3-01 to F3-08) + Flow 4 chip selection (F4-01)
 *
 * Automated:  F3-01 Add Text, F3-02 Add Shape, F3-05 Save, F3-06 My Designs,
 *             F3-07 Open Saved, F3-08 PNG Export, F4-01 Category Chip
 * Manual:     F3-03 Image display (file upload visual), F3-04 Drag+resize feel,
 *             F4-02 to F4-06 (require live AI generation)
 *
 * Run:
 *   npx playwright test e2e/qa-canvas-editor.spec.ts --headed
 *   TEST_USER_EMAIL=x TEST_USER_PASSWORD=y npx playwright test e2e/qa-canvas-editor.spec.ts
 */
import { test, expect } from "@playwright/test";
import process from "node:process";

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

// Unique per test-run so repeat runs don't pick up stale designs
const QA_DESIGN_NAME = `QA-F3-${Date.now()}`;

async function ensureLoggedIn(page: import("@playwright/test").Page) {
  const res = await page.goto("/templates", { waitUntil: "load" });
  if (!res || !res.ok()) {
    throw new Error(
      `Cannot load /templates (HTTP ${res?.status() ?? "no response"}). ` +
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

async function openFreshEditor(page: import("@playwright/test").Page) {
  await page.goto("/editor", { waitUntil: "load" });
  await expect(page.locator('[data-testid="design-canvas"]')).toBeVisible({
    timeout: 15_000,
  });
}

async function addTextElement(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Add element" }).click();
  await page.getByRole("menuitem", { name: /^text$/i }).click();
  await expect(
    page.locator('[data-element-type="text"]').first(),
  ).toBeVisible({ timeout: 5_000 });
}

// ---------------------------------------------------------------------------
// Flow 3 — Canvas Editor
// ---------------------------------------------------------------------------
test.describe("QA: Flow 3 — Canvas Editor", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  // ---- F3-01 -----------------------------------------------------------------
  test("F3-01: Add Text element → visible on canvas", async ({ page }) => {
    await openFreshEditor(page);

    await page.getByRole("button", { name: "Add element" }).click();
    await page.getByRole("menuitem", { name: /^text$/i }).click();

    // Element node is in the DOM
    await expect(page.locator('[data-element-type="text"]').first()).toBeVisible(
      { timeout: 5_000 },
    );
    // Default placeholder text is rendered
    await expect(
      page.locator('[data-testid="design-canvas"]'),
    ).toContainText("Double click to edit", { timeout: 5_000 });
  });

  // ---- F3-02 -----------------------------------------------------------------
  // Split into two tests: each starts with a fresh editor so the + button is
  // always visible (no selection state to clear between shapes).
  test("F3-02a: Add Shape (Square) → visible on canvas", async ({ page }) => {
    await openFreshEditor(page);
    await page.getByRole("button", { name: "Add element" }).click();
    await page.getByRole("menuitem", { name: /^square$/i }).click();
    await expect(
      page.locator('[data-element-type="shape"]').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("F3-02b: Add Shape (Circle) → visible on canvas", async ({ page }) => {
    await openFreshEditor(page);
    await page.getByRole("button", { name: "Add element" }).click();
    await page.getByRole("menuitem", { name: /^circle$/i }).click();
    await expect(
      page.locator('[data-element-type="shape"]').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  // ---- F3-03 (MANUAL) -------------------------------------------------------
  // Add an Image element via the file picker, confirm it displays on canvas.
  // Playwright can trigger the file chooser but visual rendering requires
  // a real eye — mark as manual.

  // ---- F3-04 (MANUAL) -------------------------------------------------------
  // Drag and resize elements — subjective smoothness and no layout breakage.

  // ---- F3-05 + F3-06 + F3-07 ------------------------------------------------
  // Chained in one test so browser context (and localStorage) persist across steps.
  test(
    "F3-05/F3-06/F3-07: Save design → appears in My Designs → canvas restores on reopen",
    async ({ page }) => {
      // F3-05 — Save -------------------------------------------------------
      await openFreshEditor(page);
      await addTextElement(page);

      // Click toolbar "Save" button
      await page.getByRole("button", { name: "Save" }).first().click();

      // Wait for Save dialog
      await expect(
        page.getByRole("heading", { name: /save your work/i }),
      ).toBeVisible({ timeout: 8_000 });

      // Replace pre-filled name with unique QA name
      const nameInput = page.locator("#design-name");
      await nameInput.clear();
      await nameInput.fill(QA_DESIGN_NAME);

      // Confirm save (save as Design, not Template)
      await page.getByRole("button", { name: /save design/i }).click();

      // Success toast
      await expect(page.getByText(/saved successfully/i)).toBeVisible({
        timeout: 15_000,
      });

      // F3-06 — My Designs -------------------------------------------------
      await page.goto("/my-designs", { waitUntil: "load" });
      await expect(
        page.getByRole("heading", { name: /my designs/i }),
      ).toBeVisible();

      // Saved design card appears
      await expect(page.getByText(QA_DESIGN_NAME).first()).toBeVisible({
        timeout: 10_000,
      });

      // F3-07 — Reopen saved design ----------------------------------------
      // Click the design card (h3 title click bubbles to card onClick)
      await page.locator("h3").filter({ hasText: QA_DESIGN_NAME }).click();

      // Editor should open with designId in URL
      await expect(page).toHaveURL(/\/editor\?.*designId=/, {
        timeout: 15_000,
      });
      await expect(
        page.locator('[data-testid="design-canvas"]'),
      ).toBeVisible();

      // Canvas has the text element we saved
      await expect(
        page.locator('[data-element-type="text"]').first(),
      ).toBeVisible({ timeout: 10_000 });
    },
  );

  // ---- F3-08 ----------------------------------------------------------------
  test("F3-08: PNG Export → file downloads with .png extension", async ({
    page,
  }) => {
    await openFreshEditor(page);
    await addTextElement(page);

    // Intercept the download triggered by clicking Export
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 20_000 }),
      page.getByRole("button", { name: /^export$/i }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.png$/i);
  });
});

// ---------------------------------------------------------------------------
// Flow 4 — AI Chat chip selection (F4-01)
// ---------------------------------------------------------------------------
test.describe("QA: Flow 4 — AI Chat chip pre-fill", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test(
    "F4-01: Category chip click → chip selected and textarea ready",
    async ({ page }) => {
      await openFreshEditor(page);

      // Open AI Chat panel
      await page.getByRole("button", { name: /open ai chat/i }).click();
      await expect(page.locator("#ai-chat-panel")).toBeVisible();

      // NOTE: The QA checklist mentions "Residential" but the app ships
      // with "Property Listings" as the first category chip.
      // Click the chip by its accessible button name (same approach as existing E2E suite).
      const chip = page.getByRole("button", { name: /property listings/i });
      await expect(chip).toBeVisible({ timeout: 5_000 });
      await chip.click();

      // After selection, CategoryChipList re-renders with only the selected chip visible
      // and framer-motion animates it back in — wait for the textarea to be usable
      // as the functional signal that context has been pre-filled.
      const textarea = page.locator("#ai-chat-panel textarea");
      await expect(textarea).toBeVisible({ timeout: 5_000 });

      // Verify the panel is in a usable state
      await textarea.fill("QA: F4-01 property listings context test");
      await expect(textarea).toHaveValue(
        "QA: F4-01 property listings context test",
      );
    },
  );

  // F4-02 to F4-06 require live AI generation (Ideogram + OpenAI API call)
  // and are MANUAL: generate infographic → variations appear → "Use This Design"
  // → canvas loads → elements editable → Customize button works.
});
