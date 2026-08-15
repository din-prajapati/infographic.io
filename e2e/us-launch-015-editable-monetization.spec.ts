/**
 * US-LAUNCH-015 — editable-design monetization, live re-verification.
 *
 * Run:
 *   npx playwright test e2e/us-launch-015-editable-monetization.spec.ts
 *
 * TC-LAUNCH-015-06: live FREE-tier browser run — trial compose works; the
 * next compose attempt (same org) hits the upgrade toast and still loads
 * flat, never leaving the user with nothing.                    [LIVE ~$0.10-0.20]
 *
 * The trial gate is ORG-WIDE, not per-generation, so this is exercised
 * within a single generation's variations: compose variation 1 (consumes
 * the one lifetime trial, real extraction, real $0.09) then compose
 * variation 2 (blocked BEFORE extraction fires — the gate check runs first,
 * so the second attempt costs nothing).
 *
 * There is no mocked variant — the whole point is the real server-side gate
 * (GenerationsService.getComposedDesign, backed by a real Postgres query
 * for composedDesigns across the org) actually blocking a real second
 * request, and the real 402 actually reaching the client's ApiError/toast
 * wiring end to end.
 *
 * Auth: fresh throwaway account per run — the trial is org-wide and
 * permanent (lifetime), so a shared account would only get one real pass
 * ever across all future runs of this spec.
 *
 * Target environment: `.env`'s PLAYWRIGHT_BASE_URL points every spec at
 * STAGING by default, not localhost. To verify local changes:
 *   PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-launch-015-editable-monetization.spec.ts
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
  const email = `e2e-launch015-${Date.now()}@test.local`;
  const res = await fetch(`${baseURL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "E2eProbe12345!", name: "E2E US-LAUNCH-015" }),
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

test.describe("US-LAUNCH-015 — FREE-tier editable trial gate, live (no retries)", () => {
  test.describe.configure({ retries: 0 });
  test.use({ navigationTimeout: 90_000, actionTimeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(420_000);
    await ensureLoggedIn(page);
  });

  test("first compose succeeds (lifetime trial); second compose on the same org hits the upgrade toast and still loads flat [LIVE ~$0.10-0.20]", async ({ page }) => {
    const composeResponses: number[] = [];
    page.on("response", (res) => {
      if (res.url().includes("/compose") && res.request().method() === "POST") {
        composeResponses.push(res.status());
      }
    });

    await openEditorForQuickGenerate(page);
    await fillPropertyDetailsAndGenerate(page);

    const editableToggle = page.getByRole("button", { name: "Editable", exact: true }).first();
    await expect(editableToggle).toBeVisible({ timeout: 10_000 });
    await editableToggle.click();

    const variationCards = page.locator('button:has-text("Use This")');
    await expect(variationCards).toHaveCount(3, { timeout: 10_000 }).catch(() => {
      // Some templates may generate fewer than 3 — proceed with whatever count exists,
      // the test only strictly needs 2 to exercise trial-then-blocked.
    });
    const cardCount = await variationCards.count();
    test.skip(cardCount < 2, "Need at least 2 variations to exercise trial-then-blocked on the same org");

    // ---- First compose: consumes the one lifetime trial, real extraction ----
    const firstComposeWait = page
      .waitForResponse((r) => r.url().includes("/compose"), { timeout: 150_000 })
      .catch(() => null);
    await variationCards.nth(0).click();
    const firstRes = await firstComposeWait;
    expect(firstRes?.ok(), `first (trial) compose must succeed (got ${firstRes?.status()})`).toBe(true);
    await expect(page.locator('[data-element-id]').first()).toBeVisible({ timeout: 20_000 });

    // ---- Second compose: trial already used — must be blocked with 402, ----
    // ---- design still loads flat, upgrade toast shown.                  ----
    const secondComposeWait = page
      .waitForResponse((r) => r.url().includes("/compose"), { timeout: 30_000 })
      .catch(() => null);
    await variationCards.nth(1).click();
    const secondRes = await secondComposeWait;

    expect(secondRes?.status(), "second compose must be blocked with 402 EDITABLE_REQUIRES_UPGRADE").toBe(402);

    // AC5: the design still loads — never a dead end. Flat mode means a
    // single image element, not editable text elements.
    await expect(page.locator('[data-testid="design-canvas"]')).toBeVisible();

    // AC5: upgrade toast fired, naming the feature, linking to /pricing.
    await expect(page.getByText(/editable designs are a paid feature/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /view plans/i })).toBeVisible();

    console.log(`[US-LAUNCH-015] compose responses observed: ${JSON.stringify(composeResponses)}`);
  });
});
