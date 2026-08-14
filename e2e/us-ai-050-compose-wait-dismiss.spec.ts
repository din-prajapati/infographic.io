/**
 * US-AI-050 — AC3: a cancel/dismiss control is reachable during the editable
 * compose wait (observed 15-90s), not just a wait-it-out spinner.
 *
 * Run:
 *   npx playwright test e2e/us-ai-050-compose-wait-dismiss.spec.ts
 *
 * TC-AI-050-05: dismiss mid-wait returns to a usable state.       [LIVE ~$0.10]
 *
 * The lightbox preview's close (X) button is the dismiss control this story
 * shipped (RightSidebar.tsx) — it is never disabled by loadingVariationId,
 * unlike the "Use This Design" button inside it. This test proves that
 * property, live, rather than reading the JSX and assuming it.
 *
 * There is no mocked variant — the whole point is a REAL layerize-text call
 * in flight (15-90s observed) at the moment of dismissal; a mocked/instant
 * response would close before there's anything to dismiss.
 *
 * Cost: 1 real generation (~$0.03-0.08) + 1 real layerize-text extraction
 * ($0.09, still fires — dismissing the lightbox does not abort the in-flight
 * request, only the UI's handling of it) ≈ $0.10-0.20 total. retries: 0.
 *
 * Auth: fresh throwaway account per run (FREE-tier quota isolation).
 *
 * Target environment: `.env`'s PLAYWRIGHT_BASE_URL points every spec at
 * STAGING by default, not localhost. To verify local changes:
 *   PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-ai-050-compose-wait-dismiss.spec.ts
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
  const email = `e2e-050-${Date.now()}@test.local`;
  const res = await fetch(`${baseURL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "E2eProbe12345!", name: "E2E US-AI-050" }),
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

test.describe("US-AI-050 — TC-AI-050-05: dismiss reachable during compose wait (no retries)", () => {
  test.describe.configure({ retries: 0 });
  test.use({ navigationTimeout: 90_000, actionTimeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(420_000);
    await ensureLoggedIn(page);
  });

  test("TC-AI-050-05: lightbox X dismisses mid-compose without trapping the user [LIVE ~$0.10-0.20]", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    let composeResolved = false;
    page.on("response", (res) => {
      if (res.url().includes("/compose") && res.request().method() === "POST") {
        composeResolved = true;
      }
    });

    await openEditorForQuickGenerate(page);
    await fillPropertyDetailsAndGenerate(page);

    const editableToggle = page.getByRole("button", { name: "Editable", exact: true }).first();
    await expect(editableToggle).toBeVisible({ timeout: 10_000 });
    await editableToggle.click();

    // Open the lightbox for the first variation, then trigger the compose
    // wait from inside it — this is the path with the X dismiss control.
    await page.locator('[title="Preview full size"]').first().click();
    const lightboxUseButton = page.getByRole("button", { name: /use this design/i });
    await expect(lightboxUseButton).toBeVisible({ timeout: 10_000 });
    await lightboxUseButton.click();

    // Wait for the compose-in-flight label to actually appear — proves we
    // are dismissing a REAL in-flight wait, not an already-finished one.
    await expect(page.getByText(/extracting text layers…/i)).toBeVisible({ timeout: 15_000 });
    expect(composeResolved, "compose must still be in flight at dismissal").toBe(false);

    // AC3 — the dismiss control: lightbox close (X), positioned top-right,
    // never disabled by loadingVariationId (unlike the Use This button).
    const closeButton = page.locator('button:has(svg.lucide-x)').first();
    await expect(closeButton).toBeEnabled();
    await closeButton.click();

    // The lightbox itself must actually close — proving the control works,
    // not just that it's clickable.
    await expect(page.getByRole("button", { name: /use this design/i })).toHaveCount(0, { timeout: 5_000 });

    // The rest of the UI must remain usable immediately after dismissal —
    // this is the "not trapped" half of AC3. The render-mode toggle and a
    // still-different-variation's "Use This" are both live, untouched controls.
    await expect(page.getByRole("button", { name: "Flat", exact: true }).first()).toBeEnabled();

    // Let the real (still in-flight) compose call resolve in the background
    // and confirm it does so cleanly — no uncaught page error, no state that
    // leaves the app permanently stuck (AC6's unmount-safety concern, ambient
    // to this AC since the compose caller here was the lightbox that no
    // longer exists in the tree).
    await expect.poll(() => composeResolved, { timeout: 150_000, intervals: [2_000] }).toBe(true);
    await page.waitForTimeout(1_000);

    expect(pageErrors, `no uncaught page errors after dismiss + background resolve: ${pageErrors.join("; ")}`).toHaveLength(0);

    // App must still be interactive after the stale response lands — re-open
    // the lightbox and confirm the Use This control is fresh (not stuck mid-
    // spinner from the dismissed attempt).
    await page.locator('[title="Preview full size"]').first().click();
    await expect(page.getByRole("button", { name: /use this design/i })).toBeEnabled({ timeout: 10_000 });
  });
});
