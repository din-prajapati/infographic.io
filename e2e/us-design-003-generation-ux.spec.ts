/**
 * US-DESIGN-003 — AI Generation flow UX states (mock-backed E2E).
 *
 * Run:
 *   npx playwright test e2e/us-design-003-generation-ux.spec.ts
 * Headless CI:
 *   set CI=true && npx playwright test e2e/us-design-003-generation-ux.spec.ts
 *
 * Why mock-backed: the real generation pipeline calls the live Ideogram API,
 * which cannot run in CI. These tests intercept the REST contract
 * (POST /conversations, POST /generations, GET .../status, GET .../variations)
 * and enable E2E poll-only mode (skips socket.io, uses REST status polling), so we
 * deterministically verify the
 * FRONTEND CONTRACT for each UX state:
 *   - AC3  (TC-DS-003-03): completed generation renders result cards, images
 *           load, and the preview keeps the expected (16:9) proportions.
 *   - AC5  (TC-DS-003-05): "Use This Design" primary-styled button appears.
 *   - AC4-adjacent: invalid prompt shows a styled guidance state (not raw JSON).
 *
 * Still human-on-staging (live API only): real image fidelity/proportions of an
 * actual Ideogram render, real usage-counter increment, and FREE-tier rate limit.
 */
import { test, expect, type Page } from "@playwright/test";
import process from "node:process";

/** Must match E2E_GENERATION_POLL_ONLY_KEY in useGenerationWebSocket.ts */
const E2E_GENERATION_POLL_ONLY_KEY = "e2e-generation-poll-only";

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

const GEN_ID = "gen-e2e-design-003";

/** SVG data URI with explicit 16:9 intrinsic size so naturalWidth/Height are assertable. */
function svgVariation(label: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">` +
    `<rect width="320" height="180" fill="#4F46E5"/>` +
    `<text x="20" y="100" fill="#ffffff" font-size="28">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const VARIATIONS = [
  { id: "var-1", imageUrl: svgVariation("V1"), title: "Variation 1", description: "Modern listing layout" },
  { id: "var-2", imageUrl: svgVariation("V2"), title: "Variation 2", description: "Bold price hero" },
  { id: "var-3", imageUrl: svgVariation("V3"), title: "Variation 3", description: "Minimal agent card" },
];

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
        `Cannot load /templates (HTTP ${res?.status() ?? "no response"}). Start the app: npm run dev → ${process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000"}`,
      );
    }

    // ProtectedRoute resolves auth client-side — wait for gallery or login form.
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
  await useTemplate.scrollIntoViewIfNeeded();
  await expect(useTemplate).toBeVisible();
  await useTemplate.click();
  await expect(page).toHaveURL(/\/editor\?.*templateId=/, { timeout: 30_000 });
  await expect(page.locator('[data-testid="design-canvas"]')).toBeVisible();
  await page.getByRole("button", { name: /open ai chat/i }).click();
  await expect(page.locator("#ai-chat-panel")).toBeVisible();
}

/**
 * Enable poll-only generation progress (no socket.io) and fulfill the REST contract.
 * Playwright cannot reliably intercept cross-origin WS to :3001; localStorage flag
 * is read at runtime by useGenerationWebSocket (works with reuseExistingServer).
 */
async function mockGeneration(page: Page, opts: { status?: "completed" | "failed"; errorMessage?: string } = {}) {
  const status = opts.status ?? "completed";

  // Set in current page immediately — addInitScript only fires on full HTTP navigations,
  // not SPA history.pushState. Both are needed: evaluate() covers the SPA case,
  // addInitScript covers any subsequent full reload.
  await page.evaluate((key) => {
    localStorage.setItem(key, "1");
  }, E2E_GENERATION_POLL_ONLY_KEY);
  await page.addInitScript((key) => {
    localStorage.setItem(key, "1");
  }, E2E_GENERATION_POLL_ONLY_KEY);

  // Quota check — ensureWithinUsageLimit passes before POST /generations
  await page.route("**/api/v1/payments/subscription", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      json: {
        subscription: { planTier: "SOLO", status: "ACTIVE" },
        usage: { current: 0, limit: 50 },
      },
    });
  });
  await page.route("**/api/v1/infographics/generations/usage/quota", async (route) => {
    await route.fulfill({ json: { current: 0, limit: 50, planTier: "solo" } });
  });

  // Block socket.io only (WS targets :3001 directly; REST uses /api/v1 via Express proxy).
  await page.route((url) => url.pathname.includes("socket.io"), (route) =>
    route.abort("connectionrefused"),
  );
  await page.routeWebSocket(/socket\.io/, (ws) => ws.close());

  await page.route("**/api/v1/conversations", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const now = new Date().toISOString();
    await route.fulfill({
      json: {
        id: "conv-e2e-003",
        title: "E2E US-DESIGN-003",
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
    await route.fulfill({ json: { id: GEN_ID, status: "processing", conversationId: "conv-e2e-003" } });
  });

  await page.route("**/api/v1/infographics/generations/*/status", async (route) => {
    await route.fulfill({ json: { id: GEN_ID, status, errorMessage: opts.errorMessage } });
  });

  await page.route("**/api/v1/infographics/generations/*/variations", async (route) => {
    await route.fulfill({ json: VARIATIONS });
  });
}

async function submitPrompt(page: Page, prompt: string) {
  const panel = page.locator("#ai-chat-panel");
  const textarea = panel.locator("textarea");
  await expect(textarea).toBeVisible();
  await textarea.click();
  // Controlled textarea — type to sync React state; submit via Ctrl+Enter (AIChatInputField).
  await textarea.pressSequentially(prompt, { delay: 5 });
  await textarea.press("Control+Enter");
}

test.describe("US-DESIGN-003 — AI generation flow UX", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test("AC3 / TC-DS-003-03: completed generation renders result cards with loaded images at correct proportions", async ({ page }) => {
    await mockGeneration(page, { status: "completed" });
    await openEditorWithChat(page);

    await submitPrompt(page, "Modern home at 123 Main St, Austin TX priced at $500,000");

    const panel = page.locator("#ai-chat-panel");
    // Generation progress state is shown first (warm AI-accent bubble, not raw text).
    await expect(panel.getByText(/generating your infographic/i)).toBeVisible();

    // Polling fallback completes (first poll after ~2s) → results render.
    await expect(panel.getByText(/generated 3 variations/i)).toBeVisible({ timeout: 30_000 });
    await expect(panel.getByText("Complete")).toBeVisible();

    const previews = page.locator('#ai-chat-panel img[alt^="Variation"]');
    await expect(previews).toHaveCount(3);

    const first = previews.first();
    await expect(first).toBeVisible();

    // Image actually loaded (decoded), not a broken-image placeholder.
    const natural = await first.evaluate((img) => {
      const i = img as HTMLImageElement;
      return { w: i.naturalWidth, h: i.naturalHeight, complete: i.complete };
    });
    expect(natural.complete).toBe(true);
    expect(natural.w).toBeGreaterThan(0);
    // Intrinsic asset is 16:9 (320x180) — proportions preserved end-to-end.
    expect(natural.w / natural.h).toBeCloseTo(16 / 9, 1);
  });

  test("AC5 / TC-DS-003-05: 'Use This Design' uses primary styling after a result", async ({ page }) => {
    await mockGeneration(page, { status: "completed" });
    await openEditorWithChat(page);

    await submitPrompt(page, "Luxury condo at 500 Park Ave, Austin TX for $1,200,000");

    const panel = page.locator("#ai-chat-panel");
    await expect(panel.getByText(/generated 3 variations/i)).toBeVisible({ timeout: 30_000 });

    const useBtn = page.locator("#ai-chat-panel").getByRole("button", { name: /use this design/i }).first();
    await expect(useBtn).toBeVisible();
    await expect(useBtn).toHaveClass(/bg-primary/);
  });

  test("AC4-adjacent: invalid prompt shows styled guidance state, not a raw error", async ({ page }) => {
    // No generation should fire for an invalid prompt — assert no POST is made.
    let generationRequested = false;
    await page.route("**/api/v1/infographics/generations", (route) => {
      if (route.request().method() === "POST") generationRequested = true;
      return route.fallback();
    });

    await openEditorWithChat(page);

    // Address present (city, state), price missing — avoid "at/for 123" price-regex false positives
    await submitPrompt(page, "Create an infographic for a property in Austin, TX");

    const panel = page.locator("#ai-chat-panel");
    await expect(panel.getByText(/missing information/i)).toBeVisible();
    await expect(panel.getByText(/i need a bit more detail/i)).toBeVisible();
    await expect(panel.getByText(/please include/i)).toBeVisible();
    expect(generationRequested).toBe(false);
  });
});
