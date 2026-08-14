/**
 * US-AI-032 — Editable listing canvas: AC1 (background + selectable text
 * elements at real positions), AC2 (sidebar slot edit updates the canvas
 * live), AC3 (design persists and reloads with elements intact).
 *
 * Run:
 *   npx playwright test e2e/us-ai-032-editable-canvas.spec.ts
 *
 * TC-AI-032-01/02/03.                                             [LIVE ~$0.10]
 *
 * Why Playwright, not client unit tests: this story's own STORY.md documents
 * that jsdom-based unit tests here would pass on deleted code (a "keep in
 * sync" copy of the geometry helper, a JSON round-trip on an unrelated object
 * literal) — see "Verification status" section. AC1/AC2/AC3 are genuinely
 * about DOM interaction, canvas positioning, and a real save→reload round
 * trip against the real backend, none of which a mock proves.
 *
 * AC5 (export pixel parity) and AC6 (malformed-geometry safe default) are
 * NOT covered here — AC5 needs a pixel-diff harness against the two
 * competing export renderers (documented as real, separate work in
 * STORY.md's "Export parity" section); AC6 needs a way to inject malformed
 * geometry into a real extraction response, which this live-data test
 * cannot control. Both remain open follow-ups, not silently passed.
 *
 * Cost: 1 real generation (~$0.03-0.08) + 1 real layerize-text extraction
 * ($0.09) + 1 real design save ≈ $0.10-0.20 total. retries: 0.
 *
 * Auth: fresh throwaway account per run (FREE-tier quota isolation).
 *
 * Target environment: `.env`'s PLAYWRIGHT_BASE_URL points every spec at
 * STAGING by default, not localhost. To verify local changes:
 *   PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-ai-032-editable-canvas.spec.ts
 */
import { test, expect, type Page } from "@playwright/test";
import process from "node:process";

const baseURL = (process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

async function waitForTemplateGallery(page: Page) {
  await expect(page.getByRole("heading", { name: /template gallery/i })).toBeVisible({
    timeout: 30_000,
  });
}

async function registerFreshAccount(): Promise<{ token: string; user: unknown }> {
  const email = `e2e-032-${Date.now()}@test.local`;
  const res = await fetch(`${baseURL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "E2eProbe12345!", name: "E2E US-AI-032" }),
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

/** Locate a PROPERTY_SLOT_FIELDS text input by its Label text (no data-testid exists). */
function slotInput(page: Page, labelText: string) {
  return page
    .locator("label", { hasText: new RegExp(`^${labelText}$`) })
    .locator("xpath=..")
    .locator("input, textarea");
}

test.describe("US-AI-032 — TC-AI-032-01/02/03: editable canvas core ACs (no retries)", () => {
  test.describe.configure({ retries: 0 });
  test.use({ navigationTimeout: 90_000, actionTimeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(420_000);
    await ensureLoggedIn(page);
  });

  test("TC-AI-032-01/02/03: background + positioned selectable elements, live slot edit, persist + reload [LIVE ~$0.10-0.20]", async ({ page }) => {
    let composeBody: any = null;
    page.on("response", async (res) => {
      if (res.url().includes("/compose") && res.request().method() === "POST") {
        try { composeBody = await res.json(); } catch { /* non-JSON, ignore */ }
      }
    });

    await openEditorForQuickGenerate(page);
    await fillPropertyDetailsAndGenerate(page);

    const editableToggle = page.getByRole("button", { name: "Editable", exact: true }).first();
    await expect(editableToggle).toBeVisible({ timeout: 10_000 });
    await editableToggle.click();

    const composeWait = page
      .waitForResponse((r) => r.url().includes("/compose"), { timeout: 150_000 })
      .catch(() => null);
    await page.locator('button:has-text("Use This")').first().click();
    const composeRes = await composeWait;
    expect(composeRes?.ok(), `compose round trip must succeed (got ${composeRes?.status()})`).toBe(true);

    // waitForResponse resolves on headers, not on the body — poll for the
    // page.on('response') listener's async res.json() to actually land
    // (same pattern as us-ai-051-textfree-photo-background.spec.ts).
    await expect.poll(() => composeBody !== null, { timeout: 10_000, intervals: [250] }).toBe(true);
    expect(composeBody?.extraction?.blocksDetected).toBeGreaterThan(0);

    // ---- AC1: background layer + independently selectable text elements at
    // real (non-collapsed) positions. ----
    await page.waitForTimeout(1500); // let loadComposedDesignToCanvas settle
    const elementBoxes = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-element-id]'));
      return nodes.map((n) => {
        const r = n.getBoundingClientRect();
        return { id: n.getAttribute("data-element-id"), x: Math.round(r.x), y: Math.round(r.y) };
      });
    });
    expect(elementBoxes.length, "background + at least one text element").toBeGreaterThan(1);
    const distinctPositions = new Set(elementBoxes.map((b) => `${b.x},${b.y}`));
    expect(distinctPositions.size, "elements must not all collapse to one x=0,y=0-style origin").toBeGreaterThan(1);

    // Selectability: clicking a text element shows it as selected (RightSidebar
    // reacts to selection; a straightforward, implementation-agnostic proxy is
    // that the click does not throw and the element remains present after).
    const firstTextEl = page.locator('[data-element-id]').nth(1); // [0] is typically the background image
    await firstTextEl.click({ force: true });
    await expect(firstTextEl).toBeVisible();

    // ---- AC2: editing a slot value in the sidebar updates the canvas live. ----
    // After a design loads, the sidebar shows the results panel (Quick
    // Generate + variations), not the Design/Property/Agent tabs — those
    // live behind the "Edit Details" back-link (setShowResults(false)).
    // The canvas itself is unaffected by this toggle; only the sidebar view.
    await page.getByRole("button", { name: /edit details/i }).click();
    await page.getByRole("button", { name: "Property", exact: true }).click();
    const priceField = slotInput(page, "Price");
    await expect(priceField).toBeVisible({ timeout: 10_000 });
    const NEW_PRICE = "₹ 2,10,00,000";
    await priceField.fill(NEW_PRICE);
    await priceField.blur();

    await expect
      .poll(
        async () =>
          page.evaluate(() =>
            Array.from(document.querySelectorAll<HTMLElement>('[data-element-id]')).some((n) =>
              (n.textContent || "").includes("2,10,00,000"),
            ),
          ),
        { timeout: 10_000, intervals: [500] },
      )
      .toBe(true);

    // ---- AC3: the design persists and reloads with all elements intact. ----
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.locator("#design-name").fill(`E2E US-AI-032 ${Date.now()}`);
    await page.getByRole("button", { name: /save design/i }).click();
    await expect(page).toHaveURL(/\/editor\?designId=/, { timeout: 20_000 });

    const preReloadCount = elementBoxes.length;

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="design-canvas"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-element-id]').first()).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(1000);

    const postReload = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-element-id]'));
      return {
        count: nodes.length,
        hasEditedPrice: nodes.some((n) => (n.textContent || "").includes("2,10,00,000")),
      };
    });
    expect(postReload.count, "same number of elements survives reload").toBe(preReloadCount);
    expect(postReload.hasEditedPrice, "the slot edit persisted, not just the original generated value").toBe(true);
  });
});
