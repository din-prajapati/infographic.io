/**
 * BL-24 — Quick Generate must recover a completed design when socket.io does
 * not deliver its terminal event.
 *
 * This is mock-backed: the browser skips socket.io and the status endpoint is
 * the sole terminal-state signal, matching the staging failure mode.
 */
import { test, expect, type Page } from "@playwright/test";
import process from "node:process";

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;
const POLL_ONLY_KEY = "e2e-generation-poll-only";
const GENERATION_ID = "gen-bl-24";

const variations = [
  { id: "bl-24-v1", imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'/%3E", title: "Variation 1", description: "" },
  { id: "bl-24-v2", imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'/%3E", title: "Variation 2", description: "" },
  { id: "bl-24-v3", imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'/%3E", title: "Variation 3", description: "" },
];

async function signInAndOpenEditor(page: Page) {
  if (!email || !password) {
    test.skip(true, "Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run this authenticated E2E test.");
  }

  await page.goto("/templates", { waitUntil: "domcontentloaded" });
  const login = page.getByRole("heading", { name: /welcome back/i });
  const gallery = page.getByRole("heading", { name: /template gallery/i });
  await expect(login.or(gallery)).toBeVisible({ timeout: 30_000 });
  if (await login.isVisible()) {
    await page.getByTestId("input-email").fill(email!);
    await page.getByTestId("input-password").fill(password!);
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 30_000 });
  }

  await expect(gallery).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Use Template" }).first().click();
  await expect(page.locator('[data-testid="design-canvas"]')).toBeVisible();
}

async function mockCompletedStatusWithoutSocket(page: Page) {
  await page.addInitScript((key) => localStorage.setItem(key, "1"), POLL_ONLY_KEY);
  await page.evaluate((key) => localStorage.setItem(key, "1"), POLL_ONLY_KEY);

  await page.route("**/api/v1/infographics/generations", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    await route.fulfill({ json: { id: GENERATION_ID, status: "processing" } });
  });
  await page.route("**/api/v1/infographics/generations/*/status", async (route) => {
    await route.fulfill({ json: { id: GENERATION_ID, status: "completed" } });
  });
  await page.route("**/api/v1/infographics/generations/*/variations", async (route) => {
    await route.fulfill({ json: variations });
  });
}

test("TC-BL-24-01 [P0] completed status renders Quick Generate results when socket delivery is unavailable", async ({ page }) => {
  await signInAndOpenEditor(page);
  await mockCompletedStatusWithoutSocket(page);

  await page.getByRole("button", { name: "Property", exact: true }).click();
  await page.locator("#price").fill("18500000");
  await page.locator("#address").fill("Shela, Ahmedabad");
  await page.getByRole("button", { name: /quick generate/i }).click();

  // Contract: with no socket progress event, the status-poll completion path
  // renders the exact three returned variations and releases the CTA.
  await expect(page.getByText("3 Results", { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('button:has-text("Use This")')).toHaveCount(3);
  await expect(page.getByRole("button", { name: /quick generate/i })).toBeEnabled();
});

test("TC-BL-24-02 [P0] a second poll-only generation also reaches its results", async ({ page }) => {
  // The completion path is guarded by a `terminalStateHandledRef` that both the
  // socket and the poll check before loading results. If it is not reset when a
  // new generation starts, generation #1 passes and every generation after it
  // hangs at "Starting…" forever — the exact BL-24 symptom, reintroduced one
  // layer up and invisible to TC-BL-24-01. This is the test that catches that.
  await signInAndOpenEditor(page);
  await mockCompletedStatusWithoutSocket(page);

  await page.getByRole("button", { name: "Property", exact: true }).click();
  await page.locator("#price").fill("18500000");
  await page.locator("#address").fill("Shela, Ahmedabad");

  const cta = page.getByRole("button", { name: /quick generate/i });
  await cta.click();
  await expect(page.getByText("3 Results", { exact: true })).toBeVisible({ timeout: 15_000 });

  // Second run, from the results view the user is already looking at.
  await page.getByRole("button", { name: /regenerate all/i }).click();

  // The CTA relabels to its in-flight text, so "Quick Generate" leaves the DOM.
  // Asserting that first proves the click actually started a new generation —
  // without it, a stuck ref would leave the old results on screen and the
  // completion assertion below would pass against generation #1's output.
  await expect(cta).toHaveCount(0);

  // Contract: the second generation resolves through the poll exactly as the
  // first did, rather than hanging on a terminal-state guard left set.
  await expect(page.getByText("3 Results", { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('button:has-text("Use This")')).toHaveCount(3);
  await expect(cta).toBeEnabled();
});
