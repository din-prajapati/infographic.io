---
title: Playwright Rules
type: rules
layer: testing
tech: playwright
tags: [orion, rules, testing, playwright, e2e]
updated: 2026-05-20
---

# Playwright Rules

## Conventions

- [ ] **Locators by role/label first** — `getByRole('button', { name: /save/i })`. Test IDs as last resort.
- [ ] **No `waitForTimeout`** — use `expect.poll`, `waitForResponse`, or `await locator.toBeVisible()`.
- [ ] **One user journey per spec** — login → action → assertion.
- [ ] **Hermetic data setup** — each test seeds and tears down its own state.
- [ ] **`test.use({ storageState })`** for authenticated flows — login once, reuse.

## Anti-patterns

- [ ] Don't chain unrelated user journeys — fragile, slow, hard to debug.
- [ ] Don't use CSS selectors when role/label exists — breaks on style changes.
- [ ] Don't `page.evaluate` to bypass the UI — that's testing your test, not the app.

## References

- ADRs: [docs/agile/decisions/](../../../../docs/agile/decisions/)
