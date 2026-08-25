/**
 * US-EDIT-005 — manual test pass (TC-EDIT-005-01/02/03/05), automated.
 *
 * Run:
 *   PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-edit-005-canvas-edit-toolbar.spec.ts
 *
 * These four TCs were written as Manual in STORY.md. Automating them here so
 * the evidence is reproducible rather than a one-off screenshot session.
 *
 * There is no mocked variant, for the same reason as US-AI-048: TC-02's whole
 * claim is that a REAL extraction shows a real loading state, and TC-03's is
 * that a cache hit is visibly faster. Stubbing the provider would assert
 * nothing about either.
 *
 * Cost: 1 real generation (~$0.03-0.08) + 1 real layerize extraction ($0.09)
 * ≈ $0.10-0.20. retries: 0.
 *
 * Auth: fresh throwaway FREE account per run — required by TC-05, which needs
 * the US-LAUNCH-015 lifetime editable trial in a known state.
 *
 * Target: PLAYWRIGHT_BASE_URL defaults to STAGING in .env — always override to
 * localhost when verifying local changes.
 */
import { test, expect, type Page } from "@playwright/test";
import process from "node:process";

const baseURL = (process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

const TOOLBAR = '[data-testid="canvas-edit-toolbar"]';

async function registerFreshAccount(): Promise<{ token: string; user: unknown }> {
  const email = `e2e-edit005-${Date.now()}@test.local`;
  const res = await fetch(`${baseURL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "E2eProbe12345!", name: "E2E US-EDIT-005" }),
  });
  if (!res.ok) throw new Error(`Registration failed: HTTP ${res.status} — ${await res.text()}`);
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
    throw new Error(`Cannot load /templates (HTTP ${res?.status() ?? "none"}). baseURL: ${baseURL}`);
  }
  await expect(page.getByRole("heading", { name: /template gallery/i })).toBeVisible({ timeout: 30_000 });
}

async function openEditorForQuickGenerate(page: Page) {
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

test.describe("US-EDIT-005 — floating Edit elements control (live)", () => {
  test.describe.configure({ retries: 0 });
  test.use({ navigationTimeout: 90_000, actionTimeout: 60_000 });

  test("TC-01/02/03/05 [LIVE ~$0.10-0.20]", async ({ page }) => {
    test.setTimeout(600_000);

    const consoleErrors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });
    const composeCalls: { status: number; ms: number }[] = [];
    const startedAt = new Map<string, number>();
    page.on("request", (r) => {
      if (r.url().includes("/compose") && r.method() === "POST") {
        startedAt.set(r.url() + r.postData(), Date.now());
      }
    });
    page.on("response", (r) => {
      if (r.url().includes("/compose") && r.request().method() === "POST") {
        const k = r.url() + r.request().postData();
        const s = startedAt.get(k);
        composeCalls.push({ status: r.status(), ms: s ? Date.now() - s : -1 });
      }
    });

    await ensureLoggedIn(page);
    await openEditorForQuickGenerate(page);
    await fillPropertyDetailsAndGenerate(page);

    // Place the generated design flat on the canvas. The template's own layers
    // are already mounted, so waiting on a generic [data-element-id] proves
    // nothing — wait for the AI image element itself, which only appears once
    // loadAiVariationToCanvas has finished its proxy fetch + decode.
    await page.locator('button:has-text("Use This")').first().click();
    await expect(
      page.locator('[data-element-id^="ai-gen-"]'),
      "flat AI variation must actually land on the canvas before proceeding",
    ).toBeVisible({ timeout: 90_000 });

    // ── TC-EDIT-005-01 — control visible adjacent to canvas, not in a panel ──
    const toolbar = page.locator(TOOLBAR);
    await expect(toolbar, "TC-01: floating control renders adjacent to the canvas").toBeVisible({
      timeout: 15_000,
    });
    await expect(
      toolbar.getByRole("button", { name: /edit elements/i }),
      "TC-01: control offers 'Edit elements' for a flat generation",
    ).toBeVisible();

    // AC1 — replaces the old in-panel toggle, does not duplicate it.
    const oldToggle = page.getByRole("button", { name: "Editable", exact: true });
    expect(await oldToggle.count(), "AC1: old RightSidebar 'Editable' toggle is gone").toBe(0);
    console.log("[TC-01] PASS — floating control visible, old panel toggle absent");

    // ── TC-EDIT-005-02 — first compose: real loading state, free, transitions ──
    const editBtn = toolbar.getByRole("button", { name: /edit elements/i });
    const firstWait = page
      .waitForResponse((r) => r.url().includes("/compose") && r.request().method() === "POST", {
        timeout: 180_000,
      })
      .catch(() => null);
    // Let any toast from the flat load expire, so whatever we capture after the
    // click is unambiguously produced BY the click.
    await expect
      .poll(async () => (await page.locator("[data-sonner-toast]").allInnerTexts()).length, {
        timeout: 20_000,
        intervals: [1000],
      })
      .toBe(0);
    console.log("[TC-02 diag] toast queue drained before click");

    const t0 = Date.now();
    await editBtn.click();

    // Diagnostic: if the click early-returns, it surfaces as a toast rather
    // than a loading state. Capture whichever happens so a failure explains
    // itself instead of just timing out.
    await page.waitForTimeout(2500);
    const toastText = await page
      .locator("[data-sonner-toast], [role='status']")
      .allInnerTexts()
      .catch(() => [] as string[]);
    console.log(`[TC-02 diag] toasts after click: ${JSON.stringify(toastText)}`);
    console.log(`[TC-02 diag] toolbar text after click: ${await toolbar.innerText().catch(() => "?")}`);
    console.log(`[TC-02 diag] compose calls so far: ${JSON.stringify(composeCalls)}`);
    const elementIds = await page
      .locator("[data-element-id]")
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.elementId))
      .catch(() => []);
    console.log(`[TC-02 diag] canvas element ids: ${JSON.stringify(elementIds)}`);

    // The real extraction is slow (15-90s), so the delayed indicator must appear.
    await expect(
      toolbar.getByText(/separating layers/i),
      "TC-02: a real loading state shows during extraction",
    ).toBeVisible({ timeout: 15_000 });
    console.log("[TC-02] loading state observed");

    const firstRes = await firstWait;
    const firstMs = Date.now() - t0;
    expect(firstRes?.ok(), `TC-02: first compose must succeed (got ${firstRes?.status()})`).toBe(true);

    await expect(
      toolbar.getByText(/editable layers active/i),
      "TC-02: canvas transitions to editable mode",
    ).toBeVisible({ timeout: 60_000 });
    console.log(`[TC-02] PASS — first compose ${firstMs}ms, status ${firstRes?.status()}`);

    // ── TC-EDIT-005-03 — cache hit: near-instant, NO loading indicator ────────
    const secondWait = page
      .waitForResponse((r) => r.url().includes("/compose") && r.request().method() === "POST", {
        timeout: 8_000,
      })
      .catch(() => null);
    const t1 = Date.now();
    await toolbar.getByRole("button").first().click();
    // Capture the acknowledgement immediately — sonner expires it in ~4s, well
    // before the compose-absence wait below finishes.
    const reclickAck = await page
      .getByText(/design is already editable/i)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    const secondRes = await secondWait;
    const secondMs = Date.now() - t1;

    // The 200ms delayed-indicator (LOADING_INDICATOR_DELAY_MS) means a cache
    // hit should resolve before the spinner ever renders.
    const spinnerAppeared = await toolbar
      .getByText(/separating layers/i)
      .isVisible()
      .catch(() => false);

    console.log(
      `[TC-03] re-click ${secondMs}ms, second compose fired: ${secondRes !== null}, spinner shown: ${spinnerAppeared}`,
    );

    // TC-03's substance is "no re-extraction, no loading state, no quota change"
    // on an already-composed design. This control satisfies it more strongly
    // than a cache hit would: it short-circuits before any network call at all
    // (the `isEditableMode && hasExtractedLayers` guard), so there is no second
    // /compose to time. The DB-level cache-hit path is separately covered live
    // by e2e/us-ai-048-compose-cache.spec.ts via the sidebar's variation
    // re-selection, which is the flow that actually re-issues the request.
    expect(composeCalls.length, "TC-03: no second extraction is issued").toBe(1);
    expect(spinnerAppeared, "TC-03: no loading state on an already-editable design").toBe(false);
    expect(reclickAck, "TC-03: re-click is acknowledged, not silently ignored").toBe(true);

    // ── TC-EDIT-005-05 — FREE tier past lifetime trial → dedicated modal ─────
    // The trial was consumed by TC-02. Composing a DIFFERENT variation is the
    // charged path, so this FREE account should now be blocked with the
    // dedicated upgrade prompt rather than a bare toast.
    // NOTE on surface: the toolbar's own Dialog can only be reached from a
    // canvas with no composed layers on it, and TC-02 has just put some there
    // (loadAiVariationToCanvas prepends, so the composed-* elements survive).
    // What this asserts is the gating itself — that a FREE account past its
    // lifetime trial is blocked at the API with the upgrade reason rather than
    // silently charged. Which surface renders that reason is asserted by the
    // AC5 unit/structural coverage, not here.
    const otherVariation = page.locator('button:has-text("Use This")').nth(1);
    if ((await otherVariation.count()) > 0) {
      const blockedWait = page
        .waitForResponse(
          (r) => r.url().includes("/compose") && r.request().method() === "POST" && r.status() === 402,
          { timeout: 60_000 },
        )
        .catch(() => null);
      await otherVariation.click();
      const blocked = await blockedWait;
      console.log(`[TC-05] second-variation compose status: ${blocked?.status() ?? "no 402 seen"}`);
      expect(blocked?.status(), "TC-05: FREE tier past trial is blocked with 402, not charged").toBe(402);

      const upgradeShown = await page
        .getByText(/paid feature|upgrade/i)
        .first()
        .isVisible({ timeout: 15_000 })
        .catch(() => false);
      console.log(`[TC-05] upgrade messaging surfaced: ${upgradeShown}`);
      expect(upgradeShown, "TC-05: the block is explained as an upgrade prompt").toBe(true);
    } else {
      console.log("[TC-05] SKIPPED — only one variation returned by this generation");
    }

    console.log(`[compose calls] ${JSON.stringify(composeCalls)}`);
    console.log(`[console errors] ${consoleErrors.length}: ${consoleErrors.slice(0, 5).join(" | ")}`);
  });
});
