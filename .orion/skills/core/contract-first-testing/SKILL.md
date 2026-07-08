---
name: contract-first-testing
version: 1.0.0
description: >
  Define the exact contract (specific value, specific location) before writing any test.
  Tests must assert what IS expected at a precise location — not the absence of
  something across a broad surface area.
triggers:
  - "write test"
  - "add test"
  - "verify that"
  - "make a test"
  - "test that"
domains:
  - testing
---

# Skill: contract-first-testing

## Problem

Tests that don't have a precise contract become noise. They pass when they shouldn't, fail for reasons unrelated to the change, or check the absence of things rather than the presence of expected values.

**Bad test** — checks the absence of a known-bad value:
```ts
expect(button.style.color).not.toBe('teal')
```

**Good test** — checks the presence of the expected value at a precise location:
```ts
expect(button).toHaveCSS('background-color', 'rgb(12, 160, 235)')
```

## Protocol

### Step 1 — Identify the Contract

Before writing any test, answer these three questions:

1. **What specific value is expected?** (a hex color, a string, a number, a state)
2. **At what specific location?** (a CSS property, a function return, a DOM attribute, a DB field)
3. **Under what specific condition?** (after which user action, with what input, in what state)

If you can't answer all three, the test isn't ready to be written. Read the STORY.md acceptance criterion until you can.

### Step 2 — Write the Contract First

In a comment above the test:

```ts
// Contract:
//   Expected value: "#0ca0eb" (primary blue from design tokens)
//   Location: background-color of <button data-testid="generate-btn">
//   Condition: when page is in light mode, no hover
test('Generate button uses primary blue in light mode', async ({ page }) => {
  // ...
})
```

### Step 3 — Assert the Contract Exactly

```ts
test('Generate button uses primary blue in light mode', async ({ page }) => {
  await page.goto('/editor')
  const btn = page.getByTestId('generate-btn')
  await expect(btn).toHaveCSS('background-color', 'rgb(12, 160, 235)')
})
```

## Rules

| Rule | Why |
|------|-----|
| **Test the value, not the absence** | "not.toBe('teal')" passes for any non-teal value including wrong ones |
| **Pin to a precise selector** | `getByTestId` over `getByRole('button')` when multiple buttons exist |
| **Pin to a precise property** | `toHaveCSS('background-color')` over generic visual check |
| **Pin to a precise condition** | Specify viewport, theme, auth state — anything that affects the result |
| **Re-run baseline before failure analysis** | Confirm the test fails for the reason you think |
| **One assertion per behavior** | Don't bundle 5 ACs into one test — debugging gets harder |

## When to Apply This Skill

Apply this skill BEFORE writing:
- Unit tests
- Integration tests
- E2E tests
- Snapshot tests
- Visual regression tests

## Anti-Patterns

| ❌ Anti-pattern | ✅ Correction |
|----------------|--------------|
| `expect(value).not.toBe(wrong)` | `expect(value).toBe(expected)` |
| `expect(element).toBeVisible()` (for design-token tests) | `expect(element).toHaveCSS('color', 'rgb(...)')` |
| `expect(response.status).toBe(200)` (without checking body) | Check status AND key body fields |
| `expect(mockFn).toHaveBeenCalled()` (without args) | Check it was called with the expected args |
| Snapshot tests for design tokens | Explicit CSS property assertions |

## Hand-off

This skill is read by `unit-test-agent` and `e2e-test-agent` before they write any test. They follow this protocol.

---

*Skill version: 1.0.0 | Created: 2026-05-18*
