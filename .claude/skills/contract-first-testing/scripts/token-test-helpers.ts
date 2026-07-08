/**
 * token-test-helpers.ts — contract-first-testing skill
 * =============================================================================
 * Playwright helper functions for contract-first CSS token and style testing.
 *
 * SKILL RULE: Always use these helpers instead of:
 *   ❌ Scanning document.styleSheets for a string
 *   ❌ Checking element.className for a style
 *   ❌ Using page.evaluate to read CSS inline
 *
 * These helpers pin the exact read path (computed style at a specific location)
 * so tests assert the real contract, not a broad surface area.
 *
 * Import in E2E test files:
 *   import { getCSSToken, getComputedStyleProp, setTheme, assertToken }
 *     from '../skills/contract-first-testing/scripts/token-test-helpers';
 * =============================================================================
 */

import { Page } from '@playwright/test';

// =============================================================================
// CSS Token Helpers
// =============================================================================

/**
 * Read a CSS custom property value from :root computed style.
 *
 * This is the ONLY correct way to test design tokens.
 * Do NOT use document.styleSheets — it scans all rules and causes false positives
 * when a banned value appears in an unrelated utility class.
 *
 * @param page     Playwright Page
 * @param token    CSS custom property name (e.g. '--primary', '--background')
 * @returns        Trimmed computed value string
 *
 * @example
 *   const primary = await getCSSToken(page, '--primary');
 *   expect(primary).toContain('207'); // blue hue, not teal (174)
 */
export async function getCSSToken(page: Page, token: string): Promise<string> {
  return page.evaluate((t: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(t).trim()
  , token);
}

/**
 * Read the computed CSS property of a specific DOM element.
 *
 * Use this instead of checking className — className shows the class list,
 * not what the browser actually renders after cascade resolution.
 *
 * @param page      Playwright Page
 * @param selector  CSS selector for the target element
 * @param property  CSS property name (e.g. 'background-color', 'color', 'font-family')
 * @returns         Trimmed computed value string
 *
 * @example
 *   const bg = await getComputedStyleProp(page, '[data-testid="primary-btn"]', 'background-color');
 *   expect(bg).toBe('rgb(12, 160, 235)');
 */
export async function getComputedStyleProp(
  page: Page,
  selector: string,
  property: string
): Promise<string> {
  return page.evaluate(
    ({ sel, prop }: { sel: string; prop: string }) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`[token-test-helpers] Element not found: "${sel}"`);
      return getComputedStyle(el).getPropertyValue(prop).trim();
    },
    { sel: selector, prop: property }
  );
}

// =============================================================================
// Theme Control
// =============================================================================

/**
 * Set the app theme and fully reload the page.
 *
 * Uses localStorage key 'theme' which the app reads on mount.
 * Always call this in test.beforeEach or at the start of a theme-specific test.
 *
 * @param page   Playwright Page
 * @param theme  'light' | 'dark'
 *
 * @example
 *   test.beforeEach(async ({ page }) => {
 *     await setTheme(page, 'dark');
 *   });
 */
export async function setTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.evaluate((t: string) => {
    localStorage.setItem('theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, theme);
  await page.reload();
  await page.waitForLoadState('networkidle');
}

// =============================================================================
// Assertion Helpers
// =============================================================================

/**
 * Assert a CSS token contains an expected substring with a descriptive error.
 *
 * Prefer this over bare expect() for CSS tokens — the error message includes
 * the token name, expected value, and actual value so failures self-document.
 *
 * @param page               Playwright Page
 * @param token              CSS custom property name (e.g. '--primary')
 * @param expectedSubstring  String the computed value must contain
 * @param description        Human-readable description for error messages
 *
 * @example
 *   await assertToken(page, '--primary', '207', 'light mode primary must be blue hue 207');
 */
export async function assertToken(
  page: Page,
  token: string,
  expectedSubstring: string,
  description: string
): Promise<void> {
  const value = await getCSSToken(page, token);
  if (!value.includes(expectedSubstring)) {
    throw new Error(
      `[contract-first-testing] FAIL — ${description}\n` +
      `  Token   : ${token}\n` +
      `  Expected: to contain "${expectedSubstring}"\n` +
      `  Actual  : "${value}"\n` +
      `  Hint    : Check that the file defining this token is actually imported\n` +
      `            and not overridden by a later :root block.`
    );
  }
}

/**
 * Assert a CSS token does NOT contain a banned substring.
 * Use sparingly — prefer asserting the CORRECT value over asserting absence.
 *
 * @example
 *   await assertTokenNot(page, '--primary', '174', 'primary must not be teal hue 174');
 */
export async function assertTokenNot(
  page: Page,
  token: string,
  bannedSubstring: string,
  description: string
): Promise<void> {
  const value = await getCSSToken(page, token);
  if (value.includes(bannedSubstring)) {
    throw new Error(
      `[contract-first-testing] FAIL — ${description}\n` +
      `  Token   : ${token}\n` +
      `  Must NOT contain: "${bannedSubstring}"\n` +
      `  Actual  : "${value}"`
    );
  }
}

/**
 * Assert a DOM element is visible and has a non-zero bounding box.
 * Use for z-index regression tests (dropdowns, modals, panels).
 *
 * @example
 *   await assertElementVisible(page, '[data-testid="account-dropdown"]');
 */
export async function assertElementVisible(page: Page, selector: string): Promise<void> {
  const el = page.locator(selector);
  await el.waitFor({ state: 'visible', timeout: 5000 });
  const box = await el.boundingBox();
  if (!box || box.width === 0 || box.height === 0) {
    throw new Error(
      `[contract-first-testing] Element is in DOM but has zero size: "${selector}"\n` +
      `  This often means a z-index or display:none issue.`
    );
  }
}

/**
 * Read multiple CSS tokens at once and return as a record.
 * Useful when a test needs to verify multiple related tokens together.
 *
 * @example
 *   const tokens = await getCSSTokens(page, ['--primary', '--secondary', '--background']);
 *   expect(tokens['--primary']).toContain('207');
 */
export async function getCSSTokens(
  page: Page,
  tokens: string[]
): Promise<Record<string, string>> {
  return page.evaluate((tokenList: string[]) => {
    const style = getComputedStyle(document.documentElement);
    return tokenList.reduce((acc, t) => {
      acc[t] = style.getPropertyValue(t).trim();
      return acc;
    }, {} as Record<string, string>);
  }, tokens);
}
