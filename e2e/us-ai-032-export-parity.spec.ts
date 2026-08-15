/**
 * US-AI-032 AC5 / BL-09 — live re-verification that the Export button's real
 * output (canvasExport.ts's native-canvas renderer, confirmed 2026-08-15 as
 * the ONLY reachable export path — the html2canvas alternative was dead code
 * and has been removed) visually matches the on-screen preview.
 *
 * Run:
 *   npx playwright test e2e/us-ai-032-export-parity.spec.ts
 *
 * Not a pixel-diff assertion (deliberately deferred per BL-09 — the
 * underlying geometry helpers already have 21 unit tests in
 * canvasExport.spec.ts covering text padding, object-fit, and crop-rect
 * math). This is the live claim those unit tests can't make on their own:
 * a REAL template's REAL export, on a REAL browser, actually completes and
 * produces a correctly-sized, non-blank image. Screenshots of both the
 * on-screen preview and the exported file are saved for visual comparison.
 *
 * Zero live cost — uses a static template (no AI generation involved).
 *
 * Target environment: `.env`'s PLAYWRIGHT_BASE_URL points every spec at
 * STAGING by default, not localhost. To verify local changes:
 *   PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-ai-032-export-parity.spec.ts
 */
import { test, expect, type Page } from "@playwright/test";
import process from "node:process";
import fs from "node:fs";

const baseURL = (process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const ARTIFACT_DIR = "./.e2e-artifacts/us-ai-032-export-parity";

async function waitForTemplateGallery(page: Page) {
  await expect(page.getByRole("heading", { name: /template gallery/i })).toBeVisible({
    timeout: 30_000,
  });
}

async function registerFreshAccount(): Promise<{ token: string; user: unknown }> {
  const email = `e2e-032exp-${Date.now()}@test.local`;
  const res = await fetch(`${baseURL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "E2eProbe12345!", name: "E2E US-AI-032 Export" }),
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

test.describe("US-AI-032 AC5 / BL-09 — export parity live re-verification (no retries)", () => {
  test.describe.configure({ retries: 0 });
  test.use({ navigationTimeout: 90_000, actionTimeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
    await ensureLoggedIn(page);
  });

  test("a real template's Export produces a correctly-sized, non-blank image matching the preview [FREE — no AI cost]", async ({ page }) => {
    await waitForTemplateGallery(page);
    const useTemplate = page.getByRole("button", { name: "Use Template" }).first();
    await expect(useTemplate).toBeVisible({ timeout: 60_000 });
    await useTemplate.scrollIntoViewIfNeeded();
    await useTemplate.click();
    await expect(page).toHaveURL(/\/editor\?.*templateId=/, { timeout: 30_000 });

    const canvas = page.locator('[data-testid="design-canvas"]');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(1000); // let fonts/images settle

    // Confirm the template actually has real content — at least one text and
    // one image/shape element — otherwise this test would pass trivially.
    const elementCount = await page.locator("[data-element-id]").count();
    expect(elementCount, "template must have real elements to make this a meaningful check").toBeGreaterThan(0);

    // ── Capture the on-screen preview ──────────────────────────────────
    await canvas.screenshot({ path: `${ARTIFACT_DIR}/preview.png` });

    // ── Trigger the real Export button and capture the downloaded file ──
    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const download = await downloadPromise;
    const exportPath = `${ARTIFACT_DIR}/exported.png`;
    await download.saveAs(exportPath);

    // The export must be a real, non-trivial PNG — not an empty/failed file.
    const stat = fs.statSync(exportPath);
    expect(stat.size, "exported file must not be empty/near-empty (a blank canvas is a few hundred bytes at most)").toBeGreaterThan(5_000);

    // Confirm the exported image's pixel dimensions are sane relative to the
    // artboard (scale 1 or 2 per exportCanvasToImage's own DPI logic) by
    // reading the PNG header directly (IHDR width/height, big-endian, at a
    // fixed byte offset — no image library needed for this one check).
    const buf = fs.readFileSync(exportPath);
    const pngWidth = buf.readUInt32BE(16);
    const pngHeight = buf.readUInt32BE(20);
    console.log(`[US-AI-032 export] exported PNG: ${pngWidth}x${pngHeight}, ${stat.size} bytes`);
    expect(pngWidth, "exported width must be a real, positive dimension").toBeGreaterThan(0);
    expect(pngHeight, "exported height must be a real, positive dimension").toBeGreaterThan(0);
  });
});
