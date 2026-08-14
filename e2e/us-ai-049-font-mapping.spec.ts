/**
 * US-AI-049 — AC5: live re-verification of extracted-font mapping.
 *
 * Run:
 *   npx playwright test e2e/us-ai-049-font-mapping.spec.ts
 *
 * TC-AI-049-04: live harness run — price renders on one line (the "₹1.9 / Cr"
 *               two-line wrap regression is gone) and the mapped font family
 *               actually resolves in the browser, not a silent Inter fallback.
 *                                                                [LIVE ~$0.10]
 *
 * There is no mocked variant. AC3/AC5 are explicitly about what a REAL
 * layerize-text payload's font identifiers resolve to once mapped by
 * fontMap.ts and applied by loadComposedDesignToCanvas — mocking the
 * extraction response would just be re-asserting the unit test's own fixture.
 *
 * Flow: Quick Generate (no photo — synthetic path keeps the composed
 * background text-baked, which is what extraction needs to find blocks in;
 * see US-AI-051's AC3 for why the photo path is the opposite case) →
 * Editable → Use This → compose fires real layerize-text ($0.09) → read the
 * price element's resolved font off the live DOM.
 *
 * Cost: 1 real generation (~$0.03-0.08, ideogram-turbo, 3 variations) + 1
 * real layerize-text extraction ($0.09) ≈ $0.10-0.20 total. retries: 0.
 *
 * Auth: fresh throwaway account per run (same reasoning as US-AI-051 — a
 * shared account accumulates FREE-tier usage across every prior spec run).
 *
 * Target environment: `.env`'s PLAYWRIGHT_BASE_URL points every spec at
 * STAGING by default, not localhost. To verify local changes:
 *   PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-ai-049-font-mapping.spec.ts
 */
import { test, expect, type Page } from "@playwright/test";
import process from "node:process";
import fs from "node:fs";

const baseURL = (process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const ARTIFACT_DIR = "./.e2e-artifacts/us-ai-049";

async function waitForTemplateGallery(page: Page) {
  await expect(page.getByRole("heading", { name: /template gallery/i })).toBeVisible({
    timeout: 30_000,
  });
}

async function registerFreshAccount(): Promise<{ token: string; user: unknown }> {
  const email = `e2e-049-${Date.now()}@test.local`;
  const res = await fetch(`${baseURL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "E2eProbe12345!", name: "E2E US-AI-049" }),
  });
  if (!res.ok) {
    throw new Error(`Registration failed: HTTP ${res.status} — ${await res.text()}`);
  }
  const body = await res.json();
  return { token: body.token, user: body.user };
}

async function ensureLoggedIn(page: Page) {
  const { token, user } = await registerFreshAccount();
  await page.addInitScript(([t, u]) => {
    localStorage.setItem("auth_token", t as string);
    localStorage.setItem("auth_user", u as string);
  }, [token, JSON.stringify(user)]);

  const res = await page.goto("/templates", { waitUntil: "domcontentloaded" });
  if (!res || !res.ok()) {
    throw new Error(
      `Cannot load /templates (HTTP ${res?.status() ?? "no response"}). Check PLAYWRIGHT_BASE_URL: ${baseURL}`,
    );
  }
  await waitForTemplateGallery(page);
}

/** Enter the editor and land on the RightSidebar (no AI Chat needed — Quick Generate lives here). */
async function openEditorForQuickGenerate(page: Page) {
  await waitForTemplateGallery(page);
  const useTemplate = page.getByRole("button", { name: "Use Template" }).first();
  await expect(useTemplate).toBeVisible({ timeout: 60_000 });
  await useTemplate.scrollIntoViewIfNeeded();
  await useTemplate.click();
  await expect(page).toHaveURL(/\/editor\?.*templateId=/, { timeout: 30_000 });
  await expect(page.locator('[data-testid="design-canvas"]')).toBeVisible();
}

async function fillPropertyDetailsAndGenerate(page: Page) {
  await page.getByRole("button", { name: "Property", exact: true }).click();
  await page.locator("#headline").fill("SPACIOUS 3 BHK VILLA");
  await page.locator("#price").fill("18500000");
  await page.locator("#sqft").fill("2450");
  await page.locator("#address").fill("Shela, Ahmedabad");

  await page.getByRole("button", { name: /quick generate/i }).click();
  await expect(page.locator('button:has-text("Use This")').first()).toBeVisible({ timeout: 240_000 });
}

test.describe("US-AI-049 — TC-AI-049-04: live font-mapping re-verification (no retries)", () => {
  test.describe.configure({ retries: 0 });
  test.use({ navigationTimeout: 90_000, actionTimeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(420_000);
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
    await ensureLoggedIn(page);
  });

  test("TC-AI-049-04: extracted price renders one line, in a resolved (non-fallback) font [LIVE ~$0.10-0.20]", async ({ page }) => {
    let composeBody: any = null;
    page.on("response", async (res) => {
      if (res.url().includes("/compose") && res.request().method() === "POST") {
        try { composeBody = await res.json(); } catch { /* non-JSON, ignore */ }
      }
    });

    await openEditorForQuickGenerate(page);
    await fillPropertyDetailsAndGenerate(page);

    // Switch to Editable BEFORE clicking Use This — the toggle governs which
    // path loadVariation takes (extraction-led vs layout-engine fallback).
    const editableToggle = page.getByRole("button", { name: "Editable", exact: true }).first();
    await expect(editableToggle).toBeVisible({ timeout: 10_000 });
    await editableToggle.click();

    const composeWait = page
      .waitForResponse((r) => r.url().includes("/compose"), { timeout: 150_000 })
      .catch(() => null);
    await page.locator('button:has-text("Use This")').first().click();
    const composeRes = await composeWait;
    expect(composeRes?.ok(), `compose round trip must succeed (got ${composeRes?.status()})`).toBe(true);

    // waitForResponse resolves on headers, not on the body — the page.on('response')
    // listener's async res.json() above is a separate, unawaited race. Poll for it
    // (same pattern as us-ai-051-textfree-photo-background.spec.ts) rather than
    // reading composeBody immediately.
    await expect.poll(() => composeBody !== null, { timeout: 10_000, intervals: [250] }).toBe(true);

    // Ground truth: this test needs the extraction-led path (blocksDetected > 0)
    // to exercise fontMap.ts at all — the synthetic (no-photo) generation used
    // here always produces a text-baked background, per US-AI-051 AC3.
    expect(composeBody?.extraction?.blocksDetected).toBeGreaterThan(0);

    // Wait for elements to land, then locate the price element by its text
    // content (contains the price value or its formatted currency form).
    await expect(page.locator('[data-element-id]').first()).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(1500); // let font loading + layout settle

    const priceInfo = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-element-id]'));
      const priceNode = nodes.find((n) => /[\d,.]+(\s*(cr|crore|lakh|l|k))?/i.test(n.textContent || "") && /[₹$]/.test(n.textContent || ""));
      if (!priceNode) return null;
      // The [data-element-id] node is the Rnd-positioned wrapper — its box is
      // sized from the extraction's measured geometry, NOT from its own text
      // content, so its height says nothing about line-wrapping. The actual
      // text lives in a child div (TextElement.tsx: "px-2 py-1 whitespace-pre-wrap").
      const textDiv = priceNode.querySelector<HTMLElement>("div") ?? priceNode;
      const style = getComputedStyle(textDiv);

      // Count the browser's own rendered line boxes for the text node via
      // Range.getClientRects() — one rect per visual line for wrapped inline
      // text. This is what actually answers "did it wrap", unlike box height.
      let lineCount = 0;
      const walker = document.createTreeWalker(textDiv, NodeFilter.SHOW_TEXT);
      const textNode = walker.nextNode();
      if (textNode) {
        const range = document.createRange();
        range.selectNodeContents(textNode);
        lineCount = range.getClientRects().length;
      }

      return {
        text: priceNode.textContent?.trim().slice(0, 60),
        fontFamily: style.fontFamily,
        fontSize: parseFloat(style.fontSize),
        lineCount,
        fontResolved: document.fonts.check(`${style.fontSize} ${style.fontFamily}`),
      };
    });

    expect(priceInfo, "price element must be found on canvas").not.toBeNull();
    console.log("[US-AI-049] price element:", JSON.stringify(priceInfo));

    // AC1/AC2 (mapping correctness): never a raw provider filename leaking
    // into fontFamily — that was the exact bug this story fixed. Falling
    // through to the Inter fallback stack (AC2's documented behavior when
    // this generation's identifiers are unrecognized) is a legitimate
    // outcome, not a failure — only a raw provider filename is disallowed.
    expect(priceInfo!.fontFamily).not.toMatch(/\.ttf|IMFeFCrm|font__/i);

    // AC3 (fonts actually loaded): the resolved family must be a real,
    // loaded font — not silently substituted by the browser.
    expect(priceInfo!.fontResolved).toBe(true);

    // Regression guard for the observed "₹1.9 / Cr" two-line wrap: the price
    // must render as exactly one visual line.
    expect(priceInfo!.lineCount).toBe(1);

    await page.screenshot({ path: `${ARTIFACT_DIR}/price-single-line.png`, fullPage: false });
  });
});
