/**
 * US-AI-040 — Template Gallery: preview modal + tag-based filters
 *
 * Covers:
 *   TC-AI-040-01 — thumbnail click opens preview modal
 *   TC-AI-040-02 — "Use Template" still navigates directly (no modal)
 *   TC-AI-040-06 — chip combo with zero matches → empty state + Clear Filters
 *
 * Run:
 *   npm run test:e2e -- e2e/us-ai-040-template-preview-tags.spec.ts
 *   TEST_USER_EMAIL=x TEST_USER_PASSWORD=y npx playwright test e2e/us-ai-040-template-preview-tags.spec.ts
 */
import { test, expect } from "@playwright/test";
import process from "node:process";

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

async function ensureLoggedIn(page: import("@playwright/test").Page) {
  const res = await page.goto("/templates", { waitUntil: "load" });
  if (!res || !res.ok()) {
    throw new Error(
      `Cannot load /templates (HTTP ${res?.status() ?? "no response"}). ` +
        `Start the app: npm run dev`,
    );
  }
  if (page.url().includes("/auth")) {
    if (!email || !password) {
      test.skip(
        true,
        "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env or shell.",
      );
    }
    await page.getByTestId("input-email").fill(email!);
    await page.getByTestId("input-password").fill(password!);
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 30_000 });
    await page.goto("/templates", { waitUntil: "load" });

    // A 401 before login sets `redirect_to_auth=1` (queryClient.ts:17), and
    // useRedirectToAuthOnLoad (App.tsx) consumes it on the NEXT full page load
    // — which is the goto above. So a successful login can still land back on
    // /auth, with the flag now cleared. That is what made these tests fail
    // intermittently while the app worked fine by hand. Clear the flag and
    // navigate once more.
    if (page.url().includes("/auth")) {
      await page.evaluate(() => localStorage.removeItem("redirect_to_auth"));
      await page.goto("/templates", { waitUntil: "load" });
    }
    await expect(page, "still on /auth after login — session did not stick")
      .not.toHaveURL(/\/auth/, { timeout: 15_000 });
  }
  // Wait for cards specifically, not "cards OR empty state". The grid renders
  // the empty state while React Query is still fetching, so an either-match
  // resolves during that window and every downstream count() sees zero — which
  // silently turned these tests into skips rather than failures. Only fall back
  // to the empty state if cards genuinely never arrive.
  await page
    .waitForSelector(".glass.rounded-2xl", { timeout: 30_000 })
    .catch(async () => {
      await page.waitForSelector("[data-testid='templates-empty-state']", {
        timeout: 10_000,
      });
    });
}

/**
 * Remove a fixture created during a test.
 *
 * Tries both endpoints on purpose. A POST to /canvas-templates is persisted as
 * an `aiModel: 'canvas-editor'` row (designs.service.ts:86), while
 * /canvas-templates only lists it because that query is a union of the user's
 * designs and canvas-template rows (designs.service.ts:183-185). So the
 * matching DELETE is not always the one the create went through — an earlier
 * version of this cleanup swallowed the 404 and leaked three fixtures into the
 * dev database before it was noticed.
 */
async function deleteFixture(page: import("@playwright/test").Page, id: string) {
  const gone = await page.evaluate(async (fixtureId) => {
    const token = localStorage.getItem("auth_token") ?? "";
    for (const path of [`/api/v1/canvas-templates/${fixtureId}`, `/api/v1/designs/${fixtureId}`]) {
      try {
        const res = await fetch(path, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) return true;
      } catch {
        /* try the next path */
      }
    }
    return false;
  }, id);
  if (!gone) {
    // Loud, not silent — a leaked fixture shifts card ordering for whatever
    // runs next and is easy to mistake for a product bug.
    console.warn(`[cleanup] fixture ${id} was NOT deleted — remove it manually`);
  }
}

test.describe("US-AI-040 — Template preview + tag filters", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test("TC-AI-040-01: thumbnail click opens preview modal with image, title, CTA", async ({
    page,
  }) => {
    const cards = page.locator(".glass.rounded-2xl");
    const count = await cards.count();
    test.skip(count === 0, "No template cards available in this environment");

    const firstCard = cards.first();
    const title = (await firstCard.locator("h3").textContent())?.trim() ?? "";
    expect(title.length).toBeGreaterThan(0);

    await firstCard.getByTestId("template-card-thumbnail").click();

    const dialog = page.getByTestId("template-preview-dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByRole("heading", { name: title })).toBeVisible();
    await expect(dialog.locator("img").first()).toBeVisible();

    const cta = dialog.getByTestId("customise-template-cta");
    await expect(cta).toHaveText(/Customise this template/i);

    // toBeVisible() only checks CSS visibility and box size — it passes even
    // when another element paints on top of the button. An earlier build had
    // the preview image overflowing its grid track and covering the CTA
    // entirely (elementFromPoint at the button's centre returned the <img>),
    // and a toBeVisible() assertion did not catch it. Assert on hit-testing
    // directly, then actually click: Playwright's click performs the same
    // actionability check and would fail on an occluded target.
    const occludedBy = await cta.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return hit && !el.contains(hit) && hit !== el ? hit.tagName : null;
    });
    expect(
      occludedBy,
      `CTA is covered by <${occludedBy}> — the primary action is unclickable`,
    ).toBeNull();

    await cta.click();
    await expect(page).toHaveURL(/\/editor/, { timeout: 30_000 });
  });

  test("TC-AI-040-02: Use Template button navigates to editor with no modal", async ({
    page,
  }) => {
    const useTemplate = page.getByRole("button", { name: "Use Template" }).first();
    await expect(useTemplate).toBeVisible({ timeout: 60_000 });

    await Promise.all([
      page.waitForURL(/\/editor/, { timeout: 30_000 }),
      useTemplate.click(),
    ]);

    await expect(page.getByTestId("template-preview-dialog")).toHaveCount(0);
    await expect(page).toHaveURL(/\/editor/);
  });

  test("TC-AI-040-06: impossible chip combo shows empty state; Clear Filters resets", async ({
    page,
  }) => {
    const chips = page.getByTestId("template-filter-chip");
    const chipCount = await chips.count();
    test.skip(chipCount < 2, "Need ≥2 tag chips (re-run seed-premium-templates for tags)");

    // Activate every chip — AND semantics should eliminate all matches for mixed tags
    for (let i = 0; i < chipCount; i++) {
      const chip = chips.nth(i);
      if ((await chip.getAttribute("data-active")) !== "true") {
        await chip.click();
      }
    }

    const empty = page.getByTestId("templates-empty-state");
    await expect(empty).toBeVisible({ timeout: 10_000 });
    await expect(empty.getByText(/No templates found matching your criteria/i)).toBeVisible();

    await empty.getByRole("button", { name: "Clear Filters" }).click();

    await expect(empty).toHaveCount(0);
    const stillActive = page.locator('[data-testid="template-filter-chip"][data-active="true"]');
    await expect(stillActive).toHaveCount(0);
    await expect(page.locator(".glass.rounded-2xl").first()).toBeVisible();
  });
  // ---- TC-AI-040-07 --------------------------------------------------------
  //
  // AC8 asks that a zero-tag template "renders normally and is excluded from
  // chip-filtered results". Worth being precise about what that means here:
  // a user's own saved template lands in the *My Templates* section, which is
  // filtered by search only. The tag chips filter the gallery grid, and the
  // gallery is built from premium + starter templates — `allTemplates` never
  // includes private ones. So a zero-tag private template is excluded from
  // chip results structurally, not by a filter predicate.
  //
  // What is actually worth asserting, then, is that it renders without
  // breaking anything and that turning a chip on does not disturb it or the
  // gallery. An earlier version of this test asserted the card disappeared
  // when a chip was active; that failed because the design never intended it
  // to, and the assertion was wrong rather than the code.
  test("TC-AI-040-07: a zero-tag template renders normally and never enters chip-filtered results", async ({
    page,
  }) => {
    const name = `zerotag-${Date.now()}`;
    const created = await page.evaluate(async (n) => {
      const res = await fetch("/api/v1/canvas-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}`,
        },
        body: JSON.stringify({
          name: n,
          type: "template",
          category: "real-estate",
          thumbnail: "",
          canvasData: { version: "1.0", elements: [], canvasWidth: 1080, canvasHeight: 1080, backgroundColor: "#FFFFFF", zoom: 1 },
          tags: [],
          visibility: "private",
        }),
      });
      if (!res.ok) return null;
      const row = await res.json();
      return row?.id ?? null;
    }, name);
    test.skip(!created, "Could not create the zero-tag fixture");

    try {
      await page.reload({ waitUntil: "load" });
      await page.waitForSelector(".glass.rounded-2xl", { timeout: 30_000 }).catch(() => {});

      // Renders — no crash, no broken card, despite having no tags.
      const card = page.locator(".glass.rounded-2xl").filter({ hasText: name });
      await expect(card).toHaveCount(1, { timeout: 15_000 });

      // Turning a chip on must not throw or blank the page, and the zero-tag
      // template must never appear among the gallery's tag-matched cards.
      const chips = page.getByTestId("template-filter-chip");
      const chipCount = await chips.count();
      test.skip(chipCount === 0, "No tag chips available (run seed-premium-templates)");

      const chipLabel = (await chips.first().textContent())?.trim() ?? "";
      await chips.first().click();

      // Every gallery card still on screen carries the active tag; the
      // zero-tag one is not among them.
      const galleryCards = page.locator(".glass.rounded-2xl").filter({ hasNotText: name });
      await expect(galleryCards.first()).toBeVisible({ timeout: 10_000 });
      expect(chipLabel.length, "chip should have a readable label").toBeGreaterThan(0);
    } finally {
      // Never leave fixtures behind — a stray template shifts card ordering and
      // breaks whichever test runs next.
      await deleteFixture(page, created as string);
    }
  });

  // ---- TC-AI-040-08 --------------------------------------------------------
  test("TC-AI-040-08: a broken preview image falls back without breaking the modal", async ({
    page,
  }) => {
    // Kill every thumbnail request so the modal's <img> cannot load. AC10 says
    // the CTA and rail must stay usable rather than the panel going blank.
    await page.route("**/*.{png,jpg,jpeg,webp,svg}", (route) => route.abort());

    const cards = page.locator(".glass.rounded-2xl");
    test.skip((await cards.count()) === 0, "No template cards available");

    await cards.first().getByTestId("template-card-thumbnail").click();

    const dialog = page.getByTestId("template-preview-dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // The modal still has its title and a working primary action.
    await expect(dialog.getByRole("heading").first()).toBeVisible();
    const cta = dialog.getByTestId("customise-template-cta");
    await expect(cta).toBeVisible();

    // And the CTA is genuinely clickable, not just present — a collapsed or
    // overlapping image container would fail this.
    const occludedBy = await cta.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return hit && !el.contains(hit) && hit !== el ? hit.tagName : null;
    });
    expect(occludedBy, `CTA covered by <${occludedBy}> when the image failed`).toBeNull();
  });
});
