/**
 * US-AI-039 — Format Picker: Canva-style single-modal reorg
 *
 * First automated coverage of this component (AC9). Existing specs reach the
 * editor via direct page.goto("/editor") and bypass the format picker entirely
 * — confirmed by grep: none reference this flow.
 *
 * Covers:
 *   TC-AI-039-01  Rail shows all platform groups + Custom size, no Continue button
 *   TC-AI-039-02  Click "Facebook" in rail → Facebook tiles appear inline
 *   TC-AI-039-03  Click a tile → canvas created immediately, no library step
 *   TC-AI-039-04  Click "Custom size" in rail → form appears; submit 900×1200 → editor
 *
 * Run:
 *   npx playwright test e2e/us-ai-039-format-picker-reorg.spec.ts --headed
 *   TEST_USER_EMAIL=x TEST_USER_PASSWORD=y npx playwright test e2e/us-ai-039-format-picker-reorg.spec.ts
 */

import { test, expect } from "@playwright/test";
import process from "node:process";

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

// Auth helper — reused from qa-canvas-editor.spec.ts fixture pattern.
async function ensureLoggedIn(page: import("@playwright/test").Page) {
  const res = await page.goto("/my-designs", { waitUntil: "load" });
  if (!res || !res.ok()) {
    throw new Error(
      `Cannot load /my-designs (HTTP ${res?.status() ?? "no response"}). ` +
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
    await page.goto("/my-designs", { waitUntil: "load" });

    // A 401 before login sets `redirect_to_auth=1` (queryClient.ts:17), which
    // useRedirectToAuthOnLoad consumes on the NEXT full page load — the goto
    // above. So a successful login can still land back on /auth with the flag
    // already cleared, leaving no "New Design" button to click. Same trap fixed
    // in the 040 and 042 specs.
    if (page.url().includes("/auth")) {
      await page.evaluate(() => localStorage.removeItem("redirect_to_auth"));
      await page.goto("/my-designs", { waitUntil: "load" });
    }
    await expect(page, "still on /auth after login — session did not stick")
      .not.toHaveURL(/\/auth/, { timeout: 15_000 });
  }
}

// Opens the Format Picker via the "New Design" button on /my-designs.
async function openFormatPicker(page: import("@playwright/test").Page) {
  // Ensure on My Designs page (auth guard may have redirected there already).
  if (!page.url().includes("/my-designs")) {
    await page.goto("/my-designs", { waitUntil: "load" });
  }
  const newDesign = page.getByRole("button", { name: "New Design" });
  await expect(newDesign, "New Design button not found on /my-designs").toBeVisible({
    timeout: 20_000,
  });
  await newDesign.click();
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// US-AI-039 — Format Picker reorg
// ---------------------------------------------------------------------------
test.describe("US-AI-039: Format Picker — Canva-style single-modal reorg", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    // The picker persists the last-used format and pre-selects its category on
    // reopen (AC5). Left alone, a tile clicked in one test changes which
    // category the NEXT test opens on — TC-01 passed in isolation but failed
    // when run after TC-03 for exactly this reason. Clear it so each test
    // starts from the taxonomy's first group.
    await page.evaluate(() => {
      Object.keys(localStorage)
        .filter((k) => k.toLowerCase().includes("format"))
        .forEach((k) => localStorage.removeItem(k));
    });
  });

  // ---- TC-AI-039-01 --------------------------------------------------------
  test(
    "TC-AI-039-01: dialog shows rail with all platform groups + Custom size, no Continue button",
    async ({ page }) => {
      await openFormatPicker(page);
      const dialog = page.getByRole("dialog");

      // Rail must contain every FORMAT_TAXONOMY platform group.
      // Matches FORMAT_TAXONOMY as it stands today. "Print" was renamed to
      // "Printables", and "For you" (curated by job) plus "WhatsApp" (India is
      // the primary market) were added when the taxonomy was reworked around
      // what a listing agent actually produces.
      const expectedCategories = [
        "For you",
        "Instagram",
        "Facebook",
        "WhatsApp",
        "Printables",
        "Email",
        "Other",
        "Custom size",
      ];
      for (const cat of expectedCategories) {
        await expect(
          dialog.getByRole("button", { name: cat }),
        ).toBeVisible({ timeout: 5_000 });
      }

      // The old step-based "Continue" button must be gone (AC1).
      await expect(
        dialog.getByRole("button", { name: "Continue" }),
      ).not.toBeVisible();
    },
  );

  // ---- TC-AI-039-02 --------------------------------------------------------
  test(
    "TC-AI-039-02: clicking Facebook in rail shows Facebook format tiles inline",
    async ({ page }) => {
      await openFormatPicker(page);
      const dialog = page.getByRole("dialog");

      // Click "Facebook" in the rail.
      await dialog.getByRole("button", { name: "Facebook" }).click();

      // Facebook-specific tiles must appear inside the same dialog (AC2).
      // "Post" and "Cover" are unique to the Facebook group in the taxonomy.
      await expect(
        dialog.getByRole("button", { name: "Cover" }),
      ).toBeVisible({ timeout: 5_000 });

      // Dialog must still be open — no step transition (AC1).
      await expect(dialog).toBeVisible();

      // No "Continue" button (AC1 — regression check).
      await expect(
        dialog.getByRole("button", { name: "Continue" }),
      ).not.toBeVisible();
    },
  );

  // ---- TC-AI-039-03 --------------------------------------------------------
  //
  // REWRITTEN 2026-08-02. This previously asserted that clicking a format tile
  // revealed an inline "Start Blank" + library grid without navigating. That
  // behaviour was deliberately REMOVED after US-AI-039 shipped: the library
  // queried getByFormatTag() for every format, every seeded template carried
  // tags: [], so the panel flashed a loading skeleton and then hid itself on
  // every single tile click. The picker is now format-only and template
  // selection moved to the editor's left rail (TemplatesPanel).
  //
  // The old assertion is not "fixed" here — it described a requirement that no
  // longer exists. The replacement asserts the behaviour that actually shipped.
  test(
    "TC-AI-039-03: selecting a format tile creates the canvas immediately (no library step)",
    async ({ page }) => {
      await openFormatPicker(page);
      const dialog = page.getByRole("dialog");

      await dialog.getByRole("button", { name: "Facebook" }).click();

      // Choosing a format is now the whole interaction — it opens the editor.
      await dialog.getByRole("button", { name: "Cover" }).click();
      await expect(page).toHaveURL(/\/editor/, { timeout: 15_000 });

      // And the removed intermediate step must not come back.
      await expect(
        page.getByRole("button", { name: "Start Blank" }),
      ).toHaveCount(0);
    },
  );

  // ---- TC-AI-039-04 --------------------------------------------------------
  test(
    "TC-AI-039-04: Custom size rail item → submit 900×1200 → editor opens",
    async ({ page }) => {
      await openFormatPicker(page);
      const dialog = page.getByRole("dialog");

      // Click "Custom size" in the rail (AC4).
      await dialog.getByRole("button", { name: "Custom size" }).click();

      // Width/height inputs must be visible inside the same dialog.
      await expect(dialog.locator("#custom-width")).toBeVisible({
        timeout: 5_000,
      });
      await expect(dialog.locator("#custom-height")).toBeVisible();

      // No "Continue" button gating the form (AC1).
      await expect(
        dialog.getByRole("button", { name: "Continue" }),
      ).not.toBeVisible();

      // Fill in dimensions.
      await dialog.locator("#custom-width").fill("900");
      await dialog.locator("#custom-height").fill("1200");

      // Submit — should close dialog and navigate to the editor.
      // Button label changed from "Start with this size" to "Create design"
      // when the custom-size pane was reworked to the Canva-style centred form.
      await dialog.getByRole("button", { name: "Create design" }).click();

      await expect(page).toHaveURL(/\/editor/, { timeout: 15_000 });
    },
  );
  // ---- TC-AI-039-05 --------------------------------------------------------
  //
  // The next three were ported from e2e/us-ai-038-format-picker.spec.ts, which
  // lived only on an unpushed branch and was written against the pre-reorg
  // 3-step wizard. Most of it described removed behaviour (the library step,
  // the "Continue" button), but these three cover current ACs that had no
  // automated coverage at all — so the coverage was rescued rather than the
  // file.
  test("TC-AI-039-05: both New Design and New Template open the same picker (AC8)", async ({
    page,
  }) => {
    // Entry point 1 — My Designs.
    await openFormatPicker(page);
    await expect(page.getByRole("dialog").getByRole("heading", { name: /choose a format/i }))
      .toBeVisible({ timeout: 8_000 });
    await page.keyboard.press("Escape");

    // Entry point 2 — the gallery. Renamed from "Create Blank" to
    // "New Template" so the two entries read as a pair.
    await page.goto("/templates", { waitUntil: "load" });
    await page.getByRole("button", { name: "New Template" }).click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: /choose a format/i }))
      .toBeVisible({ timeout: 8_000 });
  });

  // ---- TC-AI-039-06 --------------------------------------------------------
  test("TC-AI-039-06: reopening the picker pre-selects the last-used format (AC5)", async ({
    page,
  }) => {
    await openFormatPicker(page);
    const dialog = page.getByRole("dialog");

    // Pick something outside the taxonomy's first group so a default cannot
    // masquerade as a restored selection.
    await dialog.getByRole("button", { name: "Facebook" }).click();
    await dialog.getByRole("button", { name: "Cover" }).click();
    await expect(page).toHaveURL(/\/editor/, { timeout: 15_000 });

    // Reopen: the rail should land on Facebook, not the first group.
    await page.goto("/my-designs", { waitUntil: "load" });
    await page.getByRole("button", { name: "New Design" }).click();
    const reopened = page.getByRole("dialog");
    await expect(reopened).toBeVisible({ timeout: 8_000 });
    await expect(
      reopened.getByRole("button", { name: "Facebook" }),
      "Facebook rail item should be the active one after reopen",
    ).toHaveAttribute("aria-pressed", "true");
  });

  // ---- TC-AI-039-07 --------------------------------------------------------
  test("TC-AI-039-07: the picker shows no pixel dimensions or aspect ratios (AC7)", async ({
    page,
  }) => {
    await openFormatPicker(page);
    const dialog = page.getByRole("dialog");

    // Walk every rail category, not just the default one — a leak in a single
    // group would otherwise go unnoticed.
    for (const cat of ["For you", "Instagram", "Facebook", "WhatsApp", "Printables", "Email", "Other"]) {
      await dialog.getByRole("button", { name: cat }).click();
      const text = (await dialog.textContent()) ?? "";
      expect(text, `"${cat}" pane must not show a ratio`).not.toMatch(/\d+\s*:\s*\d+/);
      expect(text, `"${cat}" pane must not show pixel dimensions`).not.toMatch(/\d{3,}\s*[x×]\s*\d{3,}/);
      expect(text, `"${cat}" pane must not show DPI`).not.toMatch(/DPI/i);
    }
  });
});
