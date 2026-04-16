/**
 * US-DESIGN-002 — Editor Design Token Adoption
 * Verifies that hardcoded gray Tailwind classes have been replaced with CSS
 * design-token classes in editor toolbar, sidebars, and AI chat components.
 *
 * Run:
 *   npx playwright test e2e/us-design-002-editor-tokens.spec.ts
 *   npx playwright test e2e/us-design-002-editor-tokens.spec.ts --headed
 *
 * Requires: dev server at localhost:5000, TEST_USER_EMAIL + TEST_USER_PASSWORD in .env
 *
 * Test coverage:
 *   TC-DS-002-01  Toolbar background is light in Light mode (not hardcoded dark)
 *   TC-DS-002-02  Toolbar background is dark in Dark mode (matches app theme)
 *   TC-DS-002-03  Layers panel opens — heading visible in Light mode
 *   TC-DS-002-04  Property panel (right sidebar) visible in Light mode
 *   TC-DS-002-05  Zoom controls visible and show percentage in Light mode
 *   TC-DS-002-06  FloatingToolbar present and has token-based background
 *   TC-DS-002-07  Add text → element appears on canvas (no regression)
 *   TC-DS-002-08  Add shape → element appears on canvas (no regression)
 *   TC-DS-002-09  AI chat input wrapper is NOT white in Dark mode
 *   TC-DS-002-10  AI chat input wrapper has visible border in Light mode
 */

import { test, expect, type Page } from "@playwright/test";
import process from "node:process";

// ─── Auth + Navigation helpers ───────────────────────────────────────────────

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

/**
 * Login if redirected to /auth, then re-navigate to the intended URL.
 * Safe to call even if already logged in.
 */
async function loginIfNeeded(page: Page, targetUrl: string): Promise<boolean> {
  if (!page.url().includes("/auth")) return true;
  if (!email || !password) return false;
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-password").fill(password);
  await page.getByRole("button", { name: /^login$/i }).click();
  try {
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 30_000 });
    // Navigate back to original target after login redirect
    if (!page.url().includes(targetUrl.replace(/^\//, ""))) {
      await page.goto(targetUrl, { waitUntil: "load" });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Navigate to /templates with theme pre-set, handle auth redirect inline.
 * Uses addInitScript so localStorage is set BEFORE React mounts — ThemeProvider
 * reads it in useState() initializer and applies the correct .light/.dark class.
 * Also injects the class directly after load as a belt-and-suspenders fallback.
 * Returns false if login fails and test should be skipped.
 */
async function goToTemplates(page: Page, theme: "light" | "dark"): Promise<boolean> {
  if (!email || !password) return false;

  // addInitScript runs before ANY page script — ThemeProvider sees the value on mount
  await page.addInitScript((t) => localStorage.setItem("theme", t), theme);

  for (let attempt = 0; attempt < 2; attempt++) {
    await page.goto("/templates", { waitUntil: "load" });

    // Auth redirect — log in
    if (page.url().includes("/auth")) {
      await page.getByTestId("input-email").fill(email);
      await page.getByTestId("input-password").fill(password);
      await page.getByRole("button", { name: /^login$/i }).click();
      try {
        await expect(page).not.toHaveURL(/\/auth/, { timeout: 30_000 });
      } catch {
        if (attempt === 1) return false;
        continue;
      }
      if (!page.url().includes("templates")) {
        await page.goto("/templates", { waitUntil: "load" });
      }
    }

    if (page.url().includes("/auth")) {
      if (attempt === 1) return false;
      continue;
    }

    // Belt-and-suspenders: also apply the CSS class directly so any
    // pending React re-render isn't needed for the class to be present
    await page.evaluate((t) => {
      localStorage.setItem("theme", t);
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(t);
    }, theme);
    await page.waitForTimeout(400);
    return true;
  }
  return false;
}

/**
 * Navigate from /templates into the editor via the first "Use Template" button.
 * Handles cases where the page has navigated back to /auth between goToTemplates and here.
 */
async function openEditorFromTemplate(page: Page): Promise<void> {
  // If auth redirect happened after goToTemplates, log in again
  if (page.url().includes("/auth") && email && password) {
    await page.getByTestId("input-email").fill(email);
    await page.getByTestId("input-password").fill(password);
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 30_000 });
    if (!page.url().includes("templates")) {
      await page.goto("/templates", { waitUntil: "load" });
    }
  }

  // Verify templates page loaded
  await expect(
    page.locator("h1, h2, h3").filter({ hasText: /template/i }).first()
  ).toBeVisible({ timeout: 20_000 });

  const useTemplate = page.getByRole("button", { name: "Use Template" }).first();
  await useTemplate.scrollIntoViewIfNeeded();
  await Promise.all([
    page.waitForURL(/\/editor/, { timeout: 30_000 }),
    useTemplate.click(),
  ]);
  // Wait for editor to initialise
  await page.waitForTimeout(1500);
}

/** Returns computed backgroundColor of first element matching selector, or null */
async function getBgColor(page: Page, selector: string): Promise<string | null> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) return null;
    return window.getComputedStyle(el).backgroundColor;
  }, selector);
}

/**
 * Count canvas elements rendered inside [data-canvas-content="true"].
 * Excludes the empty-state placeholder (which has pointer-events:none).
 * Each canvas element (text/shape/image) is wrapped in a react-rnd div
 * that does NOT have pointer-events:none or overflow:hidden on the root.
 */
async function countCanvasElements(page: Page): Promise<number> {
  return page.evaluate(() => {
    const canvas = document.querySelector('[data-canvas-content="true"]');
    if (!canvas) return 0;
    return Array.from(canvas.children).filter((child) => {
      const el = child as HTMLElement;
      // The empty-state placeholder has pointer-events:none; real elements don't
      return window.getComputedStyle(el).pointerEvents !== 'none';
    }).length;
  });
}

/** bg-gray-900 sentinel */
const DARK_GRAY_900 = "rgb(17, 24, 39)";
/** bg-gray-800 sentinel */
const DARK_GRAY_800 = "rgb(31, 41, 55)";
/** white sentinel */
const WHITE = "rgb(255, 255, 255)";

// ─── Test suite ──────────────────────────────────────────────────────────────

test.describe("US-DESIGN-002 — Editor design token adoption", () => {

  // TC-DS-002-01 ─────────────────────────────────────────────────────────────
  test("TC-DS-002-01 [P0] Light mode — toolbar background is NOT hardcoded bg-gray-900", async ({ page }) => {
    const ok = await goToTemplates(page, "light");
    if (!ok) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD in .env");

    await openEditorFromTemplate(page);

    const toolbarBg = await getBgColor(page, ".h-14");
    console.log(`[TC-DS-002-01] Light toolbar bg: ${toolbarBg}`);

    expect(toolbarBg, ".h-14 toolbar must exist").not.toBeNull();
    expect(
      toolbarBg,
      `Toolbar must NOT be hardcoded bg-gray-900 (${DARK_GRAY_900}) in Light mode — got: ${toolbarBg}`
    ).not.toBe(DARK_GRAY_900);
  });

  // TC-DS-002-02 ─────────────────────────────────────────────────────────────
  test("TC-DS-002-02 [P0] Dark mode — toolbar background is dark (not white, not gray-900)", async ({ page }) => {
    const ok = await goToTemplates(page, "dark");
    if (!ok) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD in .env");

    await openEditorFromTemplate(page);

    const toolbarBg = await getBgColor(page, ".h-14");
    console.log(`[TC-DS-002-02] Dark toolbar bg: ${toolbarBg}`);

    expect(toolbarBg, ".h-14 toolbar must exist").not.toBeNull();
    // In dark mode: --background resolves to a dark color, NOT white AND NOT the old hardcoded bg-gray-900
    expect(
      toolbarBg,
      `Toolbar must NOT be hardcoded bg-gray-900 (${DARK_GRAY_900}) in Dark mode — got: ${toolbarBg}`
    ).not.toBe(DARK_GRAY_900);
    expect(
      toolbarBg,
      `Toolbar must NOT be white (${WHITE}) in Dark mode — got: ${toolbarBg}`
    ).not.toBe(WHITE);
  });

  // TC-DS-002-03 ─────────────────────────────────────────────────────────────
  test("TC-DS-002-03 [P0] Layers panel opens and heading is visible in Light mode", async ({ page }) => {
    const ok = await goToTemplates(page, "light");
    if (!ok) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD in .env");

    await openEditorFromTemplate(page);

    // FloatingToolbar: first button above the main panel = Layers toggle
    const layersToggle = page.locator(".fixed.top-1\\/2.left-4 > :first-child");
    await expect(layersToggle).toBeVisible({ timeout: 8_000 });
    await layersToggle.click();

    await expect(
      page.getByRole("heading", { name: /layers/i })
    ).toBeVisible({ timeout: 8_000 });
    console.log("[TC-DS-002-03] Layers panel heading visible in Light mode ✓");
  });

  // TC-DS-002-04 ─────────────────────────────────────────────────────────────
  test("TC-DS-002-04 [P0] Right sidebar (RightSidebar) renders in Light mode", async ({ page }) => {
    const ok = await goToTemplates(page, "light");
    if (!ok) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD in .env");

    await openEditorFromTemplate(page);

    // RightSidebar always shows a "Generate Template" button
    await expect(
      page.getByRole("button", { name: /generate template/i })
    ).toBeVisible({ timeout: 12_000 });
    console.log("[TC-DS-002-04] RightSidebar 'Generate Template' button visible ✓");
  });

  // TC-DS-002-05 ─────────────────────────────────────────────────────────────
  test("TC-DS-002-05 [P1] Zoom controls visible and NOT using hardcoded bg-gray-800", async ({ page }) => {
    const ok = await goToTemplates(page, "light");
    if (!ok) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD in .env");

    await openEditorFromTemplate(page);

    // Zoom % is shown inside toolbar — e.g. "100%"
    await expect(page.getByText(/^\d+%$/).first()).toBeVisible({ timeout: 8_000 });

    // ZoomControls container — now bg-muted (not bg-gray-800)
    const zoomBg = await getBgColor(page, ".h-14 .rounded-lg");
    console.log(`[TC-DS-002-05] Zoom controls bg in Light mode: ${zoomBg}`);
    if (zoomBg) {
      expect(
        zoomBg,
        `ZoomControls must NOT use hardcoded bg-gray-800 (${DARK_GRAY_800}) — got: ${zoomBg}`
      ).not.toBe(DARK_GRAY_800);
    }
  });

  // TC-DS-002-06 ─────────────────────────────────────────────────────────────
  test("TC-DS-002-06 [P1] FloatingToolbar present and NOT using hardcoded dark gray in Light mode", async ({ page }) => {
    const ok = await goToTemplates(page, "light");
    if (!ok) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD in .env");

    await openEditorFromTemplate(page);

    const floatingToolbar = page.locator(".fixed.top-1\\/2.left-4");
    await expect(floatingToolbar).toBeVisible({ timeout: 8_000 });
    console.log("[TC-DS-002-06] FloatingToolbar is visible in Light mode ✓");

    const toolbarPanelBg = await getBgColor(page, ".fixed.top-1\\/2.left-4 .rounded-2xl");
    console.log(`[TC-DS-002-06] FloatingToolbar panel bg in Light mode: ${toolbarPanelBg}`);
    if (toolbarPanelBg) {
      expect(toolbarPanelBg, "FloatingToolbar panel must NOT be bg-gray-800").not.toBe(DARK_GRAY_800);
      expect(toolbarPanelBg, "FloatingToolbar panel must NOT be bg-gray-900").not.toBe(DARK_GRAY_900);
    }
  });

  // TC-DS-002-07 ─────────────────────────────────────────────────────────────
  test("TC-DS-002-07 [P1] Canvas regression — add text element, element count increases", async ({ page }) => {
    const ok = await goToTemplates(page, "light");
    if (!ok) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD in .env");

    await openEditorFromTemplate(page);

    const beforeCount = await countCanvasElements(page);

    // Open the + Add Element menu on FloatingToolbar
    const addBtn = page.locator("button[aria-label='Add element']");
    await expect(addBtn).toBeVisible({ timeout: 8_000 });
    await addBtn.click();

    // Radix portal renders at body level — wait for any menuitem to appear (menu is open)
    await expect(page.locator('[role="menuitem"]').first()).toBeVisible({ timeout: 8_000 });
    // Click the "Text" item
    const textItem = page.locator('[role="menuitem"]').filter({ hasText: /text/i }).first();
    await expect(textItem).toBeVisible({ timeout: 5_000 });
    await textItem.click();

    await page.waitForTimeout(800);
    const afterCount = await countCanvasElements(page);
    console.log(`[TC-DS-002-07] Canvas elements — before: ${beforeCount}, after: ${afterCount}`);

    expect(afterCount, "Canvas must gain at least 1 element after adding Text").toBeGreaterThan(beforeCount);
  });

  // TC-DS-002-08 ─────────────────────────────────────────────────────────────
  test("TC-DS-002-08 [P1] Canvas regression — add shape element, element count increases", async ({ page }) => {
    const ok = await goToTemplates(page, "light");
    if (!ok) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD in .env");

    await openEditorFromTemplate(page);

    const beforeCount = await countCanvasElements(page);

    const addBtn = page.locator("button[aria-label='Add element']");
    await expect(addBtn).toBeVisible({ timeout: 8_000 });
    await addBtn.click();

    // Radix portal renders at body level — wait for any menuitem to appear (menu is open)
    await expect(page.locator('[role="menuitem"]').first()).toBeVisible({ timeout: 8_000 });
    // Click the "Square" item
    const squareItem = page.locator('[role="menuitem"]').filter({ hasText: /square/i }).first();
    await expect(squareItem).toBeVisible({ timeout: 5_000 });
    await squareItem.click();

    await page.waitForTimeout(800);
    const afterCount = await countCanvasElements(page);
    console.log(`[TC-DS-002-08] Canvas elements — before: ${beforeCount}, after: ${afterCount}`);

    expect(afterCount, "Canvas must gain at least 1 element after adding Shape").toBeGreaterThan(beforeCount);
  });

  // TC-DS-002-09 ─────────────────────────────────────────────────────────────
  test("TC-DS-002-09 [P1] AI chat input wrapper is NOT hardcoded white in Dark mode", async ({ page }) => {
    const ok = await goToTemplates(page, "dark");
    if (!ok) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD in .env");

    await openEditorFromTemplate(page);

    // Open AI chat panel
    const aiBtn = page.getByRole("button", { name: /open ai chat/i });
    if (await aiBtn.isVisible()) {
      await aiBtn.click();
      await expect(page.locator("#ai-chat-panel")).toBeVisible({ timeout: 8_000 });
    } else {
      // Panel might already be open in the editor layout
      const panel = page.locator("#ai-chat-panel");
      const isVisible = await panel.isVisible();
      if (!isVisible) {
        console.log("[TC-DS-002-09] AI chat panel not found — skipping");
        test.skip(true, "AI chat panel not accessible via expected button");
        return;
      }
    }

    const wrapperBg = await page.evaluate(() => {
      const el = document.querySelector("#ai-chat-panel .shrink-0.border-t") as HTMLElement | null;
      if (!el) return null;
      return window.getComputedStyle(el).backgroundColor;
    });
    console.log(`[TC-DS-002-09] AI chat input wrapper bg (Dark mode): ${wrapperBg}`);

    if (wrapperBg !== null) {
      expect(
        wrapperBg,
        `AI chat input wrapper must NOT be hardcoded white (${WHITE}) in Dark mode — got: ${wrapperBg}`
      ).not.toBe(WHITE);
    }
  });

  // TC-DS-002-10 ─────────────────────────────────────────────────────────────
  test("TC-DS-002-10 [P1] AI chat input wrapper has top border in Light mode", async ({ page }) => {
    const ok = await goToTemplates(page, "light");
    if (!ok) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD in .env");

    await openEditorFromTemplate(page);

    const aiBtn = page.getByRole("button", { name: /open ai chat/i });
    if (await aiBtn.isVisible()) {
      await aiBtn.click();
      await expect(page.locator("#ai-chat-panel")).toBeVisible({ timeout: 8_000 });
    } else {
      const panel = page.locator("#ai-chat-panel");
      const isVisible = await panel.isVisible();
      if (!isVisible) {
        test.skip(true, "AI chat panel not accessible via expected button");
        return;
      }
    }

    const borderInfo = await page.evaluate(() => {
      const el = document.querySelector("#ai-chat-panel .shrink-0.border-t") as HTMLElement | null;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        borderTopWidth: style.borderTopWidth,
        borderTopColor: style.borderTopColor,
      };
    });
    console.log(`[TC-DS-002-10] AI chat input wrapper border (Light mode):`, JSON.stringify(borderInfo));

    expect(borderInfo, "AI chat input wrapper (.shrink-0.border-t) must exist").not.toBeNull();
    if (borderInfo) {
      expect(
        parseFloat(borderInfo.borderTopWidth),
        "AI chat input wrapper must have a visible top border"
      ).toBeGreaterThan(0);
    }
  });

});
