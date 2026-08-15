/**
 * US-AI-048 — TC-AI-048-06: live re-verification of the compose cache.
 *
 * Run:
 *   npx playwright test e2e/us-ai-048-compose-cache.spec.ts
 *
 * The only remaining open TC for this story — AC1/2/3/4/5/6/7 already have
 * unit coverage (`api/tests/ai-generation/compose-cache.spec.ts`, 13 tests,
 * all passing). This is the one live claim those unit tests can't make on
 * their own: a second real "Use This" click on the SAME variation is a
 * genuine cache hit end to end — fast, and does not meter a second $0.09.
 *
 * There is no mocked variant — the whole point is a REAL first compose
 * (paid, slow) followed by a REAL second compose on the same variation
 * (free, fast) against the actual DB-backed cache, not a stub of it.
 *
 * Cost: 1 real generation (~$0.03-0.08) + exactly 1 real layerize-text
 * extraction ($0.09, the FIRST click only — the whole test is asserting the
 * second one does NOT happen) ≈ $0.10-0.20 total. retries: 0.
 *
 * Auth: fresh throwaway account per run (FREE-tier quota isolation).
 *
 * Target environment: `.env`'s PLAYWRIGHT_BASE_URL points every spec at
 * STAGING by default, not localhost. To verify local changes:
 *   PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-ai-048-compose-cache.spec.ts
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
  const email = `e2e-048-${Date.now()}@test.local`;
  const res = await fetch(`${baseURL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "E2eProbe12345!", name: "E2E US-AI-048" }),
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

test.describe("US-AI-048 — TC-AI-048-06: compose cache live re-verification (no retries)", () => {
  test.describe.configure({ retries: 0 });
  test.use({ navigationTimeout: 90_000, actionTimeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(420_000);
    await ensureLoggedIn(page);
  });

  test("TC-AI-048-06: second Use This on the same variation is a fast, unmetered cache hit [LIVE ~$0.10-0.20]", async ({ page }) => {
    const composeResponses: { status: number; durationMs: number }[] = [];
    const requestStartedAt = new Map<string, number>();
    page.on("request", (req) => {
      if (req.url().includes("/compose") && req.method() === "POST") {
        requestStartedAt.set(req.url() + req.postData(), Date.now());
      }
    });
    page.on("response", (res) => {
      if (res.url().includes("/compose") && res.request().method() === "POST") {
        const key = res.url() + res.request().postData();
        const startedAt = requestStartedAt.get(key);
        composeResponses.push({ status: res.status(), durationMs: startedAt ? Date.now() - startedAt : -1 });
      }
    });

    await openEditorForQuickGenerate(page);
    await fillPropertyDetailsAndGenerate(page);

    const editableToggle = page.getByRole("button", { name: "Editable", exact: true }).first();
    await expect(editableToggle).toBeVisible({ timeout: 10_000 });
    await editableToggle.click();

    // ---- First click: real extraction, paid, slow (15-90s observed). ----
    const firstComposeWait = page
      .waitForResponse((r) => r.url().includes("/compose"), { timeout: 150_000 })
      .catch(() => null);
    await page.locator('button:has-text("Use This")').first().click();
    const firstRes = await firstComposeWait;
    expect(firstRes?.ok(), `first compose must succeed (got ${firstRes?.status()})`).toBe(true);
    await expect(page.locator('[data-element-id]').first()).toBeVisible({ timeout: 20_000 });

    // ---- Second click: SAME variation. Re-select it explicitly (it now
    // reads "Applied") to force the load path to run again rather than
    // relying on residual state, then click Use This again. ----
    const secondComposeWait = page
      .waitForResponse((r) => r.url().includes("/compose"), { timeout: 30_000 })
      .catch(() => null);
    const secondClickStart = Date.now();
    await page.locator('button:has-text("Applied")').first().click();
    const secondRes = await secondComposeWait;
    const secondClickDuration = Date.now() - secondClickStart;

    expect(secondRes?.ok(), `second (cached) compose must also succeed (got ${secondRes?.status()})`).toBe(true);
    console.log(`[US-AI-048] second compose round trip: ${secondClickDuration}ms`);

    // AC1/AC6 proxy: a cache hit is architecturally near-instant (DB read,
    // no provider call) vs. the 15-90s observed for a real extraction. A
    // generous 5s ceiling comfortably separates "cache hit" from "real call"
    // without being flaky on a loaded CI box.
    expect(secondClickDuration, "second compose must be a fast cache hit, not a re-run of real extraction").toBeLessThan(5_000);

    expect(composeResponses.length, "exactly two /compose round trips observed").toBe(2);
  });
});
