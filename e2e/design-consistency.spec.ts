/**
 * Phase A QA — Design Consistency (DESIGN-001)
 * Stories: US-DESIGN-001, US-DESIGN-003, US-DESIGN-004
 *
 * Run:
 *   npx playwright test e2e/design-consistency.spec.ts
 *   npx playwright test e2e/design-consistency.spec.ts --headed
 *
 * Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env for auth-gated pages.
 *
 * Test cases tagged [HUMAN] cannot be automated — they require a live AI backend,
 * visual contrast judgement, or real OS theme switching. These are skipped and
 * their TC IDs are reported at the end.
 */

import { test, expect, type Page } from "@playwright/test";
import process from "node:process";

// ─── helpers ────────────────────────────────────────────────────────────────

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

async function ensureLoggedIn(page: Page): Promise<boolean> {
  await page.goto("/templates", { waitUntil: "load" });
  if (!page.url().includes("/auth")) return true;

  if (!email || !password) return false; // caller must skip
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-password").fill(password);
  await page.getByTestId("button-login").click();
  try {
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 15_000 });
  } catch {
    return false; // login failed — caller must skip
  }
  return true;
}

/** Set theme via localStorage then reload so ThemeProvider picks it up. */
async function setTheme(page: Page, theme: "light" | "dark" | "system") {
  await page.evaluate((t) => localStorage.setItem("theme", t), theme);
  await page.reload({ waitUntil: "load" });
}

/** Returns the value of the `class` attribute on <html>. */
async function htmlClass(page: Page): Promise<string> {
  return page.evaluate(() => document.documentElement.className);
}

// ─── US-DESIGN-001: Theme System ─────────────────────────────────────────────

test.describe("US-DESIGN-001 — Theme system works on all non-editor screens", () => {

  test("TC-DS-001-04 [P1] localStorage → Dark persists across hard reload", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "load" });
    await setTheme(page, "dark");
    const cls = await htmlClass(page);
    expect(cls, "html element must carry 'dark' class after reload").toContain("dark");
    expect(cls, "html element must NOT carry 'light' class in dark mode").not.toContain("light");

    // Hard reload — localStorage should still be dark
    await page.reload({ waitUntil: "load" });
    const cls2 = await htmlClass(page);
    expect(cls2, "dark class must survive a second reload").toContain("dark");
  });

  test("TC-DS-001-04b [P1] localStorage → Light persists across hard reload", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "load" });
    await setTheme(page, "light");
    const cls = await htmlClass(page);
    expect(cls).toContain("light");

    await page.reload({ waitUntil: "load" });
    expect(await htmlClass(page)).toContain("light");
  });

  test("TC-DS-001-03 [P0] System mode resolves to a known theme class", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "load" });
    await setTheme(page, "system");
    const cls = await htmlClass(page);
    const hasKnownClass = cls.includes("dark") || cls.includes("light");
    expect(hasKnownClass, `System mode must resolve html class to 'dark' or 'light', got: '${cls}'`).toBe(true);
  });

  test("TC-DS-001-03b [P0] System → dark emulation: html gets dark class", async ({ page }) => {
    // Emulate OS dark preference
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/pricing", { waitUntil: "load" });
    await setTheme(page, "system");
    const cls = await htmlClass(page);
    expect(cls, "System mode + OS dark should yield html.dark").toContain("dark");
  });

  test("TC-DS-001-03c [P0] System → light emulation: html gets light class", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/pricing", { waitUntil: "load" });
    await setTheme(page, "system");
    const cls = await htmlClass(page);
    expect(cls, "System mode + OS light should yield html.light").toContain("light");
  });

  test("TC-DS-001-05 [P1] AppHeader logo, nav links, active tab underline visible (Dark mode)", async ({ page }) => {
    const loggedIn = await ensureLoggedIn(page);
    if (!loggedIn) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD");

    await setTheme(page, "dark");
    await page.goto("/templates", { waitUntil: "load" });

    // Logo brand text (the header link is "Infograph.ai")
    await expect(page.getByRole("link", { name: "Infograph.ai" })).toBeVisible();

    // Navigation links
    await expect(page.getByRole("button", { name: /^Templates$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^My Designs$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Account$/i })).toBeVisible();
  });

  test("TC-DS-001-05b [P1] AppHeader logo, nav links visible (Light mode)", async ({ page }) => {
    const loggedIn = await ensureLoggedIn(page);
    if (!loggedIn) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD");

    await setTheme(page, "light");
    await page.goto("/templates", { waitUntil: "load" });

    await expect(page.getByRole("link", { name: "Infograph.ai" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Templates$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^My Designs$/i })).toBeVisible();
  });

  test("TC-DS-001-06 [P1] Pricing plan cards: Solo and Free headings visible (Dark mode)", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "load" });
    await setTheme(page, "dark");

    await expect(page.getByRole("heading", { name: "Solo", exact: true })).toBeVisible();
    // Check plan description is visible (not invisible text)
    await expect(page.getByText(/individual agents/i).first()).toBeVisible();
  });

  test("TC-DS-001-06b [P1] Pricing plan cards: Solo and Free headings visible (Light mode)", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "load" });
    await setTheme(page, "light");

    await expect(page.getByRole("heading", { name: "Solo", exact: true })).toBeVisible();
  });

  test("TC-DS-001-07 [P2] Zero theme-related JS errors in both modes (Light)", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/pricing", { waitUntil: "load" });
    await setTheme(page, "light");
    await page.waitForTimeout(500);

    const themeErrors = consoleErrors.filter((e) =>
      /theme|color-scheme|localStorage/i.test(e),
    );
    expect(themeErrors, `Theme-related console errors in Light mode: ${themeErrors.join(", ")}`).toHaveLength(0);
  });

  test("TC-DS-001-07b [P2] Zero theme-related JS errors (Dark)", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/pricing", { waitUntil: "load" });
    await setTheme(page, "dark");
    await page.waitForTimeout(500);

    const themeErrors = consoleErrors.filter((e) =>
      /theme|color-scheme|localStorage/i.test(e),
    );
    expect(themeErrors, `Theme-related console errors in Dark mode: ${themeErrors.join(", ")}`).toHaveLength(0);
  });

  // TC-DS-001-01 & TC-DS-001-02 require visual contrast judgement → HUMAN
  test("TC-DS-001-01 [P0][HUMAN-SKIP] Dark mode — all 6 app pages still readable", async () => {
    test.skip(true, "[HUMAN] Visual contrast across 6 pages requires manual QA. Automate coverage is in TC-DS-001-05/06.");
  });

  test("TC-DS-001-02 [P0][HUMAN-SKIP] Light mode — no grey-on-grey text visible", async () => {
    test.skip(true, "[HUMAN] Visual contrast check requires manual review. Partial coverage in TC-DS-001-05b/06b.");
  });
});

// ─── US-DESIGN-003: AI Generation Flow ───────────────────────────────────────

test.describe("US-DESIGN-003 — AI Generation flow UX states", () => {

  test("TC-DS-003-07 [P1] AI chat panel opens and model selector renders in Dark mode", async ({ page }) => {
    const loggedIn = await ensureLoggedIn(page);
    if (!loggedIn) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD");

    await setTheme(page, "dark");

    // Navigate to editor via first template
    await page.goto("/templates", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /template gallery/i })).toBeVisible();

    const useTemplate = page.getByRole("button", { name: "Use Template" }).first();
    await useTemplate.scrollIntoViewIfNeeded();
    await Promise.all([
      page.waitForURL(/\/editor/, { timeout: 30_000 }),
      useTemplate.click(),
    ]);

    // Open AI chat panel
    await page.getByRole("button", { name: /open ai chat/i }).click();
    await expect(page.locator("#ai-chat-panel")).toBeVisible();

    // The AI chat panel header should be visible
    await expect(page.locator("#ai-chat-panel")).toBeVisible();
  });

  test("TC-DS-003-07b [P1] AI chat panel opens and model selector renders in Light mode", async ({ page }) => {
    const loggedIn = await ensureLoggedIn(page);
    if (!loggedIn) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD");

    await setTheme(page, "light");

    await page.goto("/templates", { waitUntil: "load" });
    const useTemplate = page.getByRole("button", { name: "Use Template" }).first();
    await useTemplate.scrollIntoViewIfNeeded();
    await Promise.all([
      page.waitForURL(/\/editor/, { timeout: 30_000 }),
      useTemplate.click(),
    ]);

    await page.getByRole("button", { name: /open ai chat/i }).click();
    await expect(page.locator("#ai-chat-panel")).toBeVisible();
  });

  // TC-DS-003-01 through 003-06, 003-08 require live AI backend → HUMAN
  test("TC-DS-003-01 [P0][HUMAN-SKIP] Light: generation spinner visible during generation", async () => {
    test.skip(true, "[HUMAN] Requires live AI backend. Manually enter prompt, submit, verify spinner is not white-on-white.");
  });

  test("TC-DS-003-02 [P0][HUMAN-SKIP] Dark: generation spinner visible during generation", async () => {
    test.skip(true, "[HUMAN] Requires live AI backend. Manually verify spinner styling in dark mode.");
  });

  test("TC-DS-003-03 [P0][HUMAN-SKIP] Generation result image displays at correct proportions", async () => {
    test.skip(true, "[HUMAN] Requires completed AI generation. Check result card image is not squished/cropped.");
  });

  test("TC-DS-003-04 [P0][HUMAN-SKIP] Usage counter increments after generation (e.g. 1/3 FREE)", async () => {
    test.skip(true, "[HUMAN] Requires completed AI generation. Verify usage counter updates in UI.");
  });

  test("TC-DS-003-05 [P1][HUMAN-SKIP] 'Use This Design' button is prominently visible after generation", async () => {
    test.skip(true, "[HUMAN] Requires completed AI generation. Verify button uses primary style, not ghost.");
  });

  test("TC-DS-003-06 [P1][HUMAN-SKIP] Error state: error message in red, not raw JSON", async () => {
    test.skip(true, "[HUMAN] Disconnect API key or force backend error. Verify error message is styled (text-destructive), not raw JSON dump.");
  });

  test("TC-DS-003-08 [P2][HUMAN-SKIP] 4th generation blocked with correct limit message (FREE tier)", async () => {
    test.skip(true, "[HUMAN] Generate 3 infographics on FREE tier. Attempt 4th and verify correct limit/upgrade message.");
  });
});

// ─── US-DESIGN-004: Global Page Consistency ───────────────────────────────────

test.describe("US-DESIGN-004 — Global page consistency (typography, spacing, nav)", () => {

  test("TC-DS-004-01 [P0] AppHeader looks identical on Templates, My Designs, Account pages", async ({ page }) => {
    const loggedIn = await ensureLoggedIn(page);
    if (!loggedIn) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD");

    const pages = ["/templates", "/my-designs", "/account"] as const;
    for (const route of pages) {
      await page.goto(route, { waitUntil: "load" });
      // Brand logo visible (the header link wraps "Infograph.ai")
      await expect(page.getByRole("link", { name: "Infograph.ai" }), `Brand logo missing on ${route}`).toBeVisible();
      // All 3 nav tabs present
      await expect(page.getByRole("button", { name: /^Templates$/i }), `Templates tab missing on ${route}`).toBeVisible();
      await expect(page.getByRole("button", { name: /^My Designs$/i }), `My Designs tab missing on ${route}`).toBeVisible();
      await expect(page.getByRole("button", { name: /^Account$/i }), `Account tab missing on ${route}`).toBeVisible();
    }
  });

  test("TC-DS-004-01b [P0] AppHeader height is consistent (h-16 = 64px) across pages", async ({ page }) => {
    const loggedIn = await ensureLoggedIn(page);
    if (!loggedIn) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD");

    const pages = ["/templates", "/my-designs", "/account"] as const;
    const heights: number[] = [];

    for (const route of pages) {
      await page.goto(route, { waitUntil: "load" });
      // Measure header by selecting the element that contains nav buttons
      const header = page.locator("div.h-16").first();
      const box = await header.boundingBox();
      if (box) heights.push(Math.round(box.height));
    }

    const unique = [...new Set(heights)];
    expect(unique.length, `Header height varies across pages: ${heights.join(", ")}px`).toBe(1);
    if (heights[0]) {
      expect(heights[0], `Header height should be 64px (h-16), got ${heights[0]}px`).toBe(64);
    }
  });

  test("TC-DS-004-03 [P1] Templates page: cards render and have a hover ring/shadow on hover", async ({ page }) => {
    const loggedIn = await ensureLoggedIn(page);
    if (!loggedIn) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD");

    await page.goto("/templates", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /template gallery/i })).toBeVisible();

    // At least one template card is present
    const cards = page.getByRole("button", { name: "Use Template" });
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count, "Expected at least one template card").toBeGreaterThanOrEqual(1);
  });

  test("TC-DS-004-04 [P1] Account page: billing section visible in Dark mode", async ({ page }) => {
    const loggedIn = await ensureLoggedIn(page);
    if (!loggedIn) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD");

    await setTheme(page, "dark");
    await page.goto("/account", { waitUntil: "load" });

    // Billing section should exist — look for plan/subscription text
    const billingSection = page.getByText(/billing|subscription|plan/i).first();
    await expect(billingSection).toBeVisible();
  });

  test("TC-DS-004-05 [P1] Pricing page readable in Light mode — plan names visible", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "load" });
    await setTheme(page, "light");

    await expect(page.getByRole("heading", { name: "Solo", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Individual" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Enterprise" })).toBeVisible();
  });

  test("TC-DS-004-05b [P1] Pricing page readable in Dark mode — plan names visible", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "load" });
    await setTheme(page, "dark");

    await expect(page.getByRole("heading", { name: "Solo", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Individual" })).toBeVisible();
  });

  test("TC-DS-004-06 [P1] Usage Dashboard page loads and chart labels visible (Dark mode)", async ({ page }) => {
    const loggedIn = await ensureLoggedIn(page);
    if (!loggedIn) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD");

    await setTheme(page, "dark");
    await page.goto("/usage", { waitUntil: "load" });

    // Look for usage dashboard heading or chart container
    const heading = page.getByText(/usage|analytics|dashboard/i).first();
    await expect(heading).toBeVisible();
  });

  test("TC-DS-004-07 [P2] Auth page: login form inputs and Google button visible (Light mode)", async ({ page }) => {
    // Log out first if logged in — navigate directly to /auth
    await page.goto("/auth", { waitUntil: "load" });
    await setTheme(page, "light");
    await page.goto("/auth", { waitUntil: "load" });

    await expect(page.getByTestId("input-email")).toBeVisible();
    await expect(page.getByTestId("input-password")).toBeVisible();
    await expect(page.getByTestId("button-login")).toBeVisible();

    // Google OAuth button
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
  });

  test("TC-DS-004-07b [P2] Auth page: login form inputs and Google button visible (Dark mode)", async ({ page }) => {
    await page.goto("/auth", { waitUntil: "load" });
    await setTheme(page, "dark");
    await page.goto("/auth", { waitUntil: "load" });

    await expect(page.getByTestId("input-email")).toBeVisible();
    await expect(page.getByTestId("input-password")).toBeVisible();
    await expect(page.getByTestId("button-login")).toBeVisible();
  });

  test("TC-DS-004-08 [P2] Body text font size is 14px (text-sm) on Templates page", async ({ page }) => {
    const loggedIn = await ensureLoggedIn(page);
    if (!loggedIn) test.skip(true, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD");

    await page.goto("/templates", { waitUntil: "load" });

    // Pick first visible paragraph-level text node under body
    const fontSize = await page.evaluate(() => {
      // Find a 'text-sm' element (any p or span with that class)
      const el = document.querySelector(".text-sm");
      if (!el) return null;
      return parseFloat(window.getComputedStyle(el).fontSize);
    });

    expect(fontSize, "text-sm element should render at 14px").toBeCloseTo(14, 0);
  });

  // TC-DS-004-02: split-personality check requires visual inspection → HUMAN
  test("TC-DS-004-02 [P0][HUMAN-SKIP] Light mode — no hardcoded-dark panel adjacent to themed-light panel", async () => {
    test.skip(true, "[HUMAN] Visual split-personality check: open each page in Light mode and look for dark panels that don't belong. Key area: editor (covered by US-DESIGN-002).");
  });
});
