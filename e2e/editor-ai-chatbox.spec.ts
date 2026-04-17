/**
 * Editor + AI ChatBox smoke tests — system Chrome, maximized (local).
 *   npm run test:e2e:editor
 *
 * Headless CI (e.g. GitHub Actions):
 *   set CI=true && npm run test:e2e:editor
 *
 * Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env when /templates redirects to /auth.
 * Playwright loads root `.env` via playwright.config.ts (`import "dotenv/config"`).
 */
import { test, expect } from "@playwright/test";
import process from "node:process";

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

async function ensureLoggedIn(page: import("@playwright/test").Page) {
  const res = await page.goto("/templates", {
    waitUntil: "load",
  });
  if (!res || !res.ok()) {
    throw new Error(
      `Cannot load /templates (HTTP ${res?.status() ?? "no response"}). Start the app: npm run dev → ${process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000"}`,
    );
  }
  if (page.url().includes("/auth")) {
    if (!email || !password) {
      test.skip(
        true,
        "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env (loaded by playwright.config) or the shell.",
      );
    }
    await page.getByTestId("input-email").fill(email);
    await page.getByTestId("input-password").fill(password);
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 30_000 });
    await page.goto("/templates", { waitUntil: "load" });
  }
}

async function openEditorFromFirstTemplate(page: import("@playwright/test").Page) {
  await page.goto("/templates", { waitUntil: "load" });
  await expect(
    page.getByRole("heading", { name: /template gallery/i }),
  ).toBeVisible();
  const useTemplate = page.getByRole("button", { name: "Use Template" }).first();
  await useTemplate.scrollIntoViewIfNeeded();
  await expect(useTemplate).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/editor\?.*templateId=/, { timeout: 30_000 }),
    useTemplate.click(),
  ]);
}

test.describe("Editor + AI ChatBox", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test("E1: Use Template navigates with templateId in URL", async ({ page }) => {
    await openEditorFromFirstTemplate(page);
    expect(page.url()).toMatch(/templateId=/);
  });

  test("E7: design canvas test id present", async ({ page }) => {
    await openEditorFromFirstTemplate(page);
    await expect(page.locator('[data-testid="design-canvas"]')).toBeVisible();
  });

  test("AC1–AC7: open chat, chip, prompt, close removes panel", async ({
    page,
  }) => {
    await openEditorFromFirstTemplate(page);
    await expect(page.locator('[data-testid="design-canvas"]')).toBeVisible();

    await page.getByRole("button", { name: /open ai chat/i }).click();
    await expect(page.locator("#ai-chat-panel")).toBeVisible();

    await page.getByRole("button", { name: /property listings/i }).click();

    // Placeholder (and thus a11y name) switches to "Describe..." once a chip is selected.
    const prompt = page.locator("#ai-chat-panel textarea");
    await expect(prompt).toBeVisible();
    await prompt.fill("E2E: editor AI chat prompt verification");

    await page
      .locator("#ai-chat-panel")
      .getByRole("button", { name: "Close", exact: true })
      .click();
    await expect(page.locator("#ai-chat-panel")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /open ai chat/i }),
    ).toBeVisible();
  });
});
