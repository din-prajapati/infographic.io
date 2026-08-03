/**
 * US-AI-037 — Save as Template + Premium Gallery DB source
 *
 * E2E coverage (all black-box, no source imports, no AI generation calls):
 *   TC-037-02 (P0) / AC2 / AC3  — Save as Template → named card appears in My Templates
 *   TC-037-03 (P0) / AC4        — Save as Template is a copy; editor URL + canvas unchanged
 *   TC-037-05 (P1) / AC5        — Simulated POST 500 → error toast; editor state intact
 *   TC-037-07 (P0)              — GET admin_curated → 5 real rows, real names, not legacy IDs
 *   TC-037-08 (P0) / AC9        — Premium gallery renders real cards from the API (no error state)
 *   TC-037-09 (P1) / AC10       — Simulated admin_curated fetch failure → clear error state, no crash
 *
 * AC4 is verified in TC-037-03 (URL + canvas unchanged after save).
 * AC5 is verified in TC-037-05 (error toast + editor intact on POST 500).
 * AC8 is verified by TC-037-07 (live DB state — 5 admin_curated rows exist after migration).
 * AC10 is verified by TC-037-09 (error state rendered, not blank section or crash).
 *
 * Not covered here (non-UI / unit level):
 *   TC-037-01 — DTO default-visibility persistence (unit test)
 *   TC-037-04 — cross-user isolation (requires two browser sessions)
 *   TC-037-06 — DTO enum rejection (unit test)
 *   TC-037-10 — premiumTemplates.ts deletion (build-time, checked via npm run check)
 *
 * Run:
 *   npx playwright test e2e/us-ai-037-save-as-template.spec.ts
 * Headless CI:
 *   set CI=true && npx playwright test e2e/us-ai-037-save-as-template.spec.ts
 */

import { test, expect, type Page } from "@playwright/test";
import process from "node:process";

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

// Derive the base URL the same way playwright.config.ts does
const baseURL = (
  process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000"
).replace(/\/$/, "");

// Unique name per run — prevents stale My-Template cards from a prior run from
// colliding in assertions and avoids orphaned rows between runs.
const TEMPLATE_NAME = `E2E-037-${Date.now()}`;

// ID of the template persisted during a test; cleaned up in afterEach.
// Module-level is safe because workers: 1 (sequential) in playwright.config.ts.
let cleanupTemplateId: string | null = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to /templates and log in if the auth screen appears. */
async function ensureLoggedIn(page: Page): Promise<void> {
  if (!email || !password) {
    test.skip(
      true,
      "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env (loaded by playwright.config) or the shell.",
    );
    return;
  }

  const authHeading = page.getByRole("heading", { name: /welcome back/i });
  const galleryHeading = page.getByRole("heading", {
    name: /template gallery/i,
  });

  for (let attempt = 0; attempt < 2; attempt++) {
    // Staging can be slow — override the global navigationTimeout (45s) for this call.
    const res = await page.goto("/templates", { waitUntil: "domcontentloaded", timeout: 90_000 });
    if (!res || !res.ok()) {
      throw new Error(
        `Cannot load /templates (HTTP ${res?.status() ?? "no response"}). ` +
          `Is the app running at ${baseURL}?`,
      );
    }

    // ProtectedRoute resolves auth client-side — wait for gallery or login form.
    await expect(authHeading.or(galleryHeading)).toBeVisible({
      timeout: 30_000,
    });

    if (await authHeading.isVisible()) {
      await page.getByTestId("input-email").fill(email!);
      await page.getByTestId("input-password").fill(password!);
      await page.getByRole("button", { name: /^login$/i }).click();
      try {
        await expect(page).not.toHaveURL(/\/auth/, { timeout: 30_000 });
      } catch {
        if (attempt === 1) {
          test.skip(
            true,
            "Login failed — check TEST_USER_EMAIL / TEST_USER_PASSWORD.",
          );
        }
        continue;
      }
      if (!page.url().includes("/templates")) {
        await page.goto("/templates", { waitUntil: "domcontentloaded", timeout: 90_000 });
      }
    }

    if (page.url().includes("/auth") || (await authHeading.isVisible())) {
      if (attempt === 1) test.skip(true, "Still on /auth after login.");
      continue;
    }

    await expect(galleryHeading).toBeVisible({ timeout: 30_000 });
    return;
  }
}

/** Navigate to /editor and wait for the canvas to be ready. */
async function openFreshEditor(page: Page): Promise<void> {
  // Override the global navigationTimeout (45s) — staging can be slow.
  await page.goto("/editor", { waitUntil: "domcontentloaded", timeout: 90_000 });
  await expect(page.locator('[data-testid="design-canvas"]')).toBeVisible({
    timeout: 30_000,
  });
}

/**
 * Delete a canvas template by ID via the real API, using the JWT already in
 * the page's localStorage. Best-effort — never throws (cleanup must not fail tests).
 */
async function deleteTemplate(page: Page, id: string): Promise<void> {
  try {
    const token = await page.evaluate(() =>
      localStorage.getItem("auth_token"),
    );
    if (!token) return;

    await page.evaluate(
      async ({
        apiBase,
        templateId,
        authToken,
      }: {
        apiBase: string;
        templateId: string;
        authToken: string;
      }) => {
        await fetch(`${apiBase}/api/v1/canvas-templates/${templateId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` },
        });
      },
      { apiBase: baseURL, templateId: id, authToken: token },
    );
  } catch {
    // Intentionally swallowed — afterEach cleanup must not fail the test run.
  }
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe("US-AI-037 — Save as Template", () => {
  // Staging round-trips are slow (60-90s per navigation in peak load).
  // The global timeout (90s) is far too tight for tests with multiple navigations.
  // Budget per test: 3 navigations × 90s max + 60s for actions = 330s.
  // 5 minutes is the safe ceiling for this suite against a slow staging server.
  test.setTimeout(300_000);

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test.afterEach(async ({ page }) => {
    if (cleanupTemplateId) {
      await deleteTemplate(page, cleanupTemplateId);
      cleanupTemplateId = null;
    }
  });

  // -------------------------------------------------------------------------
  // TC-037-02 / AC2 / AC3
  // -------------------------------------------------------------------------
  test(
    "TC-037-02 / AC2 / AC3: Save as Template → named template appears in My Templates",
    async ({ page }) => {
      /**
       * Contract:
       *   Expected: new template card with the entered name appears in the
       *             "My Templates" section on /templates.
       *   Location: /editor → "Save as Template" → SaveDialog → /templates
       *   Condition: user is logged in, enters a unique name, confirms the dialog
       */

      await openFreshEditor(page);

      // Register the POST listener before any user action so we catch the
      // network response for cleanup (the actual POST fires after dialog confirm).
      const saveResponsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes("/canvas-templates") &&
          resp.request().method() === "POST",
        { timeout: 25_000 },
      );

      // Open Save as Template dialog
      await page.getByRole("button", { name: /save as template/i }).click();
      await expect(
        page.getByRole("heading", { name: /save your work/i }),
      ).toBeVisible({ timeout: 8_000 });

      // Name the template with a run-unique string
      const nameInput = page.locator("#design-name");
      await nameInput.clear();
      await nameInput.fill(TEMPLATE_NAME);

      // Confirm — button reads "Save Template" when initialType="template"
      await page.getByRole("button", { name: /save template/i }).click();

      // Success toast — 30s allows for a slow staging API round-trip
      await expect(page.getByText(/template saved/i)).toBeVisible({
        timeout: 30_000,
      });

      // Capture the template ID for afterEach cleanup (best-effort)
      try {
        const saveResponse = await saveResponsePromise;
        const body = await saveResponse.json();
        if (body?.id) cleanupTemplateId = body.id;
      } catch {
        // Non-fatal — cleanup falls back to leaving the row; not a test failure
      }

      // Navigate to Templates page
      await page.goto("/templates", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(
        page.getByRole("heading", { name: /template gallery/i }),
      ).toBeVisible({ timeout: 20_000 });

      // AC3 — "My Templates" section must appear
      // Note: the heading appears as soon as the query fires (isLoading=true);
      // the card itself waits for the fetch to resolve (may take 15-20s on staging).
      await expect(
        page.getByRole("heading", { name: /my templates/i }),
      ).toBeVisible({ timeout: 20_000 });

      // AC2 — The saved template card must be visible by name.
      // 30s allows for a slow staging API response.
      await expect(page.getByText(TEMPLATE_NAME).first()).toBeVisible({
        timeout: 30_000,
      });
    },
  );

  // -------------------------------------------------------------------------
  // TC-037-03 / AC4
  // -------------------------------------------------------------------------
  test(
    "TC-037-03 / AC4: Save as Template is a copy — editor URL and canvas are unchanged afterward",
    async ({ page }) => {
      /**
       * Contract:
       *   Expected: URL before == URL after; canvas and Save-as-Template button
       *             are still visible; no navigation has occurred.
       *   Location: /editor (no templateId or designId param)
       *   Condition: user saves a template via the dialog, then inspects the editor
       */

      await openFreshEditor(page);
      // Snapshot the URL before we interact with anything
      const urlBefore = page.url();

      const saveResponsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes("/canvas-templates") &&
          resp.request().method() === "POST",
        { timeout: 25_000 },
      );

      await page.getByRole("button", { name: /save as template/i }).click();
      await expect(
        page.getByRole("heading", { name: /save your work/i }),
      ).toBeVisible({ timeout: 8_000 });

      const nameInput = page.locator("#design-name");
      await nameInput.clear();
      await nameInput.fill(`${TEMPLATE_NAME}-AC4`);
      await page.getByRole("button", { name: /save template/i }).click();

      // Wait for save to complete (toast signals the round-trip is done)
      await expect(page.getByText(/template saved/i)).toBeVisible({
        timeout: 15_000,
      });

      // AC4 — URL must not have changed (no navigation away, no designId injected)
      expect(page.url()).toBe(urlBefore);

      // AC4 — Canvas is still present (editor not replaced by another route)
      await expect(
        page.locator('[data-testid="design-canvas"]'),
      ).toBeVisible();

      // AC4 — "Save as Template" button is still reachable (editor not broken)
      await expect(
        page.getByRole("button", { name: /save as template/i }),
      ).toBeVisible();

      // Capture ID for cleanup
      try {
        const saveResponse = await saveResponsePromise;
        const body = await saveResponse.json();
        if (body?.id) cleanupTemplateId = body.id;
      } catch {
        // Non-fatal
      }
    },
  );

  // -------------------------------------------------------------------------
  // TC-037-05 / AC5
  // -------------------------------------------------------------------------
  test(
    "TC-037-05 / AC5: Simulated POST /canvas-templates 500 → error toast shown; editor state intact",
    async ({ page }) => {
      /**
       * Contract:
       *   Expected: "Template save failed" error toast appears; canvas visible; URL unchanged.
       *   Location: /editor (POST intercepted → HTTP 500)
       *   Condition: "Save as Template" triggered, network returns 500
       *
       * No template is persisted — no afterEach cleanup needed.
       */

      await openFreshEditor(page);

      // Intercept the POST to canvas-templates; let GET through (other queries must pass)
      await page.route("**/api/v1/canvas-templates", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ message: "Simulated server error" }),
          });
        } else {
          await route.continue();
        }
      });

      const urlBefore = page.url();

      await page.getByRole("button", { name: /save as template/i }).click();
      await expect(
        page.getByRole("heading", { name: /save your work/i }),
      ).toBeVisible({ timeout: 8_000 });

      const nameInput = page.locator("#design-name");
      await nameInput.clear();
      await nameInput.fill(`${TEMPLATE_NAME}-fail`);
      await page.getByRole("button", { name: /save template/i }).click();

      // AC5 — A clear error toast must appear
      await expect(page.getByText(/template save failed/i)).toBeVisible({
        timeout: 15_000,
      });

      // AC5 — Canvas must still be visible (no crash or navigation on failure)
      await expect(
        page.locator('[data-testid="design-canvas"]'),
      ).toBeVisible();

      // AC5 — URL unchanged (editor not navigated away after failure)
      expect(page.url()).toBe(urlBefore);
    },
  );

  // -------------------------------------------------------------------------
  // TC-037-07 — Live DB verification (no migration re-run)
  // -------------------------------------------------------------------------
  test(
    "TC-037-07: GET /canvas-templates?visibility=admin_curated returns 5 rows with real names",
    async ({ page }) => {
      /**
       * Contract:
       *   Expected: exactly 5 admin_curated templates from the live DB; each has
       *             a non-empty, real name (not a legacy static-file ID pattern).
       *   Source: direct API call using the JWT already in the page's localStorage
       *           (ensureLoggedIn in beforeEach has authenticated the session).
       *   Verifies: AC8 — migration script ran and produced 5 correct DB rows.
       *
       * Note: page.request.get() is used instead of page.waitForResponse() to
       * avoid the timing race where the 30s waitForResponse window can expire
       * before a slow staging navigation completes.
       */

      // beforeEach has already authenticated — JWT is in localStorage
      const token = await page.evaluate(() => localStorage.getItem("auth_token"));
      expect(token).toBeTruthy();

      // Call the admin_curated endpoint directly with the JWT
      const apiResponse = await page.request.get(
        `${baseURL}/api/v1/canvas-templates?visibility=admin_curated`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30_000,
        },
      );

      expect(apiResponse.ok()).toBe(true);
      const templates = (await apiResponse.json()) as Array<{
        id: string;
        name: string;
        visibility?: string;
      }>;

      // Exactly 5 rows — the seed-premium-templates migration inserts exactly 5
      expect(Array.isArray(templates)).toBe(true);
      expect(templates).toHaveLength(5);

      for (const t of templates) {
        // Each row must have a non-empty real name
        expect(typeof t.name).toBe("string");
        expect(t.name.length).toBeGreaterThan(0);

        // Names must NOT be legacy static-file IDs (e.g., "premium_001", "premium_002")
        expect(t.name).not.toMatch(/^premium_\d+$/i);

        // Each must carry a non-empty database ID
        expect(typeof t.id).toBe("string");
        expect(t.id.length).toBeGreaterThan(0);
      }
    },
  );

  // -------------------------------------------------------------------------
  // TC-037-08 / AC9
  // -------------------------------------------------------------------------
  test(
    "TC-037-08 / AC9: TemplatesPage Premium gallery renders real template cards from the API",
    async ({ page }) => {
      /**
       * Contract:
       *   Expected: "Use Template" buttons are visible; neither the error state
       *             ("Premium templates could not be loaded") nor the empty state
       *             ("No premium templates available yet") is shown.
       *   Source: live API — no route interception.
       *   Verifies: AC9 — Premium gallery sources from the DB, not the deleted static file.
       */

      await page.goto("/templates", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(
        page.getByRole("heading", { name: /template gallery/i }),
      ).toBeVisible({ timeout: 20_000 });

      // Wait for templates to finish loading — the "Use Template" button on a card
      // is the visible signal that the gallery rendered successfully
      await expect(
        page.getByRole("button", { name: "Use Template" }).first(),
      ).toBeVisible({ timeout: 30_000 });

      // AC9 — Error state must NOT be shown
      await expect(
        page.getByText(/premium templates could not be loaded/i),
      ).not.toBeVisible();

      // AC9 — Empty state must NOT be shown
      await expect(
        page.getByText(/no premium templates available yet/i),
      ).not.toBeVisible();
    },
  );

  // -------------------------------------------------------------------------
  // TC-037-09 / AC10
  // -------------------------------------------------------------------------
  test(
    "TC-037-09 / AC10: Simulated admin_curated fetch failure → clear error state shown; no crash",
    async ({ page }) => {
      /**
       * Contract:
       *   Expected: "Premium templates could not be loaded" message appears after
       *             React Query exhausts its 1 retry; the page heading is still
       *             visible (no crash, no blank section, no stale fallback data).
       *   Location: GET /canvas-templates?visibility=admin_curated intercepted → 500
       *   Verifies: AC10 — error path renders a clear UI state, not silence or a crash.
       */

      // Intercept only the admin_curated endpoint (user's own templates must pass through)
      await page.route(
        (url) =>
          url.pathname.includes("/canvas-templates") &&
          url.searchParams.get("visibility") === "admin_curated",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ message: "Simulated server error" }),
          });
        },
      );

      await page.goto("/templates", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(
        page.getByRole("heading", { name: /template gallery/i }),
      ).toBeVisible({ timeout: 20_000 });

      // AC10 — Error state must appear.
      // React Query retries once (retry: 1 in the component) before setting isError=true,
      // so allow enough time for the retry cycle to complete (~2–5 s on a live network).
      await expect(
        page.getByText(/premium templates could not be loaded/i),
      ).toBeVisible({ timeout: 30_000 });

      // Page must not have crashed — the gallery heading is still present
      await expect(
        page.getByRole("heading", { name: /template gallery/i }),
      ).toBeVisible();
    },
  );
});
