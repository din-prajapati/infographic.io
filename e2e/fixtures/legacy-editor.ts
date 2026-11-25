import { test as base, expect } from '@playwright/test';

/**
 * Legacy-editor fixture (temporary — delete together with EditorLayout).
 *
 * Since 2026-11-17 every /editor URL without `editor=v3` redirects to V3, and Templates / My designs open V3 directly.
 * Specs written for the legacy editor still cover shipped code (reachable through `/editor?editor=legacy`), so this
 * fixture rewrites every in-app /editor navigation (pushState / replaceState) to `editor=legacy` before Wouter sees it.
 * Direct `page.goto('/editor…')` calls are covered too: the app's redirect uses replaceState, which is rewritten.
 *
 * No product code knows about this; it only runs inside the Playwright browser.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      const toLegacy = (url: string | URL | null | undefined) => {
        if (url === null || url === undefined) return url;
        const next = new URL(String(url), window.location.href);
        if (next.pathname !== '/editor' || next.searchParams.get('editor') === 'legacy') return url;
        next.searchParams.set('editor', 'legacy');
        return `${next.pathname}${next.search}${next.hash}`;
      };
      for (const method of ['pushState', 'replaceState'] as const) {
        const original = window.history[method].bind(window.history);
        window.history[method] = (state: unknown, unused: string, url?: string | URL | null) => original(state, unused, toLegacy(url));
      }
    });
    await use(page);
  },
});

export { expect };
export type { Page, Locator } from '@playwright/test';
