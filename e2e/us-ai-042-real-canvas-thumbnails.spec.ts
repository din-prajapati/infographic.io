/**
 * US-AI-042 — Real canvas thumbnails on save
 *
 * Covers:
 *   TC-AI-042-04  A non-empty canvas produces a thumbnail that is NOT the placeholder
 *   TC-AI-042-06  Capture failure still yields a usable thumbnail (placeholder), never a throw
 *
 * These drive `generateThumbnail()` through the app's own module graph rather
 * than through the save UI. That is deliberate: the defect this story fixes was
 * entirely inside that function (it returned the placeholder, or painted the
 * design into the corner of an oversized frame), and asserting on the produced
 * pixels is the only way to catch it. A UI-level "did a save happen" test
 * passed happily the whole time the bug existed.
 *
 * Run:
 *   PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-ai-042-real-canvas-thumbnails.spec.ts
 *
 * NOTE: .env sets PLAYWRIGHT_BASE_URL to the Railway staging URL, so a bare
 * `npx playwright test` runs against staging. Pass the localhost override.
 */

import { test, expect } from "@playwright/test";
import process from "node:process";

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

/** A premium template id seeded by api/scripts/seed-premium-templates.ts. */
async function firstTemplateId(page: import("@playwright/test").Page): Promise<string | null> {
  return page.evaluate(async () => {
    const res = await fetch("/api/v1/canvas-templates?visibility=admin_curated", {
      headers: { Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}` },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length ? String(rows[0].id) : null;
  });
}

async function ensureLoggedIn(page: import("@playwright/test").Page) {
  const res = await page.goto("/templates", { waitUntil: "load" });
  if (!res || !res.ok()) {
    throw new Error(
      `Cannot load /templates (HTTP ${res?.status() ?? "no response"}). Start the app: npm run dev`,
    );
  }
  if (page.url().includes("/auth")) {
    if (!email || !password) {
      test.skip(true, "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env or shell.");
    }
    await page.getByTestId("input-email").fill(email!);
    await page.getByTestId("input-password").fill(password!);
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 30_000 });

    // A 401 before login sets `redirect_to_auth=1` (queryClient.ts:17), which
    // useRedirectToAuthOnLoad consumes on the next full page load — so a
    // successful login can still bounce back to /auth with the flag cleared.
    if (page.url().includes("/auth")) {
      await page.evaluate(() => localStorage.removeItem("redirect_to_auth"));
      await page.goto("/templates", { waitUntil: "load" });
    }
  }
}

/** Open the editor with a real template loaded, and wait for elements to land. */
async function openEditorWithTemplate(page: import("@playwright/test").Page) {
  const id = await firstTemplateId(page);
  test.skip(!id, "No admin-curated templates seeded in this environment");

  await page.goto(`/editor?templateId=${id}`, { waitUntil: "load" });
  await page.waitForSelector("[data-canvas-container]", { timeout: 30_000 });

  // Wait for the template's elements to actually populate the store — not just
  // for the container to exist. Waiting on the container alone passes while the
  // canvas is still empty, which would make the assertions below meaningless.
  await page.waitForFunction(
    async () => {
      const storePath = "/src/hooks/useCanvasStore.ts";
      const m = await import(/* @vite-ignore */ storePath);
      return m.useCanvasStore.getState().elements.length > 0;
    },
    undefined,
    { timeout: 30_000 },
  );

  // Elements land in the store before their images and webfonts finish
  // painting. Capturing at that instant yields a technically-real but nearly
  // flat render, so let the artboard settle before asserting on its pixels.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
}

test.describe("US-AI-042 — Real canvas thumbnails on save", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test("TC-AI-042-04: a non-empty canvas produces a real render, not the placeholder", async ({
    page,
  }) => {
    await openEditorWithTemplate(page);

    const result = await page.evaluate(async () => {
      const statePath = "/src/lib/canvasState.ts";
      const storePath = "/src/hooks/useCanvasStore.ts";
      const cs = await import(/* @vite-ignore */ statePath);
      const store = (await import(/* @vite-ignore */ storePath)).useCanvasStore.getState();

      const thumb = await cs.generateThumbnail();
      const placeholder = cs.generateThumbnailSync();

      const img = new Image();
      img.src = thumb;
      await img.decode();

      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height).data;

      const colours = new Set<string>();
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 10) colours.add(`${data[i] >> 4},${data[i + 1] >> 4},${data[i + 2] >> 4}`);
      }

      return {
        isPlaceholder: thumb === placeholder,
        w: c.width,
        h: c.height,
        colours: colours.size,
        artboardRatio: store.canvasWidth / store.canvasHeight,
      };
    });

    // The placeholder is a valid PNG, so "an image exists" proves nothing.
    expect(result.isPlaceholder, "generateThumbnail() returned the placeholder").toBe(false);

    // A real render of a template carries many distinct colours; a flat
    // fallback would not.
    expect(result.colours).toBeGreaterThan(10);

    // AC4 — artboard aspect preserved, long edge capped at 320.
    expect(Math.max(result.w, result.h)).toBeLessThanOrEqual(320);
    expect(result.w / result.h).toBeCloseTo(result.artboardRatio, 1);
  });

  test("TC-AI-042-06: capture failure falls back to the placeholder without throwing", async ({
    page,
  }) => {
    await openEditorWithTemplate(page);

    const result = await page.evaluate(async () => {
      const statePath = "/src/lib/canvasState.ts";
      const cs = await import(/* @vite-ignore */ statePath);

      // Remove the container the capture guard looks for, forcing the failure
      // path. A thumbnail problem must never block a save (AC5).
      const el = document.querySelector("[data-canvas-container]");
      el?.removeAttribute("data-canvas-container");

      let threw = false;
      let thumb = "";
      try {
        thumb = await cs.generateThumbnail();
      } catch {
        threw = true;
      }

      return {
        threw,
        isPlaceholder: thumb === cs.generateThumbnailSync(),
        isEmpty: thumb === "",
      };
    });

    expect(result.threw, "generateThumbnail() must not throw on failure").toBe(false);
    expect(result.isEmpty, "must never return an empty string").toBe(false);
    expect(result.isPlaceholder, "should fall back to the placeholder").toBe(true);
  });
  // ---- TC-AI-042-05 --------------------------------------------------------
  test("TC-AI-042-05: aspect ratio is preserved across portrait, square and wide artboards", async ({
    page,
  }) => {
    await openEditorWithTemplate(page);

    // Drive the artboard directly rather than hunting for a template of each
    // shape — the point is the capture maths, not template plumbing.
    const cases = [
      { label: "Story (portrait)", w: 1080, h: 1920 },
      { label: "Post (square)", w: 1080, h: 1080 },
      { label: "Email Header (wide)", w: 1200, h: 400 },
    ];

    for (const c of cases) {
      const r = await page.evaluate(async ({ w, h }) => {
        const statePath = "/src/lib/canvasState.ts";
        const storePath = "/src/hooks/useCanvasStore.ts";
        const cs = await import(/* @vite-ignore */ statePath);
        const store = (await import(/* @vite-ignore */ storePath)).useCanvasStore;
        const s0 = store.getState();
        store.setState({ ...s0, canvasWidth: w, canvasHeight: h });

        const thumb = await cs.generateThumbnail();
        const img = new Image();
        img.src = thumb;
        await img.decode();
        return { tw: img.naturalWidth, th: img.naturalHeight, isPlaceholder: thumb === cs.generateThumbnailSync() };
      }, { w: c.w, h: c.h });

      expect(r.isPlaceholder, `${c.label}: fell back to the placeholder`).toBe(false);
      expect(Math.max(r.tw, r.th), `${c.label}: long edge must cap at 320`).toBeLessThanOrEqual(320);
      // Rounding to whole pixels costs a little precision on extreme ratios.
      expect(r.tw / r.th, `${c.label}: aspect ratio not preserved`).toBeCloseTo(c.w / c.h, 1);
    }
  });

  // ---- TC-AI-042-08 --------------------------------------------------------
  test("TC-AI-042-08: a pre-existing placeholder thumbnail still renders (no backfill expected)", async ({
    page,
  }) => {
    // Designs saved before this story keep their grey placeholder — a backfill
    // was explicitly out of scope. This guards against the opposite failure:
    // an old row rendering as a broken image or crashing the grid.
    const name = `legacy-${Date.now()}`;
    const id = await page.evaluate(async (n) => {
      const statePath = "/src/lib/canvasState.ts";
      const cs = await import(/* @vite-ignore */ statePath);
      const placeholder = cs.generateThumbnailSync();
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
          thumbnail: placeholder,
          canvasData: { version: "1.0", elements: [], canvasWidth: 1200, canvasHeight: 800, backgroundColor: "#FFFFFF", zoom: 1 },
          tags: [],
          visibility: "private",
        }),
      });
      if (!res.ok) return null;
      return (await res.json())?.id ?? null;
    }, name);
    test.skip(!id, "Could not create the legacy-thumbnail fixture");

    try {
      await page.goto("/templates", { waitUntil: "load" });
      const card = page.locator(".glass.rounded-2xl").filter({ hasText: name });
      await expect(card).toHaveCount(1, { timeout: 20_000 });

      // The image element exists and decoded — a broken src would leave
      // naturalWidth at 0.
      const ok = await card.locator("img").first().evaluate(
        (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
      );
      expect(ok, "legacy placeholder thumbnail failed to render").toBe(true);
    } finally {
      await page.evaluate(async (tid) => {
        await fetch(`/api/v1/canvas-templates/${tid}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}` },
        }).catch(() => {});
      }, id);
    }
  });
});
