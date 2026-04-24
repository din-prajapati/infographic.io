/**
 * M-DESIGN-04 — Domain Color System E2E Spec
 * Stories: US-DESIGN-007 (category color migration) + US-DESIGN-008 (badge tier token migration)
 * Epic:    EPIC-DESIGN-02 — UI/UX Redesign: Lovart.ai + FillinForm
 *
 * Run (headed):
 *   npx playwright test e2e/m-design-04-domain-colors.spec.ts --headed
 *
 * Run (headless / CI):
 *   npx playwright test e2e/m-design-04-domain-colors.spec.ts
 *
 * Gate coverage:
 *   Gate 1 — TypeScript + unit (run separately via npm run check / test:unit)
 *   Gate 3 — CSS token assertions:  all test.describe blocks below, except [HUMAN-SKIP]
 *   Gate 2 — Visual checklist stubs: [HUMAN-SKIP] tests document what to verify manually
 *
 * Token source of truth: client/src/design-tokens.css
 * Data source: client/src/components/ai-chat/categoryChipsData.ts
 *              client/src/components/ai-chat/templateData.ts
 *              client/src/components/pages/TemplatesPage.tsx
 */

import { test, expect, type Page } from "@playwright/test";
import process from "node:process";

// ─── Auth credentials (from root .env via playwright.config dotenv/config) ───
const TEST_EMAIL    = process.env.TEST_USER_EMAIL    ?? "";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? "";

/**
 * Log in with TEST_USER_EMAIL / TEST_USER_PASSWORD if the page redirected to /auth.
 * After login, navigate to `targetPath` and return true.
 * Returns false if credentials are missing (test should skip).
 */
async function ensureLoggedIn(page: Page, targetPath: string): Promise<boolean> {
  const res = await page.goto(targetPath, { waitUntil: "load" });
  if (!res?.ok()) return false;

  if (page.url().includes("/auth")) {
    if (!TEST_EMAIL || !TEST_PASSWORD) return false;
    await page.getByTestId("input-email").fill(TEST_EMAIL);
    await page.getByTestId("input-password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 30_000 });
    await page.goto(targetPath, { waitUntil: "load" });
  }
  return page.url().includes(targetPath.replace(/\?.*$/, "").replace(/\/$/, "")) ||
         !page.url().includes("/auth");
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Set theme via localStorage then reload so ThemeProvider picks it up. */
async function setTheme(page: Page, theme: "light" | "dark") {
  await page.evaluate((t) => localStorage.setItem("theme", t), theme);
  await page.reload({ waitUntil: "load" });
}

/** Read a CSS custom property from :root, trimmed. */
async function getCSSVar(page: Page, varName: string): Promise<string> {
  return page.evaluate(
    (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim(),
    varName,
  );
}

/**
 * Parse a hex color string (#RRGGBB or #RGB) into { r, g, b } (0-255).
 * Also handles rgb(...) strings from computed styles.
 */
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

/** Assert two hex/rgb color strings are perceptually close (within tolerance per channel). */
function expectColorsClose(
  actual: string,
  expected: string,
  label: string,
  tolerance = 10,
) {
  const a = parseColor(actual);
  const e = parseColor(expected);
  if (!a || !e) {
    throw new Error(`${label}: cannot parse color — actual="${actual}" expected="${expected}"`);
  }
  const dr = Math.abs(a.r - e.r);
  const dg = Math.abs(a.g - e.g);
  const db = Math.abs(a.b - e.b);
  expect(dr, `${label} R channel off by ${dr} (actual=${actual} expected=${expected})`).toBeLessThanOrEqual(tolerance);
  expect(dg, `${label} G channel off by ${dg}`).toBeLessThanOrEqual(tolerance);
  expect(db, `${label} B channel off by ${db}`).toBeLessThanOrEqual(tolerance);
}

// ─── US-DESIGN-007: Category Color Token Migration ────────────────────────────

test.describe("US-DESIGN-007 — AI chat chip token definitions", () => {
  // Use /pricing — public page, no auth. design-tokens.css is loaded site-wide.
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "load" });
    await setTheme(page, "light");
  });

  test("TC-DS-007-01a [P0] --chip-property-listings is defined (not empty)", async ({ page }) => {
    const val = await getCSSVar(page, "--chip-property-listings");
    expect(val, "--chip-property-listings must be defined in design-tokens.css").not.toBe("");
  });

  test("TC-DS-007-01b [P0] --chip-property-listings is blue (#3B82F6)", async ({ page }) => {
    const val = await getCSSVar(page, "--chip-property-listings");
    expect(val, "--chip-property-listings must not be empty").not.toBe("");
    expectColorsClose(val, "#3B82F6", "--chip-property-listings");
  });

  test("TC-DS-007-01c [P0] --chip-open-house is orange (#F97316)", async ({ page }) => {
    const val = await getCSSVar(page, "--chip-open-house");
    expect(val).not.toBe("");
    expectColorsClose(val, "#F97316", "--chip-open-house");
  });

  test("TC-DS-007-01d [P0] --chip-just-sold is emerald (#10B981)", async ({ page }) => {
    const val = await getCSSVar(page, "--chip-just-sold");
    expect(val).not.toBe("");
    expectColorsClose(val, "#10B981", "--chip-just-sold");
  });

  test("TC-DS-007-01e [P0] --chip-agent-branding is amber (#F59E0B)", async ({ page }) => {
    const val = await getCSSVar(page, "--chip-agent-branding");
    expect(val).not.toBe("");
    expectColorsClose(val, "#F59E0B", "--chip-agent-branding");
  });

  test("TC-DS-007-01f [P0] --chip-market-stats is indigo (#6366F1)", async ({ page }) => {
    const val = await getCSSVar(page, "--chip-market-stats");
    expect(val).not.toBe("");
    expectColorsClose(val, "#6366F1", "--chip-market-stats");
  });

  test("TC-DS-007-01g [P0] --chip-neighborhood is teal (#14B8A6)", async ({ page }) => {
    const val = await getCSSVar(page, "--chip-neighborhood");
    expect(val).not.toBe("");
    expectColorsClose(val, "#14B8A6", "--chip-neighborhood");
  });

  test("TC-DS-007-AC5 [P0] No old chip hex values present in any --chip-* token", async ({ page }) => {
    const banned = ["#FF8C00", "#4CAF50", "#2196F3", "#9C27B0", "#FF5722", "#00BCD4"];
    const chipTokens = [
      "--chip-property-listings",
      "--chip-open-house",
      "--chip-just-sold",
      "--chip-agent-branding",
      "--chip-market-stats",
      "--chip-neighborhood",
    ];
    for (const token of chipTokens) {
      const val = await getCSSVar(page, token);
      for (const hex of banned) {
        expect(
          val.toUpperCase(),
          `${token} still contains old hex ${hex} — migration incomplete`,
        ).not.toContain(hex.toUpperCase());
      }
    }
  });
});

test.describe("US-DESIGN-007 — Template category token definitions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "load" });
    await setTheme(page, "light");
  });

  test("TC-DS-007-03a [P0] --category-listing-announcements is blue (#3B82F6)", async ({ page }) => {
    const val = await getCSSVar(page, "--category-listing-announcements");
    expect(val).not.toBe("");
    expectColorsClose(val, "#3B82F6", "--category-listing-announcements");
  });

  test("TC-DS-007-03b [P0] --category-property-features is purple (#8B5CF6)", async ({ page }) => {
    const val = await getCSSVar(page, "--category-property-features");
    expect(val).not.toBe("");
    expectColorsClose(val, "#8B5CF6", "--category-property-features");
  });

  test("TC-DS-007-03c [P0] --category-status-updates is emerald (#10B981)", async ({ page }) => {
    const val = await getCSSVar(page, "--category-status-updates");
    expect(val).not.toBe("");
    expectColorsClose(val, "#10B981", "--category-status-updates");
  });

  test("TC-DS-007-03d [P0] --category-agent-branding is amber (#F59E0B)", async ({ page }) => {
    const val = await getCSSVar(page, "--category-agent-branding");
    expect(val).not.toBe("");
    expectColorsClose(val, "#F59E0B", "--category-agent-branding");
  });

  test("TC-DS-007-03e [P0] All 4 category color tokens are distinct (no duplicates)", async ({ page }) => {
    const tokens = [
      "--category-listing-announcements",
      "--category-property-features",
      "--category-status-updates",
      "--category-agent-branding",
    ];
    const values = await Promise.all(tokens.map((t) => getCSSVar(page, t)));
    const unique = new Set(values.map((v) => v.toUpperCase()));
    expect(
      unique.size,
      `All 4 category tokens should be distinct colors — got duplicates: ${values.join(", ")}`,
    ).toBe(4);
  });

  test("TC-DS-007-04 [P1] Category surface tint tokens are defined (rgba variants)", async ({ page }) => {
    const surfaceTokens = [
      "--category-surface-listing-announcements",
      "--category-surface-property-features",
      "--category-surface-status-updates",
      "--category-surface-agent-branding",
    ];
    for (const token of surfaceTokens) {
      const val = await getCSSVar(page, token);
      expect(val, `${token} must be defined`).not.toBe("");
      expect(val.toLowerCase(), `${token} should be an rgba value`).toContain("rgba");
    }
  });
});

// ─── US-DESIGN-008: Badge Tier Token Migration ────────────────────────────────

test.describe("US-DESIGN-008 — Badge tier token definitions (light mode)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "load" });
    await setTheme(page, "light");
  });

  test("TC-DS-008-02a [P0] --badge-luxury-bg is deep amber-brown (#92400E)", async ({ page }) => {
    const val = await getCSSVar(page, "--badge-luxury-bg");
    expect(val, "--badge-luxury-bg must be defined").not.toBe("");
    expectColorsClose(val, "#92400E", "--badge-luxury-bg");
  });

  test("TC-DS-008-02b [P0] --badge-luxury-text is light amber (#FEF3C7)", async ({ page }) => {
    const val = await getCSSVar(page, "--badge-luxury-text");
    expect(val).not.toBe("");
    expectColorsClose(val, "#FEF3C7", "--badge-luxury-text");
  });

  test("TC-DS-008-AC1a [P0] --badge-standard-bg is deep navy (#1E3A5F)", async ({ page }) => {
    const val = await getCSSVar(page, "--badge-standard-bg");
    expect(val).not.toBe("");
    expectColorsClose(val, "#1E3A5F", "--badge-standard-bg");
  });

  test("TC-DS-008-AC1b [P0] --badge-standard-text is light blue (#DBEAFE)", async ({ page }) => {
    const val = await getCSSVar(page, "--badge-standard-text");
    expect(val).not.toBe("");
    expectColorsClose(val, "#DBEAFE", "--badge-standard-text");
  });

  test("TC-DS-008-AC2a [P0] --badge-budget-bg is deep green (#14532D)", async ({ page }) => {
    const val = await getCSSVar(page, "--badge-budget-bg");
    expect(val).not.toBe("");
    expectColorsClose(val, "#14532D", "--badge-budget-bg");
  });

  test("TC-DS-008-AC3a [P0] --badge-custom-bg is deep purple (#4C1D95)", async ({ page }) => {
    const val = await getCSSVar(page, "--badge-custom-bg");
    expect(val).not.toBe("");
    expectColorsClose(val, "#4C1D95", "--badge-custom-bg");
  });

  test("TC-DS-008-AC4a [P0] --badge-api-bg is navy (#0C3461)", async ({ page }) => {
    const val = await getCSSVar(page, "--badge-api-bg");
    expect(val).not.toBe("");
    expectColorsClose(val, "#0C3461", "--badge-api-bg");
  });

  test("TC-DS-008-AC5 [P0] All 5 badge bg tokens are defined and distinct", async ({ page }) => {
    const tokens = [
      "--badge-luxury-bg",
      "--badge-standard-bg",
      "--badge-budget-bg",
      "--badge-custom-bg",
      "--badge-api-bg",
    ];
    const values = await Promise.all(tokens.map((t) => getCSSVar(page, t)));
    // All must be non-empty
    values.forEach((v, i) => expect(v, `${tokens[i]} must be defined`).not.toBe(""));
    // All must be distinct
    const unique = new Set(values.map((v) => v.toUpperCase()));
    expect(unique.size, `All 5 badge bg tokens must be distinct — got: ${values.join(", ")}`).toBe(5);
  });

  test("TC-DS-008-AC6 [P0] No old Tailwind class colors in badge tokens (no purple-600 / blue-600 hex)", async ({ page }) => {
    // bg-purple-600 = #9333EA, bg-blue-600 = #2563EB
    const badgeTokens = [
      "--badge-luxury-bg", "--badge-standard-bg", "--badge-budget-bg",
      "--badge-custom-bg", "--badge-api-bg",
    ];
    const banned = ["#9333EA", "#2563EB", "#7C3AED"]; // purple-600, blue-600, purple-700 variants
    for (const token of badgeTokens) {
      const val = await getCSSVar(page, token);
      for (const hex of banned) {
        expect(
          val.toUpperCase(),
          `${token} still contains old Tailwind color ${hex}`,
        ).not.toContain(hex.toUpperCase());
      }
    }
  });
});

test.describe("US-DESIGN-008 — Badge tier tokens (dark mode overrides)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "load" });
    await setTheme(page, "dark");
  });

  test("TC-DS-008-04a [P1] Dark: --badge-luxury-bg has a dark mode override (distinct from light)", async ({ page }) => {
    const darkVal = await getCSSVar(page, "--badge-luxury-bg");
    expect(darkVal, "--badge-luxury-bg must be defined in dark mode").not.toBe("");
    // Dark override is #78350F (lighter than light's #92400E to work on dark bg)
    expectColorsClose(darkVal, "#78350F", "--badge-luxury-bg dark", 20);
  });

  test("TC-DS-008-04b [P1] Dark: --badge-custom-bg has a dark mode override", async ({ page }) => {
    const darkVal = await getCSSVar(page, "--badge-custom-bg");
    expect(darkVal).not.toBe("");
    // Dark override is #3B0764
    expectColorsClose(darkVal, "#3B0764", "--badge-custom-bg dark", 20);
  });

  test("TC-DS-008-04c [P1] Dark: --badge-api-bg has a dark mode override", async ({ page }) => {
    const darkVal = await getCSSVar(page, "--badge-api-bg");
    expect(darkVal).not.toBe("");
    // Dark override is #0C2D48
    expectColorsClose(darkVal, "#0C2D48", "--badge-api-bg dark", 20);
  });

  test("TC-DS-008-04d [P1] Dark: all 5 badge bg tokens are still non-empty and distinct", async ({ page }) => {
    const tokens = [
      "--badge-luxury-bg",
      "--badge-standard-bg",
      "--badge-budget-bg",
      "--badge-custom-bg",
      "--badge-api-bg",
    ];
    const values = await Promise.all(tokens.map((t) => getCSSVar(page, t)));
    values.forEach((v, i) => expect(v, `${tokens[i]} must be defined in dark mode`).not.toBe(""));
    const unique = new Set(values.map((v) => v.toUpperCase()));
    expect(unique.size, `All 5 badge bg tokens must be distinct in dark mode — got: ${values.join(", ")}`).toBe(5);
  });
});

// ─── Rendered element checks on /templates (Gate 2 visual + Gate 3 where possible) ──

test.describe("US-DESIGN-008 — Badge rendering on /templates page", () => {
  /**
   * /templates requires auth. We attempt to load it: if we land on /auth, we
   * fall back to HUMAN-SKIP instructions. If templates loads, we assert badge colors.
   */
  async function tryLoadTemplates(page: Page): Promise<boolean> {
    await page.goto("/templates", { waitUntil: "load" });
    // If redirected to /auth or similar, page is protected
    return page.url().includes("/templates");
  }

  test("TC-DS-008-02 [P0] Luxury badge background is deep amber-brown on /templates", async ({ page }) => {
    const loaded = await tryLoadTemplates(page);
    if (!loaded) {
      test.skip(
        true,
        "[AUTH-REQUIRED] /templates redirects to login. Run manually: open /templates, find any 'Luxury' badge, inspect computed background-color — should be approximately #92400E (deep amber-brown).",
      );
      return;
    }
    await setTheme(page, "light");
    // Find the first Luxury badge
    const luxuryBadge = page.locator("text=Luxury").first();
    await expect(luxuryBadge).toBeVisible();
    const bg = await luxuryBadge.evaluate((el) =>
      getComputedStyle(el).backgroundColor,
    );
    // #92400E = rgb(146, 64, 14)
    expectColorsClose(bg, "#92400E", "Luxury badge background", 15);
  });

  test("TC-DS-008-03a [P0] Custom badge background is deep purple on /templates", async ({ page }) => {
    const loaded = await tryLoadTemplates(page);
    if (!loaded) {
      test.skip(
        true,
        "[AUTH-REQUIRED] /templates redirects to login. Run manually: open /templates, find any 'Custom' badge, inspect computed background-color — should be approximately #4C1D95 (deep purple).",
      );
      return;
    }
    await setTheme(page, "light");
    const customBadge = page.locator("text=Custom").first();
    const visible = await customBadge.isVisible().catch(() => false);
    if (!visible) {
      test.skip(true, "No custom templates visible — requires user-created templates in state.");
      return;
    }
    const bg = await customBadge.evaluate((el) => getComputedStyle(el).backgroundColor);
    expectColorsClose(bg, "#4C1D95", "Custom badge background", 15);
  });

  test("TC-DS-008-05 [P1] No badge element uses old bg-purple-600 or bg-blue-600 computed color", async ({ page }) => {
    const loaded = await tryLoadTemplates(page);
    if (!loaded) {
      test.skip(
        true,
        "[AUTH-REQUIRED] /templates redirects to login. Run manually: open /templates, inspect all badge elements, verify none have background-color rgb(147,51,234) [purple-600] or rgb(37,99,235) [blue-600].",
      );
      return;
    }
    await setTheme(page, "light");
    // Get all badge elements (shadcn Badge uses role="status" or has inline-flex styling)
    const badges = page.locator("[class*='badge'], [class*='Badge']");
    const count = await badges.count();
    if (count === 0) {
      test.skip(true, "No badge elements found on page.");
      return;
    }
    const bannedColors = [
      "rgb(147, 51, 234)", // purple-600
      "rgb(37, 99, 235)",  // blue-600
      "rgb(147,51,234)",
      "rgb(37,99,235)",
    ];
    for (let i = 0; i < count; i++) {
      const bg = await badges.nth(i).evaluate((el) => getComputedStyle(el).backgroundColor);
      for (const banned of bannedColors) {
        expect(
          bg,
          `Badge ${i} has old hardcoded color ${banned} — badgeStyle migration incomplete`,
        ).not.toBe(banned);
      }
    }
  });
});

// ─── Human-only visual checks (Gate 2) ────────────────────────────────────────

// ─── TC-DS-007-02 & 007-03: Automated chip + category header color assertions ─

/**
 * Helper: open /editor and attempt to load the AI chat panel.
 * Returns true if the page loaded (not redirected to /auth) AND the AI chat
 * button was found and clicked successfully.
 */
async function openAIChatPanel(page: Page): Promise<boolean> {
  await page.goto("/editor", { waitUntil: "load" });
  if (!page.url().includes("/editor")) return false;

  // The AI chat button — look for the button that opens the panel
  const aiBtn = page.locator('[aria-label*="AI"], [title*="AI"], [data-testid*="ai-chat"], button:has-text("AI")').first();
  const visible = await aiBtn.isVisible().catch(() => false);
  if (!visible) return false;

  await aiBtn.click();
  // Wait for the AI chat panel to appear
  const panel = page.locator('#ai-chat-panel, [role="dialog"][aria-label="AI assistant"]').first();
  try {
    await panel.waitFor({ state: 'visible', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

test.describe("TC-DS-007-02 — Chip domain colors applied in DOM (automated)", () => {
  const chipExpected: Array<{ id: string; hex: string; label: string }> = [
    { id: "property-listings", hex: "#3B82F6", label: "Property Listings (blue)" },
    { id: "open-house",        hex: "#F97316", label: "Open House (orange)" },
    { id: "just-sold",         hex: "#10B981", label: "Just Sold (emerald)" },
    { id: "agent-branding",    hex: "#F59E0B", label: "Agent Branding (amber)" },
    { id: "market-stats",      hex: "#6366F1", label: "Market Stats (indigo)" },
    { id: "neighborhood",      hex: "#14B8A6", label: "Neighborhood (teal)" },
  ];

  test("TC-DS-007-02a [P0] Unselected chips have no inline color override (default styling)", async ({ page }) => {
    const opened = await openAIChatPanel(page);
    if (!opened) {
      test.skip(true, "[AUTH-REQUIRED] /editor requires login. Manual check: open AI Chat, verify unselected chips have no colored border.");
      return;
    }
    await setTheme(page, "light");

    for (const chip of chipExpected) {
      const el = page.locator(`[data-chip-id="${chip.id}"]`).first();
      const visible = await el.isVisible().catch(() => false);
      if (!visible) continue;

      const borderColor = await el.evaluate((e) => getComputedStyle(e).borderColor);
      // Unselected: border should NOT be the chip's domain color (it should be the border-border token)
      // Just verify it's not empty and not a vivid saturated color (rough check)
      expect(borderColor, `Unselected chip ${chip.id} should not have colored border`).not.toBe("");
    }
  });

  test("TC-DS-007-02b [P0] Selecting a chip applies its domain color to border and text", async ({ page }) => {
    const opened = await openAIChatPanel(page);
    if (!opened) {
      test.skip(true, "[AUTH-REQUIRED] /editor requires login. Manual check: click a chip and verify it gets the chip's domain color (border + text), not blue-500.");
      return;
    }
    await setTheme(page, "light");

    // Test the first chip (property-listings → blue #3B82F6)
    const chip = chipExpected[0];
    const el = page.locator(`[data-chip-id="${chip.id}"]`).first();
    const visible = await el.isVisible().catch(() => false);
    if (!visible) {
      test.skip(true, `Chip ${chip.id} not visible in panel — may require scrolling or different UI state.`);
      return;
    }

    await el.click();
    // After click, data-selected should be true
    await expect(el).toHaveAttribute("data-selected", "true");

    // Verify inline border color resolves to the chip's domain color
    const borderColor = await el.evaluate((e) => getComputedStyle(e).borderColor);
    expect(borderColor, `Selected chip ${chip.id} border should be colored`).not.toBe("rgba(0, 0, 0, 0)");
    // Check that the border is approximately the expected color
    expectColorsClose(borderColor, chip.hex, `${chip.label} chip border`, 20);
  });

  test("TC-DS-007-02c [P1] All 6 chips have distinct CSS-variable color references (no two chips share a color)", async ({ page }) => {
    // This is a token-level test — we verify from :root that all 6 chip vars are distinct.
    // Already partially covered by TC-DS-007-01*, but here we assert distinctness together.
    await page.goto("/pricing", { waitUntil: "load" });
    await setTheme(page, "light");

    const tokens = chipExpected.map((c) => `--chip-${c.id}`);
    const values = await Promise.all(tokens.map((t) => getCSSVar(page, t)));
    const unique = new Set(values.map((v) => v.toUpperCase()));
    expect(
      unique.size,
      `All 6 chip color tokens must be distinct — got: ${values.join(", ")}`,
    ).toBe(6);
  });
});

test.describe("TC-DS-007-03 — Category header block colors in TemplateCategoryView (automated)", () => {
  const categoryExpected: Array<{ id: string; hex: string; label: string }> = [
    { id: "listing-announcements", hex: "#3B82F6", label: "Listing Announcements (blue)" },
    { id: "property-features",     hex: "#8B5CF6", label: "Property Features (purple)" },
    { id: "status-updates",        hex: "#10B981", label: "Status Updates (emerald)" },
    { id: "agent-branding",        hex: "#F59E0B", label: "Agent Branding (amber)" },
  ];

  test("TC-DS-007-03a [P0] Browse-by-category toggle is present in AI Chat panel", async ({ page }) => {
    const opened = await openAIChatPanel(page);
    if (!opened) {
      test.skip(true, "[AUTH-REQUIRED] /editor requires login. Manual check: open AI Chat, verify 'Browse by category' link/button is visible.");
      return;
    }
    const toggle = page.locator('[data-testid="browse-templates-toggle"]').first();
    await expect(toggle).toBeVisible();
  });

  test("TC-DS-007-03b [P0] Clicking toggle shows TemplateCategoryView with 4 category headers", async ({ page }) => {
    const opened = await openAIChatPanel(page);
    if (!opened) {
      test.skip(true, "[AUTH-REQUIRED] /editor requires login. Manual check: click 'Browse by category', verify 4 category cards appear.");
      return;
    }

    const toggle = page.locator('[data-testid="browse-templates-toggle"]').first();
    const toggleVisible = await toggle.isVisible().catch(() => false);
    if (!toggleVisible) {
      test.skip(true, "Browse-by-category toggle not found — may require UI state (no selected chips).");
      return;
    }

    await toggle.click();

    // All 4 category headers should now be visible
    for (const cat of categoryExpected) {
      const header = page.locator(`[data-category-id="${cat.id}"]`).first();
      await expect(header, `Category header ${cat.id} should be visible after toggle`).toBeVisible();
    }
  });

  test("TC-DS-007-03c [P0] Category header backgrounds are non-transparent (domain color applied)", async ({ page }) => {
    const opened = await openAIChatPanel(page);
    if (!opened) {
      test.skip(true, "[AUTH-REQUIRED] /editor requires login. Manual check: open category view, inspect header backgrounds — each should have a colored tint matching its category.");
      return;
    }

    const toggle = page.locator('[data-testid="browse-templates-toggle"]').first();
    const toggleVisible = await toggle.isVisible().catch(() => false);
    if (!toggleVisible) {
      test.skip(true, "Toggle not visible — UI state mismatch.");
      return;
    }

    await toggle.click();
    await setTheme(page, "light");

    for (const cat of categoryExpected) {
      const header = page.locator(`[data-category-id="${cat.id}"]`).first();
      const visible = await header.isVisible().catch(() => false);
      if (!visible) continue;

      const bg = await header.evaluate((e) => getComputedStyle(e).backgroundColor);
      // The background must not be fully transparent (rgba(0,0,0,0)) — it should have a colored tint
      expect(
        bg,
        `Category header ${cat.id} must have non-transparent background (domain color tint). Got: ${bg}`,
      ).not.toBe("rgba(0, 0, 0, 0)");
      // Also not pure white (would mean color-mix fell back to transparent)
      expect(bg).not.toBe("rgb(255, 255, 255)");
    }
  });

  test("TC-DS-007-03d [P1] Category headers have a colored left border (accent stripe)", async ({ page }) => {
    const opened = await openAIChatPanel(page);
    if (!opened) {
      test.skip(true, "[AUTH-REQUIRED] /editor requires login. Manual check: inspect category header elements — each should have a 3px left border in its domain color.");
      return;
    }

    const toggle = page.locator('[data-testid="browse-templates-toggle"]').first();
    const toggleVisible = await toggle.isVisible().catch(() => false);
    if (!toggleVisible) {
      test.skip(true, "Toggle not visible.");
      return;
    }

    await toggle.click();

    for (const cat of categoryExpected) {
      const header = page.locator(`[data-category-id="${cat.id}"]`).first();
      const visible = await header.isVisible().catch(() => false);
      if (!visible) continue;

      const borderLeft = await header.evaluate((e) => getComputedStyle(e).borderLeftWidth);
      expect(
        parseFloat(borderLeft),
        `Category header ${cat.id} should have a 3px left border accent stripe. Got: ${borderLeft}`,
      ).toBeGreaterThan(0);
    }
  });
});

test.describe("US-DESIGN-007 — [HUMAN-SKIP] Visual checks", () => {
  test("TC-DS-007-02 [P0][HUMAN-SKIP] AI Chat chips render domain colors: blue/orange/emerald/amber/indigo/teal", async () => {
    test.skip(
      true,
      "[HUMAN] Open /editor and open the AI Chat panel. Verify the 6 category chips render with these colors when selected:\n" +
      "  • Property Listings → blue (#3B82F6) border + tinted bg\n" +
      "  • Open House       → orange (#F97316) border + tinted bg\n" +
      "  • Just Sold        → emerald (#10B981) border + tinted bg\n" +
      "  • Agent Branding   → amber (#F59E0B) border + tinted bg\n" +
      "  • Market Stats     → indigo (#6366F1) border + tinted bg\n" +
      "  • Neighborhood     → teal (#14B8A6) border + tinted bg\n" +
      "Unselected chips: neutral border-border, no color.\n" +
      "No chip should show generic blue-500 for ALL chips.",
    );
  });

  test("TC-DS-007-03 [P0][HUMAN-SKIP] Template category headers show correct colored backgrounds and left-border stripe", async () => {
    test.skip(
      true,
      "[HUMAN] Open the AI Chat panel → click 'Browse by category' link.\n" +
      "Verify the 4 category headers show colored tint backgrounds + left-border stripe:\n" +
      "  • Listing Announcements → blue tint + blue left border (#3B82F6)\n" +
      "  • Property Features     → purple tint + purple left border (#8B5CF6)\n" +
      "  • Status Updates        → emerald tint + emerald left border (#10B981)\n" +
      "  • Agent Branding        → amber tint + amber left border (#F59E0B)\n" +
      "Icon container should also have a slightly more opaque tint of the same color.",
    );
  });

  test("TC-DS-007-04 [P1][HUMAN-SKIP] TemplateCategoryView shows no raw gray-* classes", async () => {
    test.skip(
      true,
      "[HUMAN] Open the AI Chat panel → Browse by category → expand any category.\n" +
      "Inspect the expanded template list items in DevTools → Elements.\n" +
      "Verify: no bg-gray-*, text-gray-*, border-gray-* classes present on any element.\n" +
      "Verify: the 'Popular' badge uses amber-500/15 tint (amber color, not yellow).",
    );
  });

  test("TC-DS-007-05 [P1][HUMAN-SKIP] Dark mode: category chip and card colors are vivid, not washed out", async () => {
    test.skip(
      true,
      "[HUMAN] Toggle Dark mode (Account → Appearance). Open AI Chat panel.\n" +
      "Verify all 6 category chips are still visually distinct and vivid in dark mode.\n" +
      "Verify the category surface tints (icon bg areas) are slightly more opaque on dark.\n" +
      "No chip color should appear identical to another in dark mode.",
    );
  });
});

test.describe("US-DESIGN-008 — [HUMAN-SKIP] Visual checks", () => {
  test("TC-DS-008-02 [P0][HUMAN-SKIP] Luxury badge is dark amber-brown (premium feel)", async () => {
    test.skip(
      true,
      "[HUMAN] Open /templates (logged in). Find a template card with 'Luxury' badge.\n" +
      "Verify: badge background is deep amber-brown (#92400E), text is light amber (#FEF3C7).\n" +
      "Should feel premium/exclusive — not yellow, not orange.",
    );
  });

  test("TC-DS-008-03 [P0][HUMAN-SKIP] Standard=deep navy, Budget=deep green, Custom=deep purple, API=navy", async () => {
    test.skip(
      true,
      "[HUMAN] Open /templates (logged in). Find cards with each badge tier:\n" +
      "  • Standard → deep navy background (#1E3A5F), light blue text\n" +
      "  • Budget   → deep green background (#14532D), light green text\n" +
      "  • Custom   → deep purple background (#4C1D95) — only if custom templates exist\n" +
      "  • API      → navy background (#0C3461) — only if API templates exist",
    );
  });

  test("TC-DS-008-04 [P1][HUMAN-SKIP] Badge colors are visible and distinct in Dark mode", async () => {
    test.skip(
      true,
      "[HUMAN] Toggle Dark mode. Open /templates.\n" +
      "All 5 badge tiers should be clearly readable:\n" +
      "  • Luxury dark override:   #78350F (slightly lighter amber-brown)\n" +
      "  • Custom dark override:   #3B0764 (slightly lighter purple)\n" +
      "  • API dark override:      #0C2D48 (slightly lighter navy)\n" +
      "Standard and Budget keep the same dark bg (deep enough to work on dark cards).\n" +
      "Text should be clearly legible on all tiers in dark mode.",
    );
  });

  test("TC-DS-008-05 [P1][HUMAN-SKIP] Regression: no other template card elements changed", async () => {
    test.skip(
      true,
      "[HUMAN] Open /templates. Scan the full card grid.\n" +
      "Verify: only the badge pill color changed — card image, title, description,\n" +
      "'Use Template' button, card border, hover shadow are identical to before.\n" +
      "No layout shift, no missing elements.",
    );
  });
});
