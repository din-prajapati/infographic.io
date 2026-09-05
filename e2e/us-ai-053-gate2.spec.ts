/**
 * US-AI-053 — Gate 2: one AI background per canvas, and undo brings the
 * previous one back.
 *
 * Run:
 *   npx playwright test e2e/us-ai-053-gate2.spec.ts
 *
 * This is the check the unit tests cannot make. They cover
 * `splitElementsForAiBackground` and the store's history round trip
 * *separately*; only a real run proves `loadAiVariationToCanvas` wires them
 * together — partition, then pushToHistory, then loadCanvas — against a real
 * image pipeline.
 *
 * Cost: TWO real generations (~$0.16). The second is the point: the first is
 * an insert, the second is the replacement under test.
 *
 * Drives **Quick Generate**, deliberately, not AI Chat. AI Chat's backend
 * validation intermittently refuses valid prompts (BL-22) — it blocked five
 * consecutive attempts on 2026-09-03. Quick Generate posts structured form
 * fields and never touches the prompt extractor.
 *
 * Auth: fresh throwaway account per run. FREE tier allows 3 designs/month and
 * this spends 2, so it cannot loop on one account.
 */
import { test, expect, type Page } from "@playwright/test";
import process from "node:process";

const baseURL = (process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

async function registerFreshAccount(): Promise<{ token: string; user: unknown }> {
  const email = `e2e-ai053-${Date.now()}@test.local`;
  const res = await fetch(`${baseURL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "E2eProbe12345!", name: "E2E US-AI-053" }),
  });
  if (!res.ok) throw new Error(`Registration failed: HTTP ${res.status} — ${await res.text()}`);
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
  if (!res?.ok()) throw new Error(`Cannot load /templates — check PLAYWRIGHT_BASE_URL: ${baseURL}`);
  await expect(page.getByRole("heading", { name: /template gallery/i })).toBeVisible({
    timeout: 30_000,
  });
}

/** Open a real template, so the canvas has a deliberate origin and real layers. */
async function openTemplateInEditor(page: Page) {
  const useTemplate = page.getByRole("button", { name: "Use Template" }).first();
  await expect(useTemplate).toBeVisible({ timeout: 60_000 });
  await useTemplate.scrollIntoViewIfNeeded();
  await useTemplate.click();
  await expect(page).toHaveURL(/\/editor\?.*templateId=/, { timeout: 30_000 });
  await expect(page.locator('[data-testid="design-canvas"]')).toBeVisible();
}

async function fillPropertyDetails(page: Page) {
  await page.getByRole("button", { name: "Property", exact: true }).click();
  await page.locator("#headline").fill("SPACIOUS 3 BHK VILLA");
  await page.locator("#price").fill("18500000");
  await page.locator("#sqft").fill("2450");
  await page.locator("#address").fill("Shela, Ahmedabad");
}

/** One Quick Generate cycle, ending with the design placed on the canvas. */
async function quickGenerateAndUse(page: Page, attempt: number) {
  await page.getByRole("button", { name: /quick generate/i }).click();
  const useThis = page.locator('button:has-text("Use This")').first();
  await expect(useThis, `generation ${attempt} produced no results`).toBeVisible({
    timeout: 600_000,
  });
  await useThis.click();
  await expect(
    page.getByText(/design loaded|background replaced/i).first(),
    `generation ${attempt} never landed on the canvas`,
  ).toBeVisible({ timeout: 120_000 });
}

/**
 * Read the layer count from the Layers panel's own "N Layers" badge.
 *
 * Deliberately NOT `window.__canvasStore`: the store is not exposed to the
 * page, and exposing it would mean adding a test hook to production code in
 * order to verify production behaviour. The badge renders straight from
 * `useCanvasStore.elements`, so it counts the same thing this story changes —
 * and it is what the user can see for themselves.
 */
async function readLayerCount(page: Page): Promise<number> {
  const layersButton = page.locator('button[aria-pressed]').last();
  if ((await layersButton.getAttribute("aria-pressed")) !== "true") {
    await layersButton.click();
  }
  const badge = page.getByText(/^\d+ Layers?$/);
  await expect(badge).toBeVisible({ timeout: 15_000 });
  const count = Number.parseInt(((await badge.textContent()) ?? "0").trim(), 10);

  // Close it again. The panel is `fixed left-0 w-80 z-[9998]` and sits over the
  // editor chrome, so leaving it open makes every later interaction — the
  // Property tab, Quick Generate — either miss or time out.
  await layersButton.click();
  await expect(badge).toHaveCount(0, { timeout: 10_000 });

  return count;
}

/**
 * Wait for the canvas to actually hold layers before reading a count off it.
 *
 * A template's elements arrive after the canvas element is visible, so reading
 * immediately returns "0 Layers" for a template that is about to have several.
 * Every assertion in this spec compares counts, and a premature 0 would make
 * them compare the wrong things — quietly, and in the direction that passes.
 */
async function waitForLayers(page: Page, timeoutMs = 30_000): Promise<number> {
  const deadline = Date.now() + timeoutMs;
  let count = await readLayerCount(page);
  while (count === 0 && Date.now() < deadline) {
    await page.waitForTimeout(1_000);
    count = await readLayerCount(page);
  }
  return count;
}

test.describe("US-AI-053 — Gate 2", () => {
  test.describe.configure({ retries: 0 });
  test.use({ navigationTimeout: 90_000, actionTimeout: 60_000 });

  test("a second generation replaces the background instead of stacking, and undo restores it", async ({
    page,
  }, testInfo) => {
    test.setTimeout(1_800_000);

    await ensureLoggedIn(page);
    await openTemplateInEditor(page);

    const templateLayers = await waitForLayers(page);
    expect(templateLayers, "the template should put real layers on the canvas").toBeGreaterThan(0);

    await fillPropertyDetails(page);

    // ── Generation 1 — an insert. No prior background, so AC3 keeps quiet.
    await quickGenerateAndUse(page, 1);
    await expect(
      page.getByText(/background replaced/i),
      "the first generation is an insert, not a replacement — it must not claim otherwise",
    ).toHaveCount(0);

    const afterFirst = await readLayerCount(page);

    // ── Generation 2 — the replacement under test.
    await quickGenerateAndUse(page, 2);

    // AC3 — check the toast FIRST. It lasts ~4s (sonner default, no duration
    // configured) and readLayerCount opens and closes a panel, which takes
    // longer than that. The 2026-09-05 local run failed here for exactly this
    // reason: the toast had fired and expired before the assertion ran.
    await expect(
      page.getByText(/background replaced/i).first(),
      "the second generation is a replacement and should say so",
    ).toBeVisible({ timeout: 10_000 });

    const afterSecond = await readLayerCount(page);

    await testInfo.attach("layer-counts", {
      body: [
        `template only        : ${templateLayers}`,
        `after generation 1   : ${afterFirst}`,
        `after generation 2   : ${afterSecond}`,
        ``,
        `AC1 holds when the last two are equal.`,
        `Before US-AI-053 the second would be one higher — the stack.`,
      ].join("\n"),
      contentType: "text/plain",
    });

    // AC1 — the whole point. Before this story, generation 2 added a layer.
    expect(
      afterSecond,
      `background stacked instead of replacing: ${afterFirst} → ${afterSecond} layers`,
    ).toBe(afterFirst);

    // ── AC2 — undo is wired. Before this story loadCanvas never touched
    // history, so Ctrl+Z did nothing at all here.
    await page.locator('[data-testid="design-canvas"]').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("Control+z");
    await page.waitForTimeout(1_500);

    const afterUndo = await readLayerCount(page);
    expect(
      afterUndo,
      "undo should return the canvas to its pre-replacement layer count",
    ).toBe(afterFirst);
  });
});
