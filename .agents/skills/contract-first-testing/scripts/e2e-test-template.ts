/**
 * e2e-test-template.ts — contract-first-testing skill
 * =============================================================================
 * Copy this file and rename it for a new milestone or story E2E suite.
 *
 *   cp skills/contract-first-testing/scripts/e2e-test-template.ts \
 *      e2e/m-design-04-domain-colors.spec.ts
 *
 * Then:
 *   1. Update the describe block name and story reference
 *   2. Replace placeholder test cases with real contracts
 *   3. Follow the test ID format: TC-{STORY}-{NUMBER} [P{0|1|2}] {contract sentence}
 *   4. Run: npx playwright test e2e/<your-file>.spec.ts --reporter=list
 *
 * SKILL RULE: Write the expect() line FIRST, then fill in the read path.
 * This forces precision about what you are testing before you test it.
 * =============================================================================
 */

import { test, expect } from '@playwright/test';
import {
  getCSSToken,
  getCSSTokens,
  getComputedStyleProp,
  setTheme,
  assertToken,
  assertTokenNot,
  assertElementVisible,
} from '../skills/contract-first-testing/scripts/token-test-helpers';

// =============================================================================
// Configuration
// =============================================================================

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000';

// Page routes to test — update per story scope
const PAGES = {
  landing:   '/',
  templates: '/templates',
  editor:    '/editor',
  account:   '/account',
  pricing:   '/pricing',
};

// =============================================================================
// Suite Setup
// =============================================================================

test.describe('M-DESIGN-XX — [Milestone Name] | US-DESIGN-XXX', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL + PAGES.templates); // change to relevant page
    await page.waitForLoadState('networkidle');
  });

  // ===========================================================================
  // LIGHT MODE — Token Contracts
  // ===========================================================================

  test.describe('Light mode — CSS token contracts', () => {

    test.beforeEach(async ({ page }) => {
      await setTheme(page, 'light');
    });

    test('TC-XXX-01 [P0] --primary resolves to hue 207 (blue) in light mode', async ({ page }) => {
      // Contract: --primary token hue must be 207 (blue), not 174 (teal)
      // Read path: getComputedStyle(:root).getPropertyValue('--primary')
      const value = await getCSSToken(page, '--primary');
      expect(value, `--primary should contain '207' (blue), got: "${value}"`).toContain('207');
      expect(value, `--primary must not be teal hue 174`).not.toContain('174');
    });

    test('TC-XXX-02 [P0] --secondary resolves to amber (hue 38) in light mode', async ({ page }) => {
      const value = await getCSSToken(page, '--secondary');
      expect(value, `--secondary should contain '38' (amber), got: "${value}"`).toContain('38');
    });

    test('TC-XXX-03 [P0] --background is warm (hue 45) not cool grey in light mode', async ({ page }) => {
      const value = await getCSSToken(page, '--background');
      expect(value, `light --background should be warm (45), got: "${value}"`).toContain('45');
      expect(value, `light --background must not be cool grey (220)`).not.toContain('220');
    });

    // Add story-specific token tests here
    // Example for US-DESIGN-007 domain colors:
    // test('TC-DS-007-01 [P0] --color-domain-residential resolves in light mode', async ({ page }) => {
    //   const value = await getCSSToken(page, '--color-domain-residential');
    //   expect(value, `residential token should be defined`).toBeTruthy();
    //   expect(value, `should not be empty`).not.toBe('');
    // });

  });

  // ===========================================================================
  // DARK MODE — Token Contracts
  // ===========================================================================

  test.describe('Dark mode — CSS token contracts', () => {

    test.beforeEach(async ({ page }) => {
      await setTheme(page, 'dark');
    });

    test('TC-XXX-04 [P0] --background is warm near-black (hue 45) not navy in dark mode', async ({ page }) => {
      const value = await getCSSToken(page, '--background');
      expect(value, `dark --background should be warm (45), got: "${value}"`).toContain('45');
      expect(value, `dark --background must not be navy (228)`).not.toContain('228');
    });

    test('TC-XXX-05 [P0] --primary is still blue in dark mode (hue 207)', async ({ page }) => {
      const value = await getCSSToken(page, '--primary');
      expect(value, `dark --primary should contain '207', got: "${value}"`).toContain('207');
    });

  });

  // ===========================================================================
  // COMPONENT BEHAVIOR — Functional Contracts
  // ===========================================================================

  test.describe('Component behavior contracts', () => {

    // Example: NumberStepper min boundary
    // test('TC-XXX-06 [P1] NumberStepper does not decrement below min=0', async ({ page }) => {
    //   await page.goto(BASE_URL + PAGES.editor);
    //   await page.waitForLoadState('networkidle');
    //   const stepper = page.locator('[data-testid="beds-stepper-input"]');
    //   await expect(stepper).toHaveValue('0');
    //   await page.click('[data-testid="beds-stepper-decrement"]');
    //   await expect(stepper).toHaveValue('0'); // must not go below 0
    // });

    // Example: Dropdown z-index (not trapped by backdrop-filter)
    // test('TC-XXX-07 [P0] account dropdown is visible above header glass', async ({ page }) => {
    //   await page.goto(BASE_URL + PAGES.templates);
    //   await page.click('[data-testid="account-menu-trigger"]');
    //   await assertElementVisible(page, '[data-testid="account-dropdown"]');
    // });

    test.skip('TC-XXX-06 [P1] placeholder — replace with real behavior contract', async () => {
      // Follow the pattern above
    });

  });

  // ===========================================================================
  // AUTOMATED PASS-THROUGH: TypeScript + Unit Tests
  // (These are run via Gate 1 — verification-gates skill — not here)
  // Reference: npm run check && npm run test:unit
  // ===========================================================================

  // ===========================================================================
  // HUMAN-SKIP TESTS — require manual browser verification
  // Mark these with test.skip and document the manual check in STORY.md
  // ===========================================================================

  test.describe('Human-verified (manual)', () => {

    test.skip('TC-XXX-MANUAL-01 [P0] visual: light mode background is warm cream (no teal tint)', async () => {
      // Manual check: open localhost:5000, confirm background color looks warm cream
      // Gate 2 visual-checklist.md covers this
    });

    test.skip('TC-XXX-MANUAL-02 [P0] visual: dark mode background is warm near-black (not navy)', async () => {
      // Manual check: toggle dark mode, confirm background is warm not cool
    });

  });

});
