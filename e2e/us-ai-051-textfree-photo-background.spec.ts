/**
 * US-AI-051 — Text-free background prompt for real-photo + editable.
 *
 * Run:
 *   npx playwright test e2e/us-ai-051-textfree-photo-background.spec.ts
 *
 * TC-AI-051-05: real photo + Editable mode → text-free background, layout-engine
 *               overlay (not extraction)                        [LIVE ~$0.15-0.25]
 *
 * There is no mocked variant of this test. The story's entire claim is a real
 * backend + real Ideogram behavior — that renderMode='editable' + a photo
 * reference produces a background with NO baked-in text, verified by the
 * server's own extraction step finding zero blocks. Mocking any part of that
 * chain would test nothing this story actually built.
 *
 * Flow (why two generations):
 *   The render-mode toggle only renders once variations exist (AIChatBox.tsx —
 *   "shown when results are present"). So: upload photo → generate #1 (flat,
 *   reveals the toggle) → click Editable → generate #2 (now renderMode is
 *   'editable' in the shared store at generate-call time, which is what
 *   US-AI-051 reads server-side) → click Edit on a variation → compose fires
 *   real layerize-text → assert blocksDetected: 0.
 *
 * Cost: 2 real photo-composition generations (~$0.03-0.08 each) + 1 real
 * layerize-text extraction ($0.09) ≈ $0.15-0.25 total. retries: 0 — never
 * auto-retry a real-money test.
 *
 * Auth: self-registers a fresh throwaway account per run (rather than the
 * shared TEST_USER_EMAIL/PASSWORD convention other specs use). This test
 * needs 2 generations against a FREE-tier account (limit 3/mo); a shared
 * account accumulates usage across every prior run of every spec and can
 * exhaust quota mid-test. A fresh account also has zero conversation
 * history, which matters here — this test's whole point is the render-mode
 * toggle's first appearance in the conversation view immediately after a
 * generation completes.
 *
 * Target environment: `.env`'s PLAYWRIGHT_BASE_URL points every spec at
 * STAGING by default, not localhost — running `npx playwright test` with no
 * override tests whatever is currently deployed there, not your working
 * tree. To verify local changes:
 *   PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-ai-051-textfree-photo-background.spec.ts
 */
import { test, expect, type Page } from "@playwright/test";
import process from "node:process";

const baseURL = (process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

/** Minimal valid 1×1 PNG (68 bytes) — same fixture as us-ai-010-photo-upload.spec.ts. */
const TINY_PNG_BUFFER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

async function waitForTemplateGallery(page: Page) {
  await expect(page.getByRole("heading", { name: /template gallery/i })).toBeVisible({
    timeout: 30_000,
  });
}

/** Register a fresh throwaway account and return its session. */
async function registerFreshAccount(): Promise<{ token: string; user: unknown }> {
  const email = `e2e-051-${Date.now()}@test.local`;
  const res = await fetch(`${baseURL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "E2eProbe12345!", name: "E2E US-AI-051" }),
  });
  if (!res.ok) {
    throw new Error(`Registration failed: HTTP ${res.status} — ${await res.text()}`);
  }
  const body = await res.json();
  return { token: body.token, user: body.user };
}

async function ensureLoggedIn(page: Page) {
  const { token, user } = await registerFreshAccount();
  // AuthProvider (auth.tsx) requires BOTH keys — a token with no stored user
  // gets discarded and the app bounces to /auth on mount.
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

async function openEditorWithChat(page: Page) {
  if (!page.url().includes("/templates")) {
    await page.goto("/templates", { waitUntil: "domcontentloaded" });
  }
  await waitForTemplateGallery(page);
  const useTemplate = page.getByRole("button", { name: "Use Template" }).first();
  await expect(useTemplate).toBeVisible({ timeout: 60_000 });
  await useTemplate.scrollIntoViewIfNeeded();
  await useTemplate.click();
  await expect(page).toHaveURL(/\/editor\?.*templateId=/, { timeout: 30_000 });
  await expect(page.locator('[data-testid="design-canvas"]')).toBeVisible();
  await page.getByRole("button", { name: /open ai chat/i }).click();
  await expect(page.locator("#ai-chat-panel")).toBeVisible();
}

test.describe("US-AI-051 — TC-AI-051-05: real photo + editable → text-free background (no retries)", () => {
  test.describe.configure({ retries: 0 });
  test.use({ navigationTimeout: 90_000, actionTimeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    // Two real generations + one real extraction call, each with cold-start
    // latency margin. Generous ceiling; this test is run once, not polled.
    test.setTimeout(600_000);
    await ensureLoggedIn(page);
  });

  test("TC-AI-051-05: photo + editable generation produces a text-free background — compose finds zero blocks [LIVE ~$0.15-0.25]", async ({ page }) => {
    // Capture the compose response to assert on the server's own finding,
    // rather than inferring "no text" from pixels — this is the same
    // ground-truth signal the app itself uses (AC4's fallback trigger).
    let composeBody: any = null;
    page.on("response", async (res) => {
      if (res.url().includes("/compose") && res.request().method() === "POST") {
        try { composeBody = await res.json(); } catch { /* non-JSON, ignore */ }
      }
    });

    await openEditorWithChat(page);
    const panel = page.locator("#ai-chat-panel");

    // Step 1 — upload a real photo (real staging upload endpoint, no mocking).
    const fileInput = panel.locator("input[type='file']");
    await fileInput.setInputFiles({ name: "property.png", mimeType: "image/png", buffer: TINY_PNG_BUFFER });
    await expect(panel.locator("img[alt='Property photo reference']")).toBeVisible({ timeout: 15_000 });
    await expect(panel.getByText("Property photo attached")).toBeVisible({ timeout: 30_000 });

    // Step 2 — first generation, flat (default renderMode). This is required
    // only to reveal the "Edit as:" toggle — it is not the AC1 assertion.
    const textarea = panel.locator("textarea");
    await textarea.pressSequentially(
      "Modern home at 456 Oak Avenue, Austin TX priced at $475,000",
      { delay: 5 },
    );
    await textarea.press("Control+Enter");
    await expect(panel.getByText(/generating your infographic/i)).toBeVisible({ timeout: 15_000 });
    await expect(panel.getByText(/generated.*variation/i)).toBeVisible({ timeout: 180_000 });

    // Step 3 — switch to Editable. This sets the shared renderMode preference
    // (useGenerationPrefs) BEFORE the next generate() call fires — that is the
    // exact mechanism US-AI-051 depends on server-side.
    const editableToggle = panel.getByRole("button", { name: "Editable", exact: true });
    await expect(editableToggle).toBeVisible({ timeout: 10_000 });
    await editableToggle.click();

    // Step 4 — second, real generation with renderMode='editable' + the same
    // photo reference still attached. This is the generation whose background
    // should come back text-free. There is no "Regenerate" control reachable
    // in the conversation view (MessageBubble accepts onRegenerateAll as a
    // prop but never renders it) — a follow-up message is the real, working
    // way a user triggers a second generation from here.
    await textarea.pressSequentially(
      "Same listing, try a different layout",
      { delay: 5 },
    );
    await textarea.press("Control+Enter");
    // No intermediate "generating" text wait here — for a follow-up message in
    // an already-open conversation, the analyze→generate→complete cycle can
    // finish fast enough that the transient placeholder is easy to miss between
    // polls. The only assertion that actually matters for this AC is the final
    // result; wait directly for it with a generous ceiling.
    await expect(panel.getByText(/generated.*variation/i).last()).toBeVisible({ timeout: 180_000 });

    // Step 5 — trigger the real editable load path on the new result, which
    // fires POST /compose (real layerize-text call, $0.09). The per-card Edit
    // button is icon-only — its accessible name comes from `title="Customize
    // in editor"` (MessageBubble.tsx), not visible "Edit" text. `.last()`
    // targets the most recent message's variations, not the first generation's.
    const editButton = panel.getByRole("button", { name: "Customize in editor" }).last();
    await expect(editButton).toBeVisible({ timeout: 10_000 });
    await editButton.click();

    // Step 6 — wait for the compose round trip to land (layerize is 15-90s).
    await expect.poll(() => composeBody !== null, { timeout: 120_000, intervals: [2_000] }).toBe(true);

    // Ground truth assertion: the background this generation produced carries
    // no detectable text — the entire point of US-AI-051.
    expect(composeBody.extraction).toBeTruthy();
    expect(composeBody.extraction.blocksDetected).toBe(0);

    // AC4 (US-AI-051 depends on this already-shipped fallback): with zero
    // detected blocks, the client falls through to the layout engine, so the
    // canvas still receives editable elements — not a blank/flat result.
    await page.waitForTimeout(3_000); // allow loadComposedDesignToCanvas to settle
    const textElements = page.locator('[data-element-id], .react-draggable');
    await expect(textElements.first()).toBeVisible({ timeout: 15_000 });
    const count = await textElements.count();
    expect(count).toBeGreaterThan(1); // background + at least one layout-engine text element
  });
});
