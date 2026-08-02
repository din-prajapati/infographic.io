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
});
