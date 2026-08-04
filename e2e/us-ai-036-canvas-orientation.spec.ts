/**
 * US-AI-036 — Canvas-aware generation orientation (E2E)
 *
 * Run:
 *   npx playwright test e2e/us-ai-036-canvas-orientation.spec.ts
 *
 * Coverage:
 *   TC-036-04 (UI-only)   — AI Chat orientation picker defaults to canvas format;
 *                           manual override is respected. No generation call.
 *   TC-036-02+03 (real $) — Instagram Story template (portrait 1080×1920) →
 *                           Quick Generate → "Use This" → image inserted as a
 *                           layer inside the existing canvas (dimensions unchanged).
 *   TC-036-05 (real $)    — Blank canvas → Quick Generate → "Use This" →
 *                           canvas auto-resized to AI artboard preset (not a layer).
 *
 * Real spend: TC-036-02+03 and TC-036-05 each make ONE live Ideogram call
 * (~$0.03-0.08). No retries. If either generation call fails the test fails
 * immediately — do not loop.
 *
 * Selectors used:
 *   [data-canvas-container]        — artboard div; inline style.width/height =
 *                                    canvasWidth/Height (pre-zoom native px).
 *   [data-testid="design-canvas"]  — inner artboard content div
 *   button[title="Square"]         — orientation toggle in AI Chat icon bar
 *   button[title="Landscape"]      — orientation toggle in AI Chat icon bar
 *   #address / #price              — PropertyDetailsForm inputs (htmlFor labels)
 *   button "Quick Generate"        — RightSidebar sticky generate button
 *   button "Use This"              — RightSidebar result card primary action
 */

import { test, expect, type Page } from "@playwright/test";
import process from "node:process";

// ─────────────────────────────────────────────────────────────────────────────
// AI artboard presets (must stay in sync with canvasState.ts AI_ARTBOARDS)
// ─────────────────────────────────────────────────────────────────────────────
const AI_ARTBOARDS = {
  landscape: { width: 1280, height: 720 },
  portrait: { width: 720, height: 1280 },
  square: { width: 1024, height: 1024 },
} as const;

const AI_ARTBOARD_KEYS = Object.keys(AI_ARTBOARDS) as Array<keyof typeof AI_ARTBOARDS>;

function isAiArtboard(width: number, height: number): boolean {
  return AI_ARTBOARD_KEYS.some(
    (k) => AI_ARTBOARDS[k].width === width && AI_ARTBOARDS[k].height === height,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read the artboard's native pixel dimensions from the canvas container's
 * inline style. These are canvasWidth x canvasHeight before zoom is applied,
 * so they match the Zustand store values exactly.
 */
async function getCanvasDims(
  page: Page,
): Promise<{ width: number; height: number } | null> {
  return page.evaluate(() => {
    const el = document.querySelector(
      "[data-canvas-container]",
    ) as HTMLElement | null;
    if (!el) return null;
    const w = parseInt(el.style.width, 10);
    const h = parseInt(el.style.height, 10);
    if (!w || !h) return null;
    return { width: w, height: h };
  });
}

/**
 * Poll until the canvas container reports the expected native pixel dimensions.
 * Uses page.waitForFunction so it survives re-renders without a timeout race.
 */
async function waitForCanvasDims(
  page: Page,
  expected: { width: number; height: number },
  timeout = 30_000,
): Promise<void> {
  await page.waitForFunction(
    ({ w, h }: { w: number; h: number }) => {
      const el = document.querySelector(
        "[data-canvas-container]",
      ) as HTMLElement | null;
      if (!el) return false;
      return (
        parseInt(el.style.width, 10) === w &&
        parseInt(el.style.height, 10) === h
      );
    },
    { w: expected.width, h: expected.height },
    { timeout },
  );
}

/**
 * Shared login helper. Idempotent: no-ops if already authenticated.
 * Always lands on /templates with the gallery heading visible.
 */
async function ensureLoggedIn(page: Page): Promise<void> {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    test.skip(
      true,
      "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env (loaded by playwright.config) or the shell.",
    );
    return;
  }

  const authHeading = page.getByRole("heading", { name: /welcome back/i });
  const galleryHeading = page.getByRole("heading", {
    name: /template gallery/i,
  });

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await page.goto("/templates", {
      waitUntil: "domcontentloaded",
    });
    if (!res || !res.ok()) {
      throw new Error(
        `Cannot reach /templates (HTTP ${res?.status() ?? "no response"}). Is the app running?`,
      );
    }

    await expect(authHeading.or(galleryHeading)).toBeVisible({
      timeout: 30_000,
    });

    if (await authHeading.isVisible()) {
      await page.getByTestId("input-email").fill(email);
      await page.getByTestId("input-password").fill(password);
      await page.getByRole("button", { name: /^login$/i }).click();
      try {
        await expect(page).not.toHaveURL(/\/auth/, { timeout: 30_000 });
      } catch {
        if (attempt === 1)
          test.skip(
            true,
            "Login failed — check TEST_USER_EMAIL / TEST_USER_PASSWORD.",
          );
        continue;
      }
      if (!page.url().includes("/templates")) {
        await page.goto("/templates", { waitUntil: "domcontentloaded" });
      }
    }

    if (page.url().includes("/auth") || (await authHeading.isVisible())) {
      if (attempt === 1)
        test.skip(true, "Still on /auth after login attempt.");
      continue;
    }

    await expect(galleryHeading).toBeVisible({ timeout: 30_000 });
    return;
  }
}

/**
 * Find a template card by exact h3 title text and open it in the editor.
 * Caller must already be on /templates with the gallery visible.
 * Returns false when the card is not in the gallery (caller should test.skip).
 */
async function openTemplateByTitle(
  page: Page,
  title: string,
): Promise<boolean> {
  await expect(
    page.getByRole("heading", { name: /template gallery/i }),
  ).toBeVisible({ timeout: 30_000 });

  // Premium templates are fetched async from the DB — wait for at least one
  // card to appear before searching.
  await expect(page.locator(".glass").first()).toBeVisible({ timeout: 30_000 });

  // Find the card whose h3 text matches the requested template title.
  const card = page
    .locator(".glass")
    .filter({ has: page.locator("h3").filter({ hasText: title }) })
    .first();

  if ((await card.count()) === 0) {
    return false;
  }

  const useBtn = card.getByRole("button", { name: "Use Template" });
  await useBtn.scrollIntoViewIfNeeded();
  await useBtn.click();

  await expect(page).toHaveURL(/\/editor/, { timeout: 30_000 });
  await expect(
    page.locator('[data-testid="design-canvas"]'),
  ).toBeVisible({ timeout: 30_000 });

  return true;
}

/**
 * Fill in the minimum required property fields (address + price) so Quick
 * Generate passes its client-side validation in RightSidebar.handleGenerate().
 * Switches to the "Property" tab first.
 */
async function fillPropertyDetails(page: Page): Promise<void> {
  // The Property tab button text is exactly "Property".
  await page.locator("button").filter({ hasText: /^Property$/ }).click();

  // Inputs are identified by their HTML id attributes (stable; driven by label htmlFor).
  await page.locator("#address").fill("123 Ocean Drive, Miami, FL 33139");
  await page.locator("#price").fill("$750,000");
}

// ─────────────────────────────────────────────────────────────────────────────
// Test suite
// ─────────────────────────────────────────────────────────────────────────────

test.describe("US-AI-036 — Canvas-aware generation orientation", () => {
  test.beforeEach(async ({ page }) => {
    // Staging Railway cold-start can take ~15-20s; give navigation extra room.
    page.setDefaultNavigationTimeout(90_000);
    await ensureLoggedIn(page);
    // After ensureLoggedIn the page is at /templates with gallery visible.
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TC-036-04 — UI only, zero cost
  //
  // Open a Square-format template, open AI Chat, verify the orientation picker
  // defaults to "Square" (AC2). Then manually switch to "Landscape" and verify
  // the override is respected (AC6). No generation call is made.
  // ───────────────────────────────────────────────────────────────────────────
  test(
    "TC-036-04: AI Chat orientation picker defaults to Square on a square-format template, and Landscape override is respected",
    async ({ page }) => {
      // UI-only test. Give generous time for staging cold-start + template load.
      test.setTimeout(180_000);

      // Contract:
      //   Given:   "Instagram Square" template loaded (square canvas ~1:1 ratio).
      //   When:    AI Chat panel is opened.
      //   Expect:  Square orientation button has active CSS class (bg-emerald-500).
      //   When:    User clicks the Landscape button.
      //   Expect:  Landscape carries active class (bg-blue-500); Square does not.
      //   No generation call must fire at any point.

      const found = await openTemplateByTitle(page, "Instagram Square");
      if (!found) {
        test.skip(
          true,
          "TC-036-04: \"Instagram Square\" template not in gallery — " +
            "run api/scripts/seed-premium-templates.ts against staging.",
        );
        return;
      }

      // Wait for the template canvas to load with a square (~1:1) aspect ratio.
      await page.waitForFunction(
        () => {
          const el = document.querySelector(
            "[data-canvas-container]",
          ) as HTMLElement | null;
          if (!el) return false;
          const w = parseInt(el.style.width, 10);
          const h = parseInt(el.style.height, 10);
          if (!w || !h) return false;
          const r = w / h;
          return r > 0.9 && r < 1.1;
        },
        undefined,
        { timeout: 30_000 },
      );

      const dims = await getCanvasDims(page);
      expect(dims).not.toBeNull();
      const ratio = dims!.width / dims!.height;
      expect(ratio).toBeGreaterThan(0.9);
      expect(ratio).toBeLessThan(1.1);

      // Open AI Chat panel via the floating button.
      await page.getByRole("button", { name: /open ai chat/i }).click();
      await expect(page.locator("#ai-chat-panel")).toBeVisible();

      // Scope orientation toggles to the chat panel to avoid any page-level conflicts.
      const panel = page.locator("#ai-chat-panel");
      const squareBtn = panel.locator('button[title="Square"]');
      const landscapeBtn = panel.locator('button[title="Landscape"]');

      await expect(squareBtn).toBeVisible();
      await expect(landscapeBtn).toBeVisible();

      // Default must be Square — the AIChatBox sets generationOrientation via
      // deriveOrientationFromCanvas(canvasWidth, canvasHeight) on open.
      // Active square button carries the bg-emerald-500/15 background class.
      await expect(squareBtn).toHaveClass(/bg-emerald-500/);

      // Landscape must NOT be the active default.
      await expect(landscapeBtn).not.toHaveClass(/bg-blue-500\/15/);

      // --- Manual override: user clicks Landscape ---
      await landscapeBtn.click();

      // Landscape is now active (bg-blue-500/15).
      await expect(landscapeBtn).toHaveClass(/bg-blue-500/);
      // Square is no longer active.
      await expect(squareBtn).not.toHaveClass(/bg-emerald-500\/15/);
    },
  );

  // ───────────────────────────────────────────────────────────────────────────
  // TC-036-02 + TC-036-03 — Real Ideogram call (~$0.03-0.08). ONE call max.
  //
  // "Instagram Story" template (portrait 1080x1920):
  //   TC-036-02 — Quick Generate derives portrait orientation from canvas.
  //   TC-036-03 — "Use This" inserts AI image as a layer inside the existing
  //               canvas. Canvas dimensions remain 1080x1920 (AC3).
  // ───────────────────────────────────────────────────────────────────────────
  test(
    "TC-036-02+03: Instagram Story — Quick Generate inserts AI image as a layer; canvas stays 1080x1920",
    async ({ page }) => {
      // Real Ideogram call. Budget: login ~60s + template ~20s + generate ~120s + assert ~30s = 230s.
      test.setTimeout(300_000);

      // Contract:
      //   Given:   "Instagram Story" template loaded (1080x1920, has elements
      //            → hasDeliberateOrigin = true).
      //   When:    Quick Generate completes and "Use This" is clicked.
      //   Expect:  Canvas dimensions remain 1080x1920 (insert-as-layer, AC3).
      //   Expect:  At least one <img> is visible on the canvas.
      //   NO retry on generation failure — cost guardrail.

      const found = await openTemplateByTitle(page, "Instagram Story");
      if (!found) {
        test.skip(
          true,
          "TC-036-02+03: \"Instagram Story\" template not found — " +
            "run api/scripts/seed-premium-templates.ts against staging.",
        );
        return;
      }

      // Wait for the portrait template canvas (1080x1920) to materialise in the DOM.
      await waitForCanvasDims(page, { width: 1080, height: 1920 });

      const initialDims = await getCanvasDims(page);
      expect(initialDims).not.toBeNull();
      expect(initialDims!.width).toBe(1080);
      expect(initialDims!.height).toBe(1920);

      // Fill required property fields.
      await fillPropertyDetails(page);

      // Click Quick Generate (sticky button in RightSidebar header).
      const generateBtn = page.getByRole("button", { name: /quick generate/i });
      await expect(generateBtn).toBeVisible();
      await generateBtn.click();

      // Wait for the real generation to complete (up to 2 minutes for Ideogram).
      // Signal: first "Use This" variation button appears.
      const useThisBtn = page
        .getByRole("button", { name: /^use this$/i })
        .first();
      await expect(useThisBtn).toBeVisible({ timeout: 120_000 });

      // Canvas must still be portrait at this point (before applying result).
      const midDims = await getCanvasDims(page);
      expect(midDims!.width).toBe(1080);
      expect(midDims!.height).toBe(1920);

      // Apply the first variation.
      await useThisBtn.click();

      // Wait for the "Design loaded" success toast (fired by handleUseDesign
      // after loadAiVariationToCanvas resolves).
      await expect(page.getByText(/design loaded/i)).toBeVisible({
        timeout: 30_000,
      });

      // ── Primary assertion: canvas dimensions UNCHANGED (insert-as-layer) ──
      const finalDims = await getCanvasDims(page);
      expect(finalDims).not.toBeNull();
      expect(finalDims!.width).toBe(1080);
      expect(finalDims!.height).toBe(1920);

      // ── Secondary: AI image element is visible on the canvas ──
      const canvasImages = page.locator('[data-testid="design-canvas"] img');
      await expect(canvasImages.first()).toBeVisible({ timeout: 15_000 });
    },
  );

  // ───────────────────────────────────────────────────────────────────────────
  // TC-036-05 — Real Ideogram call (~$0.03-0.08). ONE call max.
  //
  // Blank canvas (no template, elements=[], canvasOrigin=null):
  //   Quick Generate → "Use This" → canvas auto-resized to AI_ARTBOARDS
  //   preset (hasDeliberateOrigin = false → unchanged behavior per AC4).
  // ───────────────────────────────────────────────────────────────────────────
  test(
    "TC-036-05: Blank canvas — Quick Generate auto-resizes canvas to AI artboard (not insert-as-layer) [LIVE ~$0.03-0.08]",
    async ({ page }) => {
      // Real Ideogram call. Budget: generate ~120s + navigate ~30s + assert ~30s = 180s.
      test.setTimeout(300_000);

      // Contract:
      //   Given:   /editor opened without templateId. Store initial state:
      //            elements=[], canvasOrigin=null, canvasWidth=1200, canvasHeight=800.
      //            → hasDeliberateOrigin = false.
      //   When:    Quick Generate completes and "Use This" is clicked.
      //   Expect:  Canvas dimensions change from 1200x800 to one of the
      //            AI_ARTBOARDS presets: 1280x720, 720x1280, or 1024x1024 (AC4).
      //   Expect:  At least one <img> is visible on the canvas.
      //   NO retry on generation failure — cost guardrail.

      // Full navigation to /editor resets the JS runtime and gives a clean store.
      await page.goto("/editor", { waitUntil: "domcontentloaded" });

      // Safety: handle unlikely auth redirect (JWT should still be valid).
      if (page.url().includes("/auth")) {
        await ensureLoggedIn(page);
        await page.goto("/editor", { waitUntil: "domcontentloaded" });
      }

      await expect(
        page.locator('[data-testid="design-canvas"]'),
      ).toBeVisible({ timeout: 30_000 });

      // Confirm blank canvas initial dimensions (Zustand store default).
      const initialDims = await getCanvasDims(page);
      expect(initialDims).not.toBeNull();
      expect(initialDims!.width).toBe(1200);
      expect(initialDims!.height).toBe(800);

      // Fill required property fields.
      await fillPropertyDetails(page);

      // Click Quick Generate.
      const generateBtn = page.getByRole("button", { name: /quick generate/i });
      await expect(generateBtn).toBeVisible();
      await generateBtn.click();

      // Wait for the real generation to complete (up to 2 minutes).
      const useThisBtn = page
        .getByRole("button", { name: /^use this$/i })
        .first();
      await expect(useThisBtn).toBeVisible({ timeout: 120_000 });

      // Apply the first variation.
      await useThisBtn.click();

      // Wait for the "Design loaded" toast.
      await expect(page.getByText(/design loaded/i)).toBeVisible({
        timeout: 30_000,
      });

      // ── Primary assertion: canvas auto-resized to an AI artboard preset ──
      const finalDims = await getCanvasDims(page);
      expect(finalDims).not.toBeNull();

      // Must have changed from the blank canvas default.
      const isStillBlankDefault =
        finalDims!.width === 1200 && finalDims!.height === 800;
      expect(
        isStillBlankDefault,
        "Canvas was not resized after Use This on a blank canvas — " +
          "auto-resize branch (AC4) may not have fired.",
      ).toBe(false);

      // Must match one of the three AI artboard presets.
      const matchesPreset = isAiArtboard(finalDims!.width, finalDims!.height);
      expect(
        matchesPreset,
        `Expected canvas to match an AI artboard preset (1280x720 / 720x1280 / 1024x1024). ` +
          `Got ${finalDims!.width}x${finalDims!.height}.`,
      ).toBe(true);

      // ── Secondary: AI image element is visible on the canvas ──
      const canvasImages = page.locator('[data-testid="design-canvas"] img');
      await expect(canvasImages.first()).toBeVisible({ timeout: 15_000 });
    },
  );
});
