/**
 * US-EDIT-009 — Gate 2, automated.
 *
 * M-EDIT-03 removed the pre-generation "Edit as: Flat / Editable" toggle.
 * Generation is always flat; text becomes editable through CanvasEditToolbar
 * after the design is on the canvas. Gate 2 is the story's human visual check;
 * these tests cover the parts a machine can actually decide.
 *
 * Run:
 *   npx playwright test e2e/us-edit-009-gate2.spec.ts
 *
 * Coverage — see STORY.md's Gate 2 table:
 *   step 1  TC-EDIT-009-01  no mode choice anywhere pre-generation      [FREE]
 *   step 3  TC-EDIT-009-12  AI Chat design → "Edit elements" resolves   [1 gen]
 *   step 4  TC-EDIT-009-05  a fresh template is not "already editable"  [free]
 *   step 5  —               real-photo background (opt-in, see below)   [1 gen]
 *
 * Cost: ONE real generation by default (~$0.08). Step 5 costs a second one and
 * is skipped unless RUN_PHOTO_CHECK=1.
 *
 * Why step 3 is the one that matters: US-EDIT-009 AC9 was a regression found
 * during implementation, not in review. `setActiveGenerationId` was called in
 * exactly one place — RightSidebar's *panel-triggered* WebSocket handler — so
 * removing AI Chat's own editable branch would have stranded every AI Chat
 * design at "Design isn't linked to a generation". The unit test proves the
 * store setter works; only this proves AI Chat calls it on the real completion
 * path. Quick Generate would pass even with the bug present, so this test
 * deliberately drives AI Chat and never Quick Generate.
 *
 * Auth: fresh throwaway account per run (FREE-tier quota isolation), same
 * pattern as us-ai-032-editable-canvas.spec.ts.
 *
 * Target environment: PLAYWRIGHT_BASE_URL defaults every spec at STAGING.
 * For local changes:
 *   PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-edit-009-gate2.spec.ts
 */
import { test, expect, type Page } from "@playwright/test";
import process from "node:process";

const baseURL = (process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

/** The exact toast AC9 must never produce. CanvasEditToolbar.tsx:92. */
const NOT_LINKED_TOAST = /Design isn't linked to a generation/i;

/**
 * M-INFRA-01 check 1 — is a generated image stored on storage we own?
 *
 * Deliberately not a single hardcoded domain: the two environments publish R2
 * differently, and asserting production's domain would fail on staging for a
 * correct system.
 *   production  assets.buildographic.com   (custom domain)
 *   staging     pub-<id>.r2.dev            (managed subdomain, no custom domain)
 *
 * Override with R2_PUBLIC_URL_EXPECTED when pointing at an environment whose
 * public URL is neither of those.
 *
 * The failure this catches is quiet by design: uploadAndFallback() never
 * throws, so a misconfigured R2 degrades to the original Ideogram URL instead
 * of failing the generation. Nothing errors, nothing looks wrong — the stored
 * URL simply expires weeks later, taking the customer's design with it. That
 * is why this asserts on the *stored* URL rather than on whether the image
 * renders: a fallback URL renders perfectly today.
 */
const OWNED_URL = process.env.R2_PUBLIC_URL_EXPECTED
  ? new RegExp(process.env.R2_PUBLIC_URL_EXPECTED.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
  : /(assets\.buildographic\.com|\.r2\.dev)/i;

async function registerFreshAccount(): Promise<{ token: string; user: unknown }> {
  const email = `e2e-edit009-${Date.now()}@test.local`;
  const res = await fetch(`${baseURL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "E2eProbe12345!", name: "E2E US-EDIT-009" }),
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
  await expect(page.getByRole("heading", { name: /template gallery/i })).toBeVisible({
    timeout: 30_000,
  });
}

/** Open a template into the editor. Gives the canvas real (non-AI) elements. */
async function openTemplateInEditor(page: Page) {
  await expect(page.getByRole("heading", { name: /template gallery/i })).toBeVisible({
    timeout: 60_000,
  });
  const useTemplate = page.getByRole("button", { name: "Use Template" }).first();
  await expect(useTemplate).toBeVisible({ timeout: 60_000 });
  await useTemplate.scrollIntoViewIfNeeded();
  await useTemplate.click();
  await expect(page).toHaveURL(/\/editor\?.*templateId=/, { timeout: 30_000 });
  await expect(page.locator('[data-testid="design-canvas"]')).toBeVisible();
}

async function openAiChat(page: Page) {
  await page.getByRole("button", { name: /open ai chat/i }).click();
  await expect(page.locator("#ai-chat-panel")).toBeVisible();
}

/**
 * Drive AI Chat to a completed generation. Deliberately NOT Quick Generate —
 * see the AC9 note in the file header.
 */
async function generateFromAiChat(page: Page, prompt: string) {
  const textarea = page.locator("#ai-chat-panel textarea");
  await expect(textarea).toBeVisible({ timeout: 30_000 });
  await textarea.fill(prompt);

  await page.locator("#ai-chat-panel").getByTitle("Generate").click();

  // Fail fast on the intent gate rather than waiting out the results timeout.
  // AI Chat validates the prompt before generating and answers "Missing
  // Information" if it cannot find an address — no generation is started, so a
  // rejected prompt is free, but it also means results will never arrive and
  // waiting 5 minutes for them tells you nothing about why.
  const missingInfo = page.locator("#ai-chat-panel").getByText(/missing information/i);
  const editButton = page.locator("#ai-chat-panel").getByTitle("Customize in editor").first();

  await expect(missingInfo.or(editButton).first()).toBeVisible({ timeout: 300_000 });
  if (await missingInfo.isVisible()) {
    throw new Error(
      "AI Chat rejected the prompt as incomplete — no generation started. " +
        "It needs a street-style address; see the prompt used in this spec.",
    );
  }
  await expect(editButton).toBeVisible({ timeout: 300_000 });
}

test.describe("US-EDIT-009 — Gate 2 (automated portion)", () => {
  test.describe.configure({ retries: 0 });
  test.use({ navigationTimeout: 90_000, actionTimeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(600_000);
    await ensureLoggedIn(page);
  });

  // ── Step 1 — free, no generation ────────────────────────────────────────
  test("step 1 (TC-01): no flat/editable mode choice is offered before generating", async ({
    page,
  }) => {
    await openTemplateInEditor(page);
    await openAiChat(page);

    const panel = page.locator("#ai-chat-panel");

    // Positive control. Every assertion below is an absence, and an absence
    // passes just as happily against a panel that failed to render. Prove we
    // are looking at a live, populated panel before concluding anything from
    // what is missing in it.
    await expect(panel.locator("textarea")).toBeVisible({ timeout: 30_000 });
    await expect(panel.getByTitle("Generate")).toBeVisible();

    // The removed control rendered the literal label "Edit as:" beside a
    // Flat / Editable pair, in two places (conversation view and results view).
    await expect(panel.getByText(/edit as:/i)).toHaveCount(0);
    await expect(panel.getByRole("button", { name: /^flat$/i })).toHaveCount(0);
    await expect(panel.getByRole("button", { name: /^editable$/i })).toHaveCount(0);

    // And nowhere else on the page either — RightSidebar hosted its own copy
    // of the same preference.
    await expect(page.getByText(/edit as:/i)).toHaveCount(0);
  });

  // ── Steps 3 + 4 — one real generation, both assertions ──────────────────
  test("steps 3+4 (TC-12, TC-05): an AI Chat design extracts, and a fresh template does not inherit it", async ({
    page,
  }, testInfo) => {
    // M-INFRA-01 check 1 rides along on the generation this test already pays
    // for. Capture the variations payload the app itself fetches, rather than
    // reading the canvas <img src>: that src is the /api/proxy-image URL (CORS
    // bypass), so it would report the proxy's host no matter where the bytes
    // actually live, and pass against a broken R2.
    const variationUrls: string[] = [];
    page.on("response", async (res) => {
      if (!/\/infographics\/generations\/[^/]+\/variations/.test(res.url())) return;
      try {
        const body = await res.json();
        for (const v of Array.isArray(body) ? body : []) {
          if (typeof v?.imageUrl === "string") variationUrls.push(v.imageUrl);
        }
      } catch {
        /* non-JSON or already consumed — the assertion below reports the gap */
      }
    });

    await openTemplateInEditor(page);
    await openAiChat(page);
    await generateFromAiChat(
      page,
      // Matches the shape AI Chat asks for ("3BR house at 123 Oak St, Austin TX
      // for $450k") — a street-level address, or it refuses to generate.
      "3 BHK villa at 12 Oak Road, Ahmedabad priced 18500000 with pool",
    );

    // Place the result on the canvas via the chat's Edit action. Under
    // US-EDIT-009 this is a plain flat load — no mode was ever chosen.
    await page.locator("#ai-chat-panel").getByTitle("Customize in editor").first().click();

    // ── M-INFRA-01 check 1 — the generated image is on storage we own ──────
    // Free: this generation was already bought by the AC9 check above.
    expect(
      variationUrls.length,
      "no /variations response was captured — the check below would pass vacuously",
    ).toBeGreaterThan(0);

    // Record the hosts. A green assertion says "it matched"; a milestone
    // acceptance wants "here is what it was", and this is the artifact that
    // closes M-INFRA-01 check 1 rather than merely reporting it closed.
    const hosts = [...new Set(variationUrls.map((u) => new URL(u).host))];
    await testInfo.attach("stored-image-hosts", {
      body: `${hosts.join("\n")}\n\n(${variationUrls.length} variation URL(s) captured)`,
      contentType: "text/plain",
    });

    for (const url of variationUrls) {
      expect(url, `variation still served from the provider CDN: ${url}`).not.toMatch(
        /ideogram\.ai/i,
      );
      expect(url, `variation is not on an owned domain: ${url}`).toMatch(OWNED_URL);
    }

    // Wait for the image to actually land on the canvas before touching the
    // toolbar. This matters more than it looks: the toolbar is already on
    // screen from the *template's* own elements, so asserting it is visible
    // proves nothing about the AI design, and clicking too early makes
    // CanvasEditToolbar return "Generate or select a design first" — it finds
    // no isAiImport element yet. loadAiVariationToCanvas is async (it fetches
    // and measures the image), and this success toast is the app's own signal
    // that it finished.
    await expect(page.getByText(/AI design loaded/i)).toBeVisible({ timeout: 120_000 });

    const toolbar = page.locator('[data-testid="canvas-edit-toolbar"]');
    await expect(toolbar).toBeVisible({ timeout: 60_000 });

    // Pre-condition for step 4 to mean anything: this design starts flat.
    await expect(toolbar.getByText(/edit elements/i)).toBeVisible();

    // ── AC9, asserted on the mechanism rather than on a toast.
    //
    // The toast is the symptom; the compose call is the thing. If the store
    // never received the generation id, CanvasEditToolbar returns early and
    // POST /generations/:id/compose is never sent — so the request either
    // happens (id resolved) or it does not (AC9 regression), with no ambiguity
    // and nothing that auto-dismisses while we look at it. An earlier version
    // of this test waited on toast text and timed out against a working app,
    // because by then the canvas had swapped in the image-selection toolbar.
    const composeCall = page.waitForRequest(
      (r) =>
        /\/infographics\/generations\/[^/]+\/compose/.test(r.url()) &&
        r.method() === "POST",
      { timeout: 180_000 },
    );

    // Capture the early-return toast if there is one. CanvasEditToolbar has
    // three guards that return before composing, and all three raise a toast
    // that auto-dismisses in seconds — long gone by the time a 180s timeout
    // takes its DOM snapshot. Without this, a failure here says only "no
    // request", which is the symptom of all three and the diagnosis of none.
    const guardToast = page
      .getByText(NOT_LINKED_TOAST)
      .or(page.getByText(/Generate or select a design first/i))
      .or(page.getByText(/Design is already editable/i))
      .or(page.getByText(/Editable designs are a paid feature/i))
      .or(page.getByText(/Monthly limit reached/i))
      .first();

    await toolbar.getByRole("button").click();

    const guardText = await guardToast
      .textContent({ timeout: 8_000 })
      .catch(() => null);
    if (guardText) {
      throw new Error(
        `"Edit elements" returned early instead of composing — toast said: "${guardText.trim()}". ` +
          `If that is "Design isn't linked to a generation", this is the AC9 regression: ` +
          `AI Chat did not publish its generation id to useGenerationPrefs.`,
      );
    }

    const request = await composeCall;

    // The id in the URL must be a real generation id, not a placeholder — the
    // exact bug US-EDIT-005 fixed once already ('current-gen' was being sent).
    const composedId = request.url().match(/generations\/([^/]+)\/compose/)?.[1] ?? "";
    expect(composedId.length).toBeGreaterThan(8);
    expect(composedId).not.toBe("current-gen");

    // Belt and braces: the failure toast must never have appeared.
    await expect(page.getByText(NOT_LINKED_TOAST)).toHaveCount(0);

    // The call must not fail outright. A 402/403 (paywall) still proves AC9 —
    // it got far enough to be told no — so only server faults fail here.
    const response = await request.response();
    expect(response?.status() ?? 599).toBeLessThan(500);

    // ── Step 4 / TC-05 — the regression CanvasEditToolbar's comment warns
    // about: a compose succeeding must not make every later canvas in the
    // session claim to be editable. Same page context, same session.
    await page.goto("/templates", { waitUntil: "domcontentloaded" });
    await openTemplateInEditor(page);

    const freshToolbar = page.locator('[data-testid="canvas-edit-toolbar"]');
    await expect(freshToolbar).toBeVisible({ timeout: 60_000 });

    // Must offer to extract, NOT report layers it does not have.
    await expect(freshToolbar.getByText(/edit elements/i)).toBeVisible();
    await expect(freshToolbar.getByText(/editable layers active/i)).toHaveCount(0);
  });

  // ── Step 5 — opt-in, and an honest proxy rather than a real check ───────
  test("step 5: real-photo generation evidence (opt-in)", async ({ page }, testInfo) => {
    test.skip(
      process.env.RUN_PHOTO_CHECK !== "1",
      "Costs a second generation. Set RUN_PHOTO_CHECK=1 to run.",
    );

    await openTemplateInEditor(page);
    await openAiChat(page);
    await generateFromAiChat(
      page,
      "3 BHK villa at 12 Oak Road, Ahmedabad priced 18500000 with pool",
    );

    await page.locator("#ai-chat-panel").getByTitle("Customize in editor").first().click();
    await expect(page.locator('[data-testid="design-canvas"]')).toBeVisible();

    // Capture the background for human review. This test does NOT decide
    // whether the photo came back unmarked — see the note below.
    await testInfo.attach("generated-background", {
      body: await page.locator('[data-testid="design-canvas"]').screenshot(),
      contentType: "image/png",
    });

    /**
     * Deliberately no pass/fail assertion on "is the background text-free".
     *
     * The obvious proxy — compose and assert `extraction.blocksDetected === 0`
     * — does not hold. US-AI-031b's AC1 was live-verified on 2026-08-15 with
     * blocksDetected: 0 on a run that went through the *text-baked* path;
     * extraction returning zero blocks is a known outcome that says nothing
     * about whether text was baked in. Asserting on it would produce a test
     * that passes whether or not AC8 works, which is worse than no test.
     *
     * So this leaves the judgment where it belongs and just hands the
     * screenshot to whoever runs Gate 2. Closing it properly needs a real
     * check — OCR over the background, or asserting on the prompt the
     * orchestrator sent — and that is worth its own story, not a proxy here.
     */
  });
});
