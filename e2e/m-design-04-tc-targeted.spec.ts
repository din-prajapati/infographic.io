/**
 * M-DESIGN-04 — Targeted Visual Regression Tests (with auth)
 * TC-DS-007-02 through TC-DS-008-05 on their CORRECT pages
 *
 * Run (headed):
 *   npx playwright test e2e/m-design-04-tc-targeted.spec.ts --headed --reporter=list
 *
 * Credentials: TEST_USER_EMAIL / TEST_USER_PASSWORD in .env (loaded by playwright.config).
 *
 * Auth strategy: POST /api/v1/auth/login → store JWT in localStorage.
 * This avoids React ProtectedRoute hydration timing races that affect UI-based login.
 *
 * Design Notes:
 *  - chip.color / category.color from data files are NOT applied as inline styles by
 *    CategoryChip.tsx — those are data metadata only. Per-chip domain color rendering
 *    is not in the DOM; visual quality requires human judgment.
 *  - TemplateCategoryView is deprecated (not rendered). TC-DS-007-03/04 use source checks.
 */

import { test, expect, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import process from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EMAIL = process.env.TEST_USER_EMAIL;
const PASSWORD = process.env.TEST_USER_PASSWORD;

// ─── Auth: API-based login (bypasses React ProtectedRoute hydration timing) ──

async function loginViaApi(page: Page) {
  if (!EMAIL || !PASSWORD) {
    test.skip(true, "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.");
    return;
  }
  // Hit a public page first so Playwright has a valid origin for localStorage
  await page.goto("/", { waitUntil: "load" });

  // Call the login API directly
  const resp = await page.request.post("/api/v1/auth/login", {
    data: { email: EMAIL, password: PASSWORD },
  });
  if (!resp.ok()) {
    throw new Error(`Login API failed: ${resp.status()} ${await resp.text()}`);
  }
  const { token, user } = await resp.json();

  // Inject JWT into localStorage — AuthProvider reads auth_token + auth_user on mount
  await page.evaluate(
    ({ t, u }) => {
      localStorage.setItem("auth_token", t);
      localStorage.setItem("auth_user", JSON.stringify(u));
    },
    { t: token, u: user },
  );
}

/** Navigate to /templates and wait for template cards (survives Neon cold-start). */
async function goToTemplates(page: Page, theme: "light" | "dark" = "light") {
  await page.evaluate((t) => localStorage.setItem("theme", t), theme);
  await page.goto("/templates", { waitUntil: "load" });
  // Cards may be delayed by Neon DB wake-up or React hydration — use long timeout
  await page.waitForSelector(".glass.rounded-2xl", { timeout: 60_000 });
}

/** Navigate to /editor via Use Template. */
async function goToEditor(page: Page, theme: "light" | "dark" = "light") {
  await page.evaluate((t) => localStorage.setItem("theme", t), theme);
  await page.goto("/templates", { waitUntil: "load" });
  await page.waitForSelector("button:has-text('Use Template')", { timeout: 60_000 });
  const useTemplate = page.getByRole("button", { name: "Use Template" }).first();
  await Promise.all([
    page.waitForURL(/\/editor/, { timeout: 30_000 }),
    useTemplate.click(),
  ]);
}

// ─── CSS helpers ──────────────────────────────────────────────────────────────

async function getCSSVar(page: Page, varName: string): Promise<string> {
  return page.evaluate(
    (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim(),
    varName,
  );
}

function parseColor(raw: string): { r: number; g: number; b: number } | null {
  const hex6 = raw.match(/^#([0-9a-f]{6})$/i);
  if (hex6) {
    const n = parseInt(hex6[1], 16);
    return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
  }
  const rgb = raw.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)/i);
  if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
  return null;
}

function expectColorsClose(actual: string, expected: string, label: string, tolerance = 15) {
  const a = parseColor(actual);
  const e = parseColor(expected);
  if (!a || !e) throw new Error(`${label}: cannot parse — actual="${actual}" expected="${expected}"`);
  expect(Math.abs(a.r - e.r), `${label} R channel off`).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(a.g - e.g), `${label} G channel off`).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(a.b - e.b), `${label} B channel off`).toBeLessThanOrEqual(tolerance);
}

// ─── TC-DS-007-02 — AI Chat chips on /editor ─────────────────────────────────

test.describe("TC-DS-007-02 — AI Chat chips on /editor", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
  });

  test("[P0] All 6 category chip labels are visible in AI chat panel", async ({ page }) => {
    await goToEditor(page, "light");

    // Open AI chat panel
    await page.getByRole("button", { name: /open ai chat/i }).click();
    const panel = page.locator("#ai-chat-panel");
    await expect(panel).toBeVisible({ timeout: 8_000 });

    // CategoryChip buttons have class `whitespace-nowrap` — distinguishes them from
    // other buttons (suggestion chips, input area) that may share the same label text.
    const expectedLabels = [
      "Property Listings",
      "Open House",
      "Just Sold",
      "Agent Branding",
      "Market Stats",
      "Neighborhood",
    ];
    for (const label of expectedLabels) {
      const chip = panel.locator("button.whitespace-nowrap", { hasText: label }).first();
      await expect(chip, `Chip "${label}" must be visible`).toBeVisible({ timeout: 5_000 });
    }
  });

  test("[P0] Chip domain CSS tokens resolve correctly on /editor", async ({ page }) => {
    await goToEditor(page, "light");

    const chipTokens: Array<[string, string]> = [
      ["--chip-property-listings", "#3B82F6"],
      ["--chip-open-house",        "#F97316"],
      ["--chip-just-sold",         "#10B981"],
      ["--chip-agent-branding",    "#F59E0B"],
      ["--chip-market-stats",      "#6366F1"],
      ["--chip-neighborhood",      "#14B8A6"],
    ];
    for (const [token, expectedHex] of chipTokens) {
      const val = await getCSSVar(page, token);
      expect(val, `${token} must be defined on /editor`).not.toBe("");
      expectColorsClose(val, expectedHex, token);
    }
  });

  test("[NOTE] chip.color data field — per-chip visual colors require human eyes", async () => {
    // CategoryChip.tsx renders chips with generic Tailwind classes (border-border,
    // text-muted-foreground when unselected; blue-500 when selected).
    // chip.color field from categoryChipsData.ts is NOT applied as an inline style.
    test.skip(
      true,
      "[FINDING] CategoryChip.tsx does not apply chip.color as an inline style. " +
        "HUMAN: Open AI chat in /editor, verify chips look visually distinct by domain category.",
    );
  });
});

// ─── TC-DS-007-03/04 — TemplateCategoryView (source + finding) ───────────────

test.describe("TC-DS-007-03 — Template category colored header blocks", () => {
  test("[FINDING] TemplateCategoryView is not in the rendered component tree", async () => {
    test.skip(
      true,
      "[FINDING] TemplateCategoryView is deprecated — not rendered per CHANGELOG. " +
        "HUMAN: Open AI chat in /editor and check if colored category header blocks exist visually.",
    );
  });

  test("[P0] Category color CSS tokens resolve on /editor", async ({ page }) => {
    await loginViaApi(page);
    await goToEditor(page, "light");

    const tokens: Array<[string, string]> = [
      ["--category-listing-announcements", "#3B82F6"],
      ["--category-property-features",     "#8B5CF6"],
      ["--category-status-updates",        "#10B981"],
      ["--category-agent-branding",        "#F59E0B"],
    ];
    for (const [token, expectedHex] of tokens) {
      const val = await getCSSVar(page, token);
      expect(val, `${token} must be defined on /editor`).not.toBe("");
      expectColorsClose(val, expectedHex, token);
    }
  });
});

test.describe("TC-DS-007-04 — TemplateCategoryView source checks", () => {
  const filePath = path.resolve(
    __dirname,
    "../client/src/components/ai-chat/TemplateCategoryView.tsx",
  );

  test("[P1] No raw gray-* Tailwind classes in TemplateCategoryView.tsx", () => {
    const source = fs.readFileSync(filePath, "utf-8");
    const grayMatches = source.match(/\bbg-gray-\d+|text-gray-\d+|border-gray-\d+/g);
    expect(grayMatches, `Found gray-* classes: ${JSON.stringify(grayMatches)}`).toBeNull();
  });

  test("[P1] Popular badge uses amber-500/15 (not yellow-500)", () => {
    const source = fs.readFileSync(filePath, "utf-8");
    expect(source, "Popular badge must use amber-500").toContain("amber-500");
    expect(source, "Must NOT use yellow-500").not.toContain("yellow-500");
  });
});

// ─── TC-DS-007-05 — Dark mode chip/category colors on /editor ────────────────

test.describe("TC-DS-007-05 — Dark mode chip/category colors on /editor", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
  });

  test("[P1] All 6 chip tokens defined and distinct in dark mode", async ({ page }) => {
    await goToEditor(page, "dark");

    const chipTokens = [
      "--chip-property-listings",
      "--chip-open-house",
      "--chip-just-sold",
      "--chip-agent-branding",
      "--chip-market-stats",
      "--chip-neighborhood",
    ];
    const values = await Promise.all(chipTokens.map((t) => getCSSVar(page, t)));
    values.forEach((v, i) => expect(v, `${chipTokens[i]} defined in dark`).not.toBe(""));
    const unique = new Set(values.map((v) => v.toUpperCase()));
    expect(unique.size, `All 6 chip tokens distinct — got: ${values.join(", ")}`).toBe(6);
  });

  test("[P1] All 4 category color tokens defined and distinct in dark mode on /editor", async ({
    page,
  }) => {
    await goToEditor(page, "dark");

    const categoryTokens = [
      "--category-listing-announcements",
      "--category-property-features",
      "--category-status-updates",
      "--category-agent-branding",
    ];
    const values = await Promise.all(categoryTokens.map((t) => getCSSVar(page, t)));
    values.forEach((v, i) => expect(v, `${categoryTokens[i]} defined in dark`).not.toBe(""));
    const unique = new Set(values.map((v) => v.toUpperCase()));
    expect(unique.size, "All 4 category tokens distinct").toBe(4);
  });
});

// ─── TC-DS-008-02 — Luxury badge on /templates ───────────────────────────────

test.describe("TC-DS-008-02 — Luxury badge on /templates (light mode)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
  });

  test("[P0] Luxury badge background is deep amber-brown (#92400E)", async ({ page }) => {
    await goToTemplates(page, "light");
    const badge = page.locator(".glass.rounded-2xl").locator("text=Luxury").first();
    await expect(badge, "Luxury badge must be visible").toBeVisible({ timeout: 8_000 });
    const bg = await badge.evaluate((el) => getComputedStyle(el).backgroundColor);
    expectColorsClose(bg, "#92400E", "Luxury badge background");
  });

  test("[P0] Luxury badge text is light amber (#FEF3C7)", async ({ page }) => {
    await goToTemplates(page, "light");
    const badge = page.locator(".glass.rounded-2xl").locator("text=Luxury").first();
    await expect(badge).toBeVisible({ timeout: 8_000 });
    const color = await badge.evaluate((el) => getComputedStyle(el).color);
    expectColorsClose(color, "#FEF3C7", "Luxury badge text");
  });
});

// ─── TC-DS-008-03 — All badge tiers on /templates ────────────────────────────

test.describe("TC-DS-008-03 — All badge tier colors on /templates (light mode)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
  });

  test("[P0] Standard badge is deep navy (#1E3A5F)", async ({ page }) => {
    await goToTemplates(page, "light");
    const badge = page.locator(".glass.rounded-2xl").locator("text=Standard").first();
    await expect(badge).toBeVisible({ timeout: 8_000 });
    const bg = await badge.evaluate((el) => getComputedStyle(el).backgroundColor);
    expectColorsClose(bg, "#1E3A5F", "Standard badge background");
  });

  test("[P0] Budget badge is deep green (#14532D)", async ({ page }) => {
    await goToTemplates(page, "light");
    const badge = page.locator(".glass.rounded-2xl").locator("text=Budget").first();
    await expect(badge).toBeVisible({ timeout: 8_000 });
    const bg = await badge.evaluate((el) => getComputedStyle(el).backgroundColor);
    expectColorsClose(bg, "#14532D", "Budget badge background");
  });

  test("[P0] No badge uses old purple-600 (#9333EA) or blue-600 (#2563EB)", async ({ page }) => {
    await goToTemplates(page, "light");
    const badgeColors = await page.evaluate(() => {
      const colors: string[] = [];
      document.querySelectorAll<HTMLElement>(".glass span, .glass div").forEach((el) => {
        if (el.style.backgroundColor) {
          colors.push(getComputedStyle(el).backgroundColor);
        }
      });
      return colors;
    });
    const banned = ["rgb(147, 51, 234)", "rgb(37, 99, 235)", "rgb(147,51,234)", "rgb(37,99,235)"];
    for (const bg of badgeColors) {
      for (const bad of banned) {
        expect(bg, `Found old hardcoded color ${bad}`).not.toBe(bad);
      }
    }
  });

  test("[P1] Custom badge is deep purple (#4C1D95) — if custom templates exist", async ({
    page,
  }) => {
    await goToTemplates(page, "light");
    const badge = page.locator(".glass.rounded-2xl").locator("text=Custom").first();
    const visible = await badge.isVisible().catch(() => false);
    if (!visible) {
      test.skip(
        true,
        "No Custom badge visible — no user-created templates exist. " +
          "HUMAN: Save a design as template then re-run.",
      );
      return;
    }
    const bg = await badge.evaluate((el) => getComputedStyle(el).backgroundColor);
    expectColorsClose(bg, "#4C1D95", "Custom badge background");
  });
});

// ─── TC-DS-008-04 — Dark mode badge colors on /templates ─────────────────────

test.describe("TC-DS-008-04 — Dark mode badge colors on /templates", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
  });

  test("[P1] All 5 badge bg tokens correct and distinct in dark mode on /templates", async ({
    page,
  }) => {
    await goToTemplates(page, "dark");

    const tokens = [
      ["--badge-luxury-bg",   "#78350F"],
      ["--badge-standard-bg", "#1E3A5F"],
      ["--badge-budget-bg",   "#14532D"],
      ["--badge-custom-bg",   "#3B0764"],
      ["--badge-api-bg",      "#0C2D48"],
    ] as const;

    const values: string[] = [];
    for (const [token, expectedHex] of tokens) {
      const val = await getCSSVar(page, token);
      expect(val, `${token} defined in dark mode`).not.toBe("");
      expectColorsClose(val, expectedHex, `${token} dark`, 20);
      values.push(val.toUpperCase());
    }
    const unique = new Set(values);
    expect(unique.size, `All 5 badge tokens distinct — got: ${values.join(", ")}`).toBe(5);
  });

  test("[P1] Luxury badge renders with dark override (#78350F) on /templates", async ({ page }) => {
    await goToTemplates(page, "dark");
    const badge = page.locator(".glass.rounded-2xl").locator("text=Luxury").first();
    await expect(badge).toBeVisible({ timeout: 8_000 });
    const bg = await badge.evaluate((el) => getComputedStyle(el).backgroundColor);
    expectColorsClose(bg, "#78350F", "Luxury badge dark background", 20);
  });
});

// ─── TC-DS-008-05 — No regression on card elements on /templates ──────────────

test.describe("TC-DS-008-05 — Template card element regression on /templates", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
  });

  test("[P1] At least 8 template cards are visible", async ({ page }) => {
    await goToTemplates(page, "light");
    const count = await page.locator(".glass.rounded-2xl").count();
    expect(count, "At least 8 built-in template cards").toBeGreaterThanOrEqual(8);
  });

  test("[P1] First card has: image, title, description, and Use Template button", async ({
    page,
  }) => {
    await goToTemplates(page, "light");
    const firstCard = page.locator(".glass.rounded-2xl").first();

    await expect(firstCard.locator("img"), "Card image").toBeVisible();
    const h3 = firstCard.locator("h3");
    await expect(h3, "Card title h3").toBeVisible();
    const title = await h3.textContent();
    expect(title?.trim().length, "Title not empty").toBeGreaterThan(0);
    await expect(firstCard.locator("p").first(), "Card description").toBeVisible();
    await expect(
      firstCard.getByRole("button", { name: "Use Template" }),
      "Use Template button",
    ).toBeVisible();
  });

  test("[P1] Luxury, Standard, and Budget badges all present", async ({ page }) => {
    await goToTemplates(page, "light");
    for (const tier of ["Luxury", "Standard", "Budget"]) {
      const count = await page.locator(".glass.rounded-2xl").locator(`text=${tier}`).count();
      expect(count, `"${tier}" badge must appear at least once`).toBeGreaterThan(0);
    }
  });
});
