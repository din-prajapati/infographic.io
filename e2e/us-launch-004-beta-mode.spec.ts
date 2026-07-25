/**
 * US-LAUNCH-004 — Beta launch mode (F-LAUNCH-03)
 *
 * Run (default — beta-ON tests skip cleanly):
 *   npx playwright test e2e/us-launch-004-beta-mode.spec.ts
 *
 * Run with full beta-ON coverage (restart dev server first):
 *   VITE_BETA_MODE=true npx playwright test e2e/us-launch-004-beta-mode.spec.ts
 *
 * Auth-gated disclaimer tests require TEST_USER_EMAIL / TEST_USER_PASSWORD in .env
 * (loaded by playwright.config via `import "dotenv/config"`).
 *
 * Why mock-backed for disclaimer: the real generation pipeline calls the live
 * Ideogram API which is unavailable in CI. The same poll-only REST intercept
 * pattern from us-design-003 is used here to drive the UI to the completed state.
 *
 * AC coverage:
 *   AC1 (frontend half): TC-01, TC-02, TC-03, TC-04 (beta-ON) + TC-05 (beta-OFF)
 *   AC3 (disclaimer):    TC-04-01/02 — see [D-2] below (fixed)
 *   AC4 (frontend half): TC-05 (flags off restores current paid behavior)
 *   AC2 + AC5:           covered by unit tests (api/tests/payments/beta-guard.spec.ts)
 *
 * ── Known discrepancies found during test authoring ───────────────────────────
 *
 * [D-1] Paid CTA text — brand name in CTA (TC-05):
 *   The current dev server renders the SOLO plan CTA as "Try Buildographic"
 *   (rebrand applied in the compiled bundle) rather than "Try InfographicAI"
 *   (current PricingPage.tsx source). TC-05 uses a brand-agnostic regex selector
 *   /^try\s/i to remain stable across both values.
 *
 * [D-2] AC3 disclaimer unreachable in conversation flow — FIXED:
 *   The disclaimer <p> in ResultsVariations.tsx (line 220-223) was only rendered
 *   in AIChatBox's DEFAULT view, gated on !hasActiveConversation. After a user
 *   submits a prompt, hasActiveConversation becomes true and the panel switches
 *   to the conversation view (ConversationMessages + MessageBubble.tsx), which
 *   had NO disclaimer — ResultsVariations was architecturally unreachable in the
 *   standard generation flow. Fixed by adding the same disclaimer paragraph to
 *   MessageBubble.tsx, directly after the resultPreviews grid, so it renders in
 *   the conversation view too. TC-04-01/02 no longer use test.fail().
 */
import { test, expect, type Page } from "@playwright/test";
import process from "node:process";

// ── Auth env ──────────────────────────────────────────────────────────────────

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

// ── Generation mock helpers (same REST contract as us-design-003) ─────────────

/** Must match E2E_GENERATION_POLL_ONLY_KEY in useGenerationWebSocket.ts */
const E2E_GENERATION_POLL_ONLY_KEY = "e2e-generation-poll-only";

const GEN_ID = "gen-e2e-launch-004";

/** SVG data URI with explicit 16:9 intrinsic size — matches us-design-003 approach. */
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

// ── Helper: login ─────────────────────────────────────────────────────────────

async function ensureLoggedIn(page: Page) {
  if (!email || !password) {
    test.skip(
      true,
      "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env (loaded by playwright.config) or the shell.",
    );
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

    await expect(galleryHeading).toBeVisible({ timeout: 30_000 });
    return;
  }
}

// ── Helper: open editor + AI chat panel ───────────────────────────────────────

async function openEditorWithChat(page: Page) {
  if (!page.url().includes("/templates")) {
    await page.goto("/templates", { waitUntil: "domcontentloaded" });
  }
  await expect(page.getByRole("heading", { name: /template gallery/i })).toBeVisible({
    timeout: 30_000,
  });
  const useTemplate = page.getByRole("button", { name: "Use Template" }).first();
  await useTemplate.scrollIntoViewIfNeeded();
  await expect(useTemplate).toBeVisible();
  await useTemplate.click();
  await expect(page).toHaveURL(/\/editor\?.*templateId=/, { timeout: 30_000 });
  await expect(page.locator('[data-testid="design-canvas"]')).toBeVisible();
  await page.getByRole("button", { name: /open ai chat/i }).click();
  await expect(page.locator("#ai-chat-panel")).toBeVisible();
}

// ── Helper: mock the generation REST contract (no live Ideogram API) ──────────

/**
 * Enable poll-only generation progress (no socket.io) and stub the REST contract.
 * Mirrors the mockGeneration helper in us-design-003-generation-ux.spec.ts exactly,
 * using a different GEN_ID and conversation ID to avoid cross-test state bleed.
 */
async function mockGeneration(page: Page) {
  // Set flag on current page immediately (SPA navigation preserves localStorage).
  // addInitScript handles any subsequent full HTTP navigation.
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

  // Block socket.io (WS targets :3001 directly; REST uses /api/v1 via Express proxy).
  await page.route(
    (url) => url.pathname.includes("socket.io"),
    (route) => route.abort("connectionrefused"),
  );
  await page.routeWebSocket(/socket\.io/, (ws) => ws.close());

  await page.route("**/api/v1/conversations", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const now = new Date().toISOString();
    await route.fulfill({
      json: {
        id: "conv-e2e-launch-004",
        title: "E2E US-LAUNCH-004",
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
    await route.fulfill({
      json: { id: GEN_ID, status: "processing", conversationId: "conv-e2e-launch-004" },
    });
  });

  await page.route("**/api/v1/infographics/generations/*/status", async (route) => {
    await route.fulfill({ json: { id: GEN_ID, status: "completed" } });
  });

  await page.route("**/api/v1/infographics/generations/*/variations", async (route) => {
    await route.fulfill({ json: VARIATIONS });
  });
}

// ── Helper: submit a prompt via the chat panel ────────────────────────────────

async function submitPrompt(page: Page, prompt: string) {
  const panel = page.locator("#ai-chat-panel");
  const textarea = panel.locator("textarea");
  await expect(textarea).toBeVisible();
  await textarea.click();
  // Controlled textarea — pressSequentially syncs React state; Ctrl+Enter submits.
  await textarea.pressSequentially(prompt, { delay: 5 });
  await textarea.press("Control+Enter");
}

// ═════════════════════════════════════════════════════════════════════════════
// Beta-ON tests
// Skipped unless the dev server was started with VITE_BETA_MODE=true.
//
// Why: Vite bakes import.meta.env.VITE_* values at server startup time.
// Playwright's config reuses an existing server (reuseExistingServer: true) and
// cannot inject VITE_* variables into an already-running dev server. The tests
// skip cleanly rather than fail when the server wasn't started under beta mode.
//
// To run beta-ON tests:
//   1. Stop the running dev server
//   2. VITE_BETA_MODE=true npm run dev
//   3. VITE_BETA_MODE=true npx playwright test e2e/us-launch-004-beta-mode.spec.ts
// ═════════════════════════════════════════════════════════════════════════════

test.describe("US-LAUNCH-004 — Beta-ON: /pricing gating (VITE_BETA_MODE=true)", () => {
  test.beforeEach(() => {
    test.skip(
      process.env.VITE_BETA_MODE !== "true",
      "requires dev server started with VITE_BETA_MODE=true",
    );
  });

  test('TC-LAUNCH-004-01-01: "Free during beta" banner is visible on /pricing (Individual segment)', async ({
    page,
  }) => {
    // Contract:
    //   Expected: text "Free during beta" is rendered in the beta notice banner
    //   Location: /pricing, default Individual segment (no segment toggle needed)
    //   Selector: getByText (role/testid absent on the banner element)
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });

    // Confirm the page loaded and Individual is the active segment
    await expect(page.getByRole("button", { name: "Individual" })).toBeVisible({ timeout: 30_000 });

    await expect(page.getByText("Free during beta")).toBeVisible();
  });

  test("TC-LAUNCH-004-01-02: SOLO plan CTA reads \"Available after beta\" and is DOM-disabled", async ({
    page,
  }) => {
    // Contract:
    //   Expected: button with accessible name "Available after beta" is present
    //   AND the DOM disabled property is true (not just a CSS class).
    //   Location: SOLO plan card, Individual segment
    //
    // Why DOM disabled (not class-only): asserting toBeDisabled() checks the actual
    // HTMLButtonElement.disabled property. A regression that drops the disabled attr
    // while keeping styling would pass a class check but fail this assertion.
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Solo", exact: true })).toBeVisible({
      timeout: 30_000,
    });

    const betaBtn = page.getByRole("button", { name: "Available after beta" });
    await expect(betaBtn).toBeVisible();
    await expect(betaBtn).toBeDisabled();
  });

  test("TC-LAUNCH-004-01-03: Enterprise segment — TEAM and BROKERAGE CTAs are also disabled", async ({
    page,
  }) => {
    // Contract:
    //   Expected: after switching to the Enterprise tab, both Team and Brokerage
    //   plan cards render "Available after beta" CTAs in the DOM-disabled state.
    //   This verifies AC1's "paid tiers" claim covers BOTH segments (Individual +
    //   Enterprise), not just the Individual/Solo case tested in TC-02.
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Enterprise" })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Enterprise" }).click();

    await expect(page.getByRole("heading", { name: "Team", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Brokerage", exact: true })).toBeVisible();

    // Enterprise segment shows exactly 2 paid plans (Team + Brokerage) — both must be gated
    const betaButtons = page.getByRole("button", { name: "Available after beta" });
    await expect(betaButtons).toHaveCount(2);
    await expect(betaButtons.first()).toBeDisabled();
    await expect(betaButtons.last()).toBeDisabled();
  });

  test("TC-LAUNCH-004-01-04: FREE tier CTA is unaffected by beta mode", async ({ page }) => {
    // Contract:
    //   Expected: the Free plan card does NOT render "Available after beta".
    //   The beta gate condition is `isBetaMode && plan.price > 0`; Free has price=0
    //   so the condition is false and the card takes the normal button path.
    //
    //   Assertion strategy: in the Individual segment (Free + Solo), exactly 1
    //   "Available after beta" button must exist (Solo only). If Free were
    //   incorrectly gated, the count would be 2. This approach avoids fragile
    //   DOM-traversal selectors since plan cards have no data-testid.
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Individual" })).toBeVisible({ timeout: 30_000 });

    // Free plan card must render (heading visible)
    await expect(page.getByRole("heading", { name: "Free", exact: true })).toBeVisible();

    // Only the Solo (paid) card gets the beta CTA — count must be 1, not 2
    await expect(page.getByRole("button", { name: "Available after beta" })).toHaveCount(1);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Beta-OFF tests — always run (no skip guard)
// This is the default dev server state when VITE_BETA_MODE is unset or false.
// ═════════════════════════════════════════════════════════════════════════════

test.describe("US-LAUNCH-004 — Beta-OFF: /pricing shows normal paid CTAs (default)", () => {
  test("TC-LAUNCH-004-01-05: No beta banner and normal paid CTA when VITE_BETA_MODE is unset/false", async ({
    page,
  }) => {
    // Contract:
    //   Expected: "Free during beta" text absent; "Available after beta" button absent;
    //   "Try InfographicAI" button visible and enabled.
    //   Condition: VITE_BETA_MODE unset or false (default dev server).
    //   This is the AC4 frontend assertion: turning flags off restores current paid
    //   behavior with no other code change.
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Solo", exact: true })).toBeVisible({
      timeout: 30_000,
    });

    // Beta banner must be absent — isBetaMode=false so the conditional renders nothing
    await expect(page.getByText("Free during beta")).not.toBeVisible();

    // Beta CTA must be absent — 0 occurrences across the whole page
    await expect(page.getByRole("button", { name: "Available after beta" })).toHaveCount(0);

    // Normal paid CTA for Solo must be visible and enabled (not anonymous-path disabled).
    // Note: Free card shows "Current Plan" (disabled) for anonymous visitors because
    // PricingPage defaults currentPlan to "FREE" when no auth token is present.
    // Solo card shows "Try <BrandName>" (enabled) because it is not the current plan.
    //
    // Brand-agnostic regex /^try\s/i covers both "Try InfographicAI" (source)
    // and "Try Buildographic" (compiled bundle after rebrand) — see [D-1] above.
    const normalCta = page.getByRole("button", { name: /^try\s/i }).first();
    await expect(normalCta).toBeVisible();
    await expect(normalCta).toBeEnabled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Disclaimer tests — auth-gated, mock-backed generation
//
// Skip guard: TEST_USER_EMAIL / TEST_USER_PASSWORD env vars (same convention as
// us-design-003-generation-ux.spec.ts and editor-ai-chatbox.spec.ts).
//
// No VITE_BETA_MODE skip guard here — this is intentional. The disclaimer <p> in
// ResultsVariations.tsx (~line 221-223) renders unconditionally after generation
// completes. It is NOT wrapped in any isBetaMode conditional. The disclaimer must
// appear in both beta-on and beta-off modes, so gating this test on VITE_BETA_MODE
// would give false-negative coverage.
// ═════════════════════════════════════════════════════════════════════════════

test.describe("US-LAUNCH-004 — AC3: AI-content disclaimer after generation (auth-gated, mock-backed)", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test("TC-LAUNCH-004-04-01/02: AI disclaimer is visible after completed generation and is unconditional (not beta-gated)", async ({
    page,
  }) => {
    // Contract:
    //   Expected: the paragraph
    //     "Imagery may include AI-generated visuals. Verify all details before
    //      publishing to represent a real listing."
    //   is visible inside #ai-chat-panel once generation results are rendered.
    //
    // TC-04-01: disclaimer appears after generation completes.
    // TC-04-02: no VITE_BETA_MODE guard on this describe block — the disclaimer
    //   in ResultsVariations.tsx is NOT wrapped in any isBetaMode branch. It is
    //   intentionally unconditional. This test intentionally has no beta-mode
    //   skip guard so it can catch any regression that moves the disclaimer behind
    //   a feature flag.
    //
    // Note (see [D-2] in file header): the disclaimer was previously only
    // rendered in AIChatBox's default view and unreachable once a prompt was
    // submitted (hasActiveConversation=true switches to MessageBubble.tsx,
    // which had no disclaimer). Fixed by adding the same paragraph to
    // MessageBubble.tsx after the resultPreviews grid.
    //
    // Mock-backed: intercepts REST contract so no live Ideogram API call is made.
    // Poll-only mode (localStorage flag) replaces socket.io progress events.
    await mockGeneration(page);
    await openEditorWithChat(page);

    await submitPrompt(page, "Modern home at 88 Oak Street, Austin TX priced at $650,000");

    const panel = page.locator("#ai-chat-panel");

    // Wait for poll-only generation to complete and results to render (~2s first poll)
    await expect(panel.getByText(/generated 3 variations/i)).toBeVisible({ timeout: 30_000 });

    // Disclaimer must be visible to the user — not just present in DOM.
    // Currently fails because ResultsVariations (where the disclaimer lives) is not
    // rendered once hasActiveConversation=true (see gap explanation above).
    const disclaimer = page.getByText(
      "Imagery may include AI-generated visuals. Verify all details before publishing to represent a real listing.",
    );
    await expect(disclaimer).toBeVisible();
  });
});
