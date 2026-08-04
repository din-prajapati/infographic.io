/**
 * US-AI-010 — Property photo upload + reference in generation.
 *
 * Run:
 *   npx playwright test e2e/us-ai-010-photo-upload.spec.ts
 * Headless CI:
 *   set CI=true && npx playwright test e2e/us-ai-010-photo-upload.spec.ts
 *
 * TC-AI-010-01: Upload photo → thumbnail appears in chat input  (upload mocked)
 * TC-AI-010-03: Upload second photo → replaces first            (upload mocked)
 * TC-AI-010-04: Oversized / wrong MIME → client-side rejection  (no upload mock needed)
 * TC-AI-010-02: Real photo + real generation → result renders   (LIVE API ~$0.03-0.08)
 *
 * Mocking rationale:
 *   TC-01/03 mock POST /infographics/upload-photo to avoid unnecessary server I/O and
 *   to test the thumbnail + status label independently of network latency.
 *   TC-04 confirms the upload endpoint is never reached when validation fails.
 *   TC-02 (tagged [LIVE spend]) makes real calls to all staging endpoints including
 *   Ideogram — run exactly once per verification cycle, never in a retry loop.
 */
import { test, expect, type Page } from "@playwright/test";
import process from "node:process";

/** Must match E2E_GENERATION_POLL_ONLY_KEY in useGenerationWebSocket.ts */
const E2E_GENERATION_POLL_ONLY_KEY = "e2e-generation-poll-only";

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

/**
 * Minimal valid 1×1 PNG (68 bytes).
 * Small enough to upload instantly; valid enough for the browser to accept as an
 * image/png file whose MIME type passes the client-side check in AIChatBox.tsx.
 */
const TINY_PNG_BUFFER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

/** Generation ID used in mocked REST responses for TC-01/03. */
const GEN_ID_010 = "gen-e2e-ai-010";

/** Mocked variation images mirroring the real backend's `title: "Variation N"` pattern. */
function svgVariation010(label: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">` +
    `<rect width="320" height="180" fill="#4F46E5"/>` +
    `<text x="20" y="100" fill="#ffffff" font-size="28">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const VARIATIONS_010 = [
  { id: "var-1", imageUrl: svgVariation010("V1"), title: "Variation 1", description: "Classic layout" },
  { id: "var-2", imageUrl: svgVariation010("V2"), title: "Variation 2", description: "Modern design" },
  { id: "var-3", imageUrl: svgVariation010("V3"), title: "Variation 3", description: "Minimal card" },
];

// ── Shared helpers (mirrors us-design-003-generation-ux.spec.ts exactly) ─────

async function waitForTemplateGallery(page: Page) {
  await expect(page.getByRole("heading", { name: /template gallery/i })).toBeVisible({
    timeout: 30_000,
  });
}

async function ensureLoggedIn(page: Page) {
  if (!email || !password) {
    test.skip(true, "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env (loaded by playwright.config) or the shell.");
  }

  const authHeading = page.getByRole("heading", { name: /welcome back/i });
  const galleryHeading = page.getByRole("heading", { name: /template gallery/i });

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await page.goto("/templates", { waitUntil: "domcontentloaded" });
    if (!res || !res.ok()) {
      throw new Error(
        `Cannot load /templates (HTTP ${res?.status() ?? "no response"}). Check PLAYWRIGHT_BASE_URL: ${process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000"}`,
      );
    }

    await expect(authHeading.or(galleryHeading)).toBeVisible({ timeout: 30_000 });

    if (await authHeading.isVisible()) {
      await page.getByTestId("input-email").fill(email!);
      await page.getByTestId("input-password").fill(password!);
      await page.getByRole("button", { name: /^login$/i }).click();
      try {
        await expect(page).not.toHaveURL(/\/auth/, { timeout: 30_000 });
      } catch {
        if (attempt === 1) test.skip(true, "Login failed — check TEST_USER_EMAIL / TEST_USER_PASSWORD");
        continue;
      }
      if (!page.url().includes("/templates")) {
        await page.goto("/templates", { waitUntil: "domcontentloaded" });
      }
    }

    if (page.url().includes("/auth") || (await authHeading.isVisible())) {
      if (attempt === 1) test.skip(true, "Still on auth after login");
      continue;
    }

    await waitForTemplateGallery(page);
    return;
  }
}

async function openEditorWithChat(page: Page) {
  if (!page.url().includes("/templates")) {
    await page.goto("/templates", { waitUntil: "domcontentloaded" });
  }
  await waitForTemplateGallery(page);
  const useTemplate = page.getByRole("button", { name: "Use Template" }).first();
  // Wait for the first template card to be present before scrolling; staging can
  // be slow to render the gallery on cold start (Railway auto-sleep).
  await expect(useTemplate).toBeVisible({ timeout: 60_000 });
  await useTemplate.scrollIntoViewIfNeeded();
  await useTemplate.click();
  await expect(page).toHaveURL(/\/editor\?.*templateId=/, { timeout: 30_000 });
  await expect(page.locator('[data-testid="design-canvas"]')).toBeVisible();
  await page.getByRole("button", { name: /open ai chat/i }).click();
  await expect(page.locator("#ai-chat-panel")).toBeVisible();
}

/**
 * Intercept the generation REST contract with deterministic mock responses.
 * Mirrors the pattern in us-design-003-generation-ux.spec.ts so the UI's
 * poll-only path completes immediately without a real Ideogram call.
 */
async function mockGenerationEndpoints(page: Page) {
  await page.evaluate((key) => localStorage.setItem(key, "1"), E2E_GENERATION_POLL_ONLY_KEY);
  await page.addInitScript((key) => localStorage.setItem(key, "1"), E2E_GENERATION_POLL_ONLY_KEY);

  await page.route("**/api/v1/payments/subscription", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      json: { subscription: { planTier: "SOLO", status: "ACTIVE" }, usage: { current: 0, limit: 50 } },
    });
  });
  await page.route("**/api/v1/infographics/generations/usage/quota", async (route) => {
    await route.fulfill({ json: { current: 0, limit: 50, planTier: "solo" } });
  });

  await page.route((url) => url.pathname.includes("socket.io"), (route) =>
    route.abort("connectionrefused"),
  );
  await page.routeWebSocket(/socket\.io/, (ws) => ws.close());

  await page.route("**/api/v1/conversations", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const now = new Date().toISOString();
    await route.fulfill({
      json: {
        id: "conv-e2e-010",
        title: "E2E US-AI-010",
        propertyType: null,
        priceRange: null,
        messages: [],
        createdAt: now,
        updatedAt: now,
        isFavorite: false,
      },
    });
  });
  await page.route("**/api/v1/infographics/generations", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    await route.fulfill({ json: { id: GEN_ID_010, status: "processing", conversationId: "conv-e2e-010" } });
  });
  await page.route("**/api/v1/infographics/generations/*/status", async (route) => {
    await route.fulfill({ json: { id: GEN_ID_010, status: "completed" } });
  });
  await page.route("**/api/v1/infographics/generations/*/variations", async (route) => {
    await route.fulfill({ json: VARIATIONS_010 });
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe("US-AI-010 — Property photo upload + reference in generation", () => {
  // Railway staging can be slow on cold start — bump navigation + action timeouts
  // so intermittent cold-start latency doesn't produce false failures.
  test.use({ navigationTimeout: 90_000, actionTimeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    // Give the entire test (beforeEach included) 180 s so Railway cold-start
    // latency (up to ~60 s on first hit) doesn't produce false failures.
    test.setTimeout(180_000);
    await ensureLoggedIn(page);
  });

  // ── TC-AI-010-01 ────────────────────────────────────────────────────────────
  test("TC-AI-010-01: upload photo → thumbnail appears in chat input area", async ({ page }) => {
    // Contract:
    //   Given: user is in the AI chat panel
    //   When:  a valid PNG file (≤10 MB) is provided to the hidden file input
    //   Then:  thumbnail <img alt="Property photo reference"> appears
    //          status label reads "Property photo attached" once the (mocked) upload resolves
    //   Upload endpoint mocked → photoId returned immediately, no real server I/O.

    // Mock the upload endpoint — returns a synthetic photoId straight away
    await page.route("**/api/v1/infographics/upload-photo", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      await route.fulfill({
        json: { photoId: "e2e-photo-01.jpg", photoUrl: "/api/v1/infographics/photos/e2e-photo-01.jpg" },
      });
    });

    await openEditorWithChat(page);

    const panel = page.locator("#ai-chat-panel");

    // The hidden <input type="file"> lives inside #ai-chat-panel.
    // Playwright's setInputFiles() dispatches the change event programmatically,
    // bypassing the OS file-picker dialog, even on hidden inputs.
    const fileInput = panel.locator("input[type='file']");
    await fileInput.setInputFiles({
      name: "property.png",
      mimeType: "image/png",
      buffer: TINY_PNG_BUFFER,
    });

    // Thumbnail appears immediately from the local blob URL (no network wait)
    const thumbnail = panel.locator("img[alt='Property photo reference']");
    await expect(thumbnail).toBeVisible();

    // Status label transitions from "Uploading photo…" → "Property photo attached"
    // once the mocked upload resolves and photoId is stored in state.
    await expect(panel.getByText("Property photo attached")).toBeVisible();
  });

  // ── TC-AI-010-03 ────────────────────────────────────────────────────────────
  test("TC-AI-010-03: upload second photo → replaces first, only one thumbnail visible", async ({ page }) => {
    // Contract:
    //   Given: one photo is already attached
    //   When:  user selects a second photo
    //   Then:  exactly one thumbnail is visible — the second; first is cleared (AC4)

    await page.route("**/api/v1/infographics/upload-photo", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      await route.fulfill({
        json: { photoId: "e2e-photo-03.jpg", photoUrl: "/api/v1/infographics/photos/e2e-photo-03.jpg" },
      });
    });

    await openEditorWithChat(page);

    const panel = page.locator("#ai-chat-panel");
    const fileInput = panel.locator("input[type='file']");

    // Upload first photo and confirm it's attached
    await fileInput.setInputFiles({ name: "photo1.png", mimeType: "image/png", buffer: TINY_PNG_BUFFER });
    await expect(panel.locator("img[alt='Property photo reference']")).toBeVisible();
    await expect(panel.getByText("Property photo attached")).toBeVisible();

    // Upload second photo — replaces the first
    await fileInput.setInputFiles({ name: "photo2.png", mimeType: "image/png", buffer: TINY_PNG_BUFFER });

    // Still exactly one thumbnail: no accumulation, no duplicate (AC4)
    const thumbnails = panel.locator("img[alt='Property photo reference']");
    await expect(thumbnails).toHaveCount(1);
    await expect(thumbnails.first()).toBeVisible();
    // Second upload also completes (same mock returns the photoId)
    await expect(panel.getByText("Property photo attached")).toBeVisible();
  });

  // ── TC-AI-010-04 ────────────────────────────────────────────────────────────
  test("TC-AI-010-04: invalid file (wrong MIME or oversized) → client-side error, no upload request", async ({ page }) => {
    // Contract:
    //   Given: user has the AI chat panel open
    //   When:  they select (a) a PDF or (b) a JPEG > 10 MB
    //   Then:  a visible error message is shown for each case
    //          and no POST fires to the upload endpoint (AC5 client-side guard)

    // Monitor the upload route — any POST here is a bug
    let uploadRequestFired = false;
    await page.route("**/api/v1/infographics/upload-photo", async (route) => {
      if (route.request().method() === "POST") {
        uploadRequestFired = true;
      }
      // Let it fall through (it should never fire, but don't hang the test)
      await route.fallback();
    });

    await openEditorWithChat(page);

    const panel = page.locator("#ai-chat-panel");
    const fileInput = panel.locator("input[type='file']");

    // ── Sub-case A: wrong MIME type ───────────────────────────────────────────
    await fileInput.setInputFiles({
      name: "contract.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(1024), // 1 KB — size is not the issue here
    });

    // Visible client-side error; no network request (AC5 — MIME guard fires first)
    await expect(panel.getByText("Only JPG and PNG photos are supported.")).toBeVisible();
    expect(uploadRequestFired).toBe(false);

    // ── Sub-case B: oversized image ───────────────────────────────────────────
    uploadRequestFired = false; // reset before second attempt

    await fileInput.setInputFiles({
      name: "huge-photo.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.alloc(11 * 1024 * 1024), // 11 MB — over the 10 MB limit
    });

    // Visible client-side error; no network request (AC5 — size guard fires)
    await expect(panel.getByText("Photo must be 10 MB or smaller.")).toBeVisible();
    expect(uploadRequestFired).toBe(false);
  });

});

// ── TC-AI-010-02 (LIVE API) — separate describe to apply retries: 0 ──────────
// test.use({ retries: 0 }) is the correct Playwright API for per-group retry
// control; test.retries() inside a test body is not a valid API.
test.describe("US-AI-010 — TC-AI-010-02: live Ideogram pipeline (no retries)", () => {
  // retries: 0 — every attempt on Ideogram costs real money; never auto-retry.
  // test.describe.configure is the correct Playwright API for per-describe retries.
  test.describe.configure({ retries: 0 });
  test.use({ navigationTimeout: 90_000, actionTimeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    // Total budget: cold-start (~90 s) + real Ideogram generation (~120 s) + margin.
    test.setTimeout(420_000);
    await ensureLoggedIn(page);
  });

  test("TC-AI-010-02: upload real photo + real generation → variation images render [LIVE ~$0.03-0.08]", async ({ page }) => {
    // Contract:
    //   Given: a real photo is uploaded to the staging backend (no mocking)
    //   When:  the user submits a valid generation prompt (no mocking of generation endpoints)
    //   Then:  the real Ideogram pipeline completes and variation images render in the chat
    //
    // IMPORTANT — read before running:
    //   • This test calls the live Ideogram API. Each run costs ~$0.03-$0.08.
    //   • retries: 0 enforced above — if it fails, report clearly, do NOT rerun in a loop.
    //   • The E2E_GENERATION_POLL_ONLY_KEY is set so REST polling delivers the result
    //     instead of WebSocket (more reliable on staging; both paths hit the real API).

    // Enable REST poll-only mode — avoids cross-origin WS uncertainty on staging
    await page.evaluate((key) => localStorage.setItem(key, "1"), E2E_GENERATION_POLL_ONLY_KEY);
    await page.addInitScript((key) => localStorage.setItem(key, "1"), E2E_GENERATION_POLL_ONLY_KEY);

    // No page.route() calls here — every request goes to the real staging backend.

    await openEditorWithChat(page);

    const panel = page.locator("#ai-chat-panel");

    // Step 1: Upload the minimal PNG to the real staging upload endpoint.
    // Confirms POST /api/v1/infographics/upload-photo is live and returns a photoId.
    const fileInput = panel.locator("input[type='file']");
    await fileInput.setInputFiles({
      name: "property.png",
      mimeType: "image/png",
      buffer: TINY_PNG_BUFFER,
    });

    // Thumbnail appears (local blob URL) then status confirms real upload succeeded
    await expect(panel.locator("img[alt='Property photo reference']")).toBeVisible({ timeout: 15_000 });
    await expect(panel.getByText("Property photo attached")).toBeVisible({ timeout: 30_000 });

    // Step 2: Submit a real generation prompt.
    // The photoId is passed as photoReference in the generation request body (AC3).
    const textarea = panel.locator("textarea");
    await expect(textarea).toBeVisible();
    await textarea.pressSequentially(
      "Modern home at 456 Oak Avenue, Austin TX priced at $475,000",
      { delay: 5 },
    );
    await textarea.press("Control+Enter");

    // Step 3: Generation in progress — the UI shows the progress bubble immediately
    await expect(panel.getByText(/generating your infographic/i)).toBeVisible({ timeout: 15_000 });

    // Step 4: Wait for real Ideogram pipeline to complete (ceiling: 180 s from here)
    // Backend returns title: "Variation N" — see ai-orchestrator.service.ts.
    // The MessageBubble renders "Generated N variations" text when resultPreviews arrives.
    await expect(panel.getByText(/generated.*variation/i)).toBeVisible({ timeout: 180_000 });
    await expect(panel.getByText("Complete")).toBeVisible();

    // Step 5: At least one variation image renders and actually loaded (not broken)
    // alt starts with "Variation" — matches backend's real title format.
    const variationImages = panel.locator("img[alt^='Variation']");
    const firstVariation = variationImages.first();
    await expect(firstVariation).toBeVisible({ timeout: 10_000 });

    const loadState = await firstVariation.evaluate((img) => {
      const i = img as HTMLImageElement;
      return { naturalWidth: i.naturalWidth, naturalHeight: i.naturalHeight, complete: i.complete };
    });
    expect(loadState.complete).toBe(true);
    expect(loadState.naturalWidth).toBeGreaterThan(0);
  });
});
