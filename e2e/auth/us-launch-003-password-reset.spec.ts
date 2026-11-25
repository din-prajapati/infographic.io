/**
 * US-LAUNCH-003 — Forgot / reset password flow (E2E)
 *
 * Public pages, no auth. Split by DB dependency:
 *
 *   Runnable now (no DB): page rendering, the login→forgot link, client-side
 *   validation, and forgot-password for an UNKNOWN email — which returns a
 *   generic 200 without ever touching the PasswordResetToken table.
 *
 *   SKIPPED until deploy: the full happy path (request → real emailed token →
 *   reset → re-login) needs the PasswordResetToken table, created by
 *   `prisma db push` (railway.json `db:deploy`). Un-skip TC-LAUNCH-003-05 once
 *   the table exists in the target environment.
 *
 * Run: npx playwright test e2e/us-launch-003-password-reset.spec.ts
 */
import { test, expect } from "@playwright/test";

test.describe("US-LAUNCH-003 — forgot/reset password", () => {
  // AC4 — "Forgot Password?" on the login form navigates to /auth/forgot
  test("TC-LAUNCH-003-04a [P1] login 'Forgot Password?' → /auth/forgot", async ({ page }) => {
    await page.goto("/auth", { waitUntil: "load" });
    await page.getByTestId("link-forgot-password").click();
    await expect(page).toHaveURL(/\/auth\/forgot$/);
    await expect(page.getByTestId("input-forgot-email")).toBeVisible();
  });

  // AC1 (no-enumeration UX) — unknown email → generic "check your email", no DB row
  test("TC-LAUNCH-003-04b [P1] forgot page: unknown email → generic 'check your email'", async ({ page }) => {
    await page.goto("/auth/forgot", { waitUntil: "load" });
    await page.getByTestId("input-forgot-email").fill(`nobody-${Date.now()}@example.com`);
    await page.getByTestId("button-forgot-submit").click();
    await expect(page.getByTestId("forgot-sent")).toBeVisible();
    await expect(page.getByText(/check your email/i)).toBeVisible();
  });

  // AC4 — reset page without a token shows the invalid-link state
  test("TC-LAUNCH-003-04c [P1] reset page with no token → invalid-link state", async ({ page }) => {
    await page.goto("/auth/reset", { waitUntil: "load" });
    await expect(page.getByTestId("reset-no-token")).toBeVisible();
    await expect(page.getByText(/invalid reset link/i)).toBeVisible();
  });

  // AC4 — reset page with a token shows the form; client validation gates submit
  test("TC-LAUNCH-003-04d [P1] reset page with token: form renders, mismatch disables submit", async ({ page }) => {
    await page.goto("/auth/reset?token=ui-only-dummy-token", { waitUntil: "load" });
    await expect(page.getByTestId("input-reset-password")).toBeVisible();

    await page.getByTestId("input-reset-password").fill("newpass123");
    await page.getByTestId("input-reset-confirm").fill("different");
    await expect(page.getByText(/passwords don't match/i)).toBeVisible();
    await expect(page.getByTestId("button-reset-submit")).toBeDisabled();

    // matching + length ok → enabled
    await page.getByTestId("input-reset-confirm").fill("newpass123");
    await expect(page.getByTestId("button-reset-submit")).toBeEnabled();
  });

  // AC1-AC3 full flow — BLOCKED until the PasswordResetToken table exists (deploy).
  // Un-skip after `prisma db push` runs in the target env.
  test.skip("TC-LAUNCH-003-05 [P0][BLOCKED-UNTIL-DEPLOY] request → emailed token → reset → re-login", async () => {
    // Prereqs: PasswordResetToken table (prisma db push, run by railway.json db:deploy);
    //          a seeded local-password test account; access to the emailed reset link
    //          (EmailService dev-fallback logs the full link to the server console).
    // Steps:
    //   1. /auth/forgot → submit the seeded account's email
    //   2. read the reset link (token) from the server console log
    //   3. /auth/reset?token=<token> → set a new password
    //   4. login with the new password succeeds; the old password fails
  });
});
