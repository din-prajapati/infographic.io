/**
 * M-DESIGN-03 — Token Foundation E2E Spec
 * Stories: US-DESIGN-005 (color scheme) + US-DESIGN-006 (Outfit font)
 * Epic:    EPIC-DESIGN-02 — UI/UX Redesign: Lovart.ai + FillinForm
 *
 * Run (headed):
 *   npx playwright test e2e/m-design-03-token-foundation.spec.ts --headed
 *
 * Run (headless / CI):
 *   npx playwright test e2e/m-design-03-token-foundation.spec.ts
 *
 * All tests are self-contained — no login required (uses /pricing, a public page).
 * Tests tagged [HUMAN-SKIP] cannot be automated; they are reported at the end.
 */

import { test, expect, type Page } from "@playwright/test";

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Set theme via localStorage, then reload so ThemeProvider picks it up. */
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
 * Extract the hue component from a Tailwind HSL token string.
 * Token format: "207 90% 49%" → 207
 */
function hueOf(hslToken: string): number {
  return parseFloat(hslToken.split(/\s+/)[0]);
}

// ─── US-DESIGN-005: Color Scheme ─────────────────────────────────────────────

test.describe("US-DESIGN-005 — Blue / Amber / Warm-cream color scheme", () => {

  test.beforeEach(async ({ page }) => {
    // /pricing is public — no auth required
    await page.goto("/pricing", { waitUntil: "load" });
  });

  // ── Light mode tokens ───────────────────────────────────────────────────────

  test("TC-DS-005-01 [P0] Light: --primary hue is blue (~207), not teal (~174)", async ({ page }) => {
    await setTheme(page, "light");
    const token = await getCSSVar(page, "--primary");
    expect(token, "--primary must not be empty").not.toBe("");
    const hue = hueOf(token);
    expect(
      hue,
      `--primary hue should be 195–220 (blue), got ${hue} from "${token}" — still teal?`,
    ).toBeGreaterThanOrEqual(195);
    expect(hue).toBeLessThanOrEqual(220);
  });

  test("TC-DS-005-02 [P0] Light: --background hue is warm cream (~45°), not cool grey (~220°)", async ({ page }) => {
    await setTheme(page, "light");
    const token = await getCSSVar(page, "--background");
    expect(token).not.toBe("");
    const hue = hueOf(token);
    expect(
      hue,
      `Light --background hue should be 30–60 (warm cream), got ${hue} from "${token}"`,
    ).toBeGreaterThanOrEqual(30);
    expect(hue).toBeLessThanOrEqual(60);
  });

  test("TC-DS-005-03 [P1] Light: --secondary hue is amber (~38°), not purple-blue (~239°)", async ({ page }) => {
    await setTheme(page, "light");
    const token = await getCSSVar(page, "--secondary");
    expect(token).not.toBe("");
    const hue = hueOf(token);
    expect(
      hue,
      `--secondary hue should be 25–55 (amber), got ${hue} from "${token}" — still purple?`,
    ).toBeGreaterThanOrEqual(25);
    expect(hue).toBeLessThanOrEqual(55);
  });

  test("TC-DS-005-04 [P1] Light: --ring hue is blue (~207), not teal", async ({ page }) => {
    await setTheme(page, "light");
    const token = await getCSSVar(page, "--ring");
    const hue = hueOf(token);
    expect(hue).toBeGreaterThanOrEqual(195);
    expect(hue).toBeLessThanOrEqual(220);
  });

  test("TC-DS-005-05 [P1] Light: --chart-1 is blue (~207), --chart-2 is amber (~38)", async ({ page }) => {
    await setTheme(page, "light");
    const c1 = await getCSSVar(page, "--chart-1");
    const c2 = await getCSSVar(page, "--chart-2");
    if (c1) {
      const h1 = hueOf(c1);
      expect(h1, `--chart-1 hue should be blue ~207, got ${h1}`).toBeGreaterThanOrEqual(195);
      expect(h1).toBeLessThanOrEqual(220);
    }
    if (c2) {
      const h2 = hueOf(c2);
      expect(h2, `--chart-2 hue should be amber ~38, got ${h2}`).toBeGreaterThanOrEqual(25);
      expect(h2).toBeLessThanOrEqual(55);
    }
  });

  test("TC-DS-005-06 [P1] Light: --sidebar-primary hue is blue (~207)", async ({ page }) => {
    await setTheme(page, "light");
    const token = await getCSSVar(page, "--sidebar-primary");
    if (!token) { test.skip(true, "--sidebar-primary not defined"); return; }
    const hue = hueOf(token);
    expect(hue, `--sidebar-primary hue should be ~207, got ${hue}`).toBeGreaterThanOrEqual(195);
    expect(hue).toBeLessThanOrEqual(225);
  });

  test("TC-DS-005-07 [P1] Light: --muted and --accent hue are warm (not cool blue-grey)", async ({ page }) => {
    await setTheme(page, "light");
    const muted = await getCSSVar(page, "--muted");
    const accent = await getCSSVar(page, "--accent");
    if (muted) {
      const h = hueOf(muted);
      expect(h, `--muted should be warm ~45, got ${h}`).toBeGreaterThanOrEqual(30);
      expect(h).toBeLessThanOrEqual(65);
    }
    if (accent) {
      const h = hueOf(accent);
      expect(h, `--accent should be blue-shifted ~207, got ${h}`).toBeGreaterThanOrEqual(190);
      expect(h).toBeLessThanOrEqual(225);
    }
  });

  // ── Dark mode tokens ────────────────────────────────────────────────────────

  test("TC-DS-005-08 [P0] Dark: --background hue is warm near-black (~45°), not navy (~228°)", async ({ page }) => {
    await setTheme(page, "dark");
    const token = await getCSSVar(page, "--background");
    expect(token).not.toBe("");
    const hue = hueOf(token);
    expect(
      hue,
      `Dark --background hue should be 30–60 (warm), got ${hue} from "${token}" — still navy?`,
    ).toBeGreaterThanOrEqual(30);
    expect(hue).toBeLessThanOrEqual(60);
  });

  test("TC-DS-005-09 [P0] Dark: --primary hue is blue (~207), not teal (~174)", async ({ page }) => {
    await setTheme(page, "dark");
    const token = await getCSSVar(page, "--primary");
    const hue = hueOf(token);
    expect(hue, `Dark --primary hue should be ~207, got ${hue}`).toBeGreaterThanOrEqual(195);
    expect(hue).toBeLessThanOrEqual(225);
  });

  test("TC-DS-005-10 [P1] Dark: --secondary hue is amber (~38°), not purple-blue (~239°)", async ({ page }) => {
    await setTheme(page, "dark");
    const token = await getCSSVar(page, "--secondary");
    const hue = hueOf(token);
    expect(hue, `Dark --secondary hue should be ~38, got ${hue}`).toBeGreaterThanOrEqual(25);
    expect(hue).toBeLessThanOrEqual(55);
  });

  test("TC-DS-005-11 [P1] Dark: --card hue is warm (~45°), not cool navy (~228°)", async ({ page }) => {
    await setTheme(page, "dark");
    const token = await getCSSVar(page, "--card");
    if (!token) { test.skip(true, "--card not defined"); return; }
    const hue = hueOf(token);
    expect(hue, `Dark --card hue should be warm ~45, got ${hue}`).toBeGreaterThanOrEqual(30);
    expect(hue).toBeLessThanOrEqual(60);
  });

  // ── No teal anywhere (regression guard) ────────────────────────────────────

  test("TC-DS-005-12 [P0] No token has teal hue (174°) in light mode", async ({ page }) => {
    await setTheme(page, "light");
    const tealTokens: string[] = [];
    const tokensToCheck = [
      "--primary", "--secondary", "--ring", "--chart-1", "--chart-2",
      "--sidebar-primary", "--sidebar-ring", "--accent",
    ];
    for (const t of tokensToCheck) {
      const val = await getCSSVar(page, t);
      if (!val) continue;
      const hue = hueOf(val);
      // Teal range: 160–185
      if (hue >= 160 && hue <= 185) tealTokens.push(`${t}="${val}" (hue=${hue})`);
    }
    expect(
      tealTokens,
      `Teal-hued tokens found in light mode — should all be blue/amber/warm: ${tealTokens.join(", ")}`,
    ).toHaveLength(0);
  });

  test("TC-DS-005-13 [P0] No token has teal hue (174°) in dark mode", async ({ page }) => {
    await setTheme(page, "dark");
    const tealTokens: string[] = [];
    const tokensToCheck = [
      "--primary", "--ring", "--chart-1", "--sidebar-primary", "--sidebar-ring",
    ];
    for (const t of tokensToCheck) {
      const val = await getCSSVar(page, t);
      if (!val) continue;
      const hue = hueOf(val);
      if (hue >= 160 && hue <= 185) tealTokens.push(`${t}="${val}" (hue=${hue})`);
    }
    expect(
      tealTokens,
      `Teal-hued tokens found in dark mode: ${tealTokens.join(", ")}`,
    ).toHaveLength(0);
  });

  // ── Glass tint ──────────────────────────────────────────────────────────────

  test("TC-DS-005-14 [P1] --glass-tint is blue rgba (no teal rgba(20,184,166) present)", async ({ page }) => {
    await setTheme(page, "light");
    // Check the --glass-tint CSS variable value directly via getComputedStyle
    // (Scanning all CSS rules would false-positive on unrelated Tailwind teal utilities)
    const glassTint = await getCSSVar(page, "--glass-tint");
    const hasTealTint =
      glassTint.includes("rgba(20,184,166") || glassTint.includes("rgba(20, 184, 166");
    expect(
      hasTealTint,
      `--glass-tint should not contain old teal value rgba(20,184,166,...) — update to rgba(12,160,235,...). Got: "${glassTint}"`,
    ).toBe(false);
    // Also verify --glass-tint is set to the blue value
    expect(
      glassTint,
      `--glass-tint should be set to a blue rgba value, got: "${glassTint}"`,
    ).toContain("rgba(12");
  });

  // ── Human-only checks ───────────────────────────────────────────────────────

  test("TC-DS-005-15 [P0][HUMAN-SKIP] Visual: Light mode page bg is warm cream, no teal tint", async () => {
    test.skip(
      true,
      "[HUMAN] Open /templates in Light mode. Verify the page background gradient is warm cream (#f9f8f6), no teal/blue-green tint. Check the gradient behind cards and the full page background.",
    );
  });

  test("TC-DS-005-16 [P0][HUMAN-SKIP] Visual: Dark mode page bg is warm near-black, no navy/cool tint", async () => {
    test.skip(
      true,
      "[HUMAN] Open /templates in Dark mode. Verify the background is warm near-black (#100f09), not cool navy. No blue tint in the dark area.",
    );
  });

  test("TC-DS-005-17 [P0][HUMAN-SKIP] Visual: Theme toggle on Templates + Editor + Account — all 3 pages update correctly", async () => {
    test.skip(
      true,
      "[HUMAN] Navigate to /templates, /editor, /account. On each page toggle Light ↔ Dark in Account > Appearance. Verify the colour scheme updates consistently on all 3 pages. No page should remain in the old teal/navy scheme after toggle.",
    );
  });
});

// ─── US-DESIGN-006: Outfit Display Font ──────────────────────────────────────

test.describe("US-DESIGN-006 — Outfit display font integration", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "load" });
  });

  // AC3 — CSS variable exists
  test("TC-DS-006-01 [P0] --font-display CSS variable is defined and contains 'Outfit'", async ({ page }) => {
    const val = await getCSSVar(page, "--font-display");
    expect(val, "--font-display CSS variable must be defined in :root").not.toBe("");
    expect(
      val.toLowerCase(),
      `--font-display should include 'Outfit', got: "${val}"`,
    ).toContain("outfit");
  });

  // AC1 — Google Fonts link present in <head>
  test("TC-DS-006-02 [P0] Google Fonts stylesheet link for Outfit is in document <head>", async ({ page }) => {
    const found = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
      return links.some((l) => {
        const href = l.getAttribute("href") || "";
        return href.includes("fonts.googleapis.com") && href.includes("Outfit");
      });
    });
    expect(
      found,
      'A <link rel="stylesheet"> pointing to fonts.googleapis.com with "Outfit" must be present in <head>',
    ).toBe(true);
  });

  // AC1 — Outfit weights 400/500/600/700 are in the link
  test("TC-DS-006-03 [P1] Google Fonts link requests Outfit weights 400,500,600,700", async ({ page }) => {
    const href = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
      const outfitLink = links.find((l) => {
        const h = l.getAttribute("href") || "";
        return h.includes("fonts.googleapis.com") && h.includes("Outfit");
      });
      return outfitLink?.getAttribute("href") ?? "";
    });
    expect(href).not.toBe("");
    // Should include weight range or individual weights
    const hasWeights = href.includes("wght@") && (
      href.includes("400") || href.includes("ital,wght")
    );
    expect(
      hasWeights,
      `Google Fonts link should specify Outfit weights (wght@...), got: "${href}"`,
    ).toBe(true);
  });

  // AC5 — Body text still uses Inter, not Outfit
  test("TC-DS-006-04 [P1] Body font-family is Inter — no Outfit regression on body text", async ({ page }) => {
    const bodyFont = await page.evaluate(() =>
      getComputedStyle(document.body).fontFamily.toLowerCase(),
    );
    expect(
      bodyFont,
      `Body font-family should include 'inter', got: "${bodyFont}"`,
    ).toContain("inter");
  });

  // AC2 — Tailwind display utility resolves to Outfit (inferred via CSS var)
  test("TC-DS-006-05 [P1] Tailwind font-display utility resolves Outfit via --font-display var", async ({ page }) => {
    // Create a test element with font-display class and check its computed font-family
    const resolvedFont = await page.evaluate(() => {
      const el = document.createElement("span");
      el.className = "font-display";
      el.style.position = "absolute";
      el.style.visibility = "hidden";
      document.body.appendChild(el);
      const ff = getComputedStyle(el).fontFamily.toLowerCase();
      document.body.removeChild(el);
      return ff;
    });
    expect(
      resolvedFont,
      `font-display class should resolve to Outfit as first font, got: "${resolvedFont}"`,
    ).toContain("outfit");
  });

  // preconnect links
  test("TC-DS-006-06 [P2] Preconnect hints for fonts.googleapis.com and fonts.gstatic.com are present", async ({ page }) => {
    const preconnects = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="preconnect"]'));
      return links.map((l) => l.getAttribute("href") || "");
    });
    const hasGooglePreconnect = preconnects.some((h) => h.includes("fonts.googleapis.com"));
    const hasGstaticPreconnect = preconnects.some((h) => h.includes("fonts.gstatic.com"));
    expect(hasGooglePreconnect, "Should have preconnect to fonts.googleapis.com").toBe(true);
    expect(hasGstaticPreconnect, "Should have preconnect to fonts.gstatic.com").toBe(true);
  });

  // Human-only checks
  test("TC-DS-006-07 [P0][HUMAN-SKIP] Visual: Outfit font file loads (200 OK) in DevTools Network", async () => {
    test.skip(
      true,
      "[HUMAN] Open DevTools → Network → filter 'Outfit'. Reload the page. Verify at least one .woff2 request from fonts.gstatic.com returns HTTP 200. If blocked by ad-blocker or offline, disable and retest.",
    );
  });

  test("TC-DS-006-08 [P1][HUMAN-SKIP] Visual: headings using font-display class render in Outfit (not Inter)", async () => {
    test.skip(
      true,
      "[HUMAN] In DevTools → Elements, inspect any element with Tailwind class 'font-display'. Check Computed → font-family. 'Outfit' must appear first in the stack. Body / label text should still show 'Inter'.",
    );
  });
});
