---
title: PR Task List — US-PAY-104
type: template
tags: [orion, template]
updated: 2026-08-21
---

# PR Task List — US-PAY-104

> **Story:** [STORY.md](./STORY.md)
> **Milestone branch:** `feat/pay/m-01-pricing-relaunch`
> **PR:** #_____
> **Linear:** LIN-XXX

---

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md filled
- [ ] **Muscle** — T1-T2 with exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded

---

## PR Scope Summary

**One-liner:** Fix hardcoded price-text drift bug in the test-mode banner.

```
fix(pay): derive PricingPage test-mode banner text from PLAN_CONFIG — US-PAY-104
```

---

## Task Breakdown

### T1 — Replace hardcoded banner string
- **File:** `client/src/pages/PricingPage.tsx`
- **Type:** `fix`
- **AC(s) covered:** AC1, AC4
- **Changes:**
  - Replace literal string at ~lines 468-469 with a template reading `PLAN_CONFIG.SOLO.price` /
    `PLAN_CONFIG.TEAM.price`, formatted through the page's existing paise→rupee helper

**Commit:**
```bash
git add client/src/pages/PricingPage.tsx
git commit -m "fix(pay): derive test-mode banner text from PLAN_CONFIG — US-PAY-104"
```

---

### T2 — Regression test
- **File:** `client/src/pages/__tests__/PricingPage.spec.tsx` (extend or create)
- **Type:** `test`
- **AC(s) covered:** AC2
- **Changes:**
  - Mock `PLAN_CONFIG` with a different SOLO price, assert the rendered banner reflects it

**Commit:**
```bash
git add client/src/pages/__tests__/PricingPage.spec.tsx
git commit -m "test(pay): assert banner text tracks PLAN_CONFIG changes — US-PAY-104"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `PricingPage.tsx` | T1 | AC1, AC4 | |
| `PricingPage.spec.tsx` | T2 | AC2 | |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit:client
```

---

## Task Checklist

- [ ] T1 — replace hardcoded string (file: `PricingPage.tsx`, type: `fix`)
- [ ] T2 — regression test (file: `PricingPage.spec.tsx`, type: `test`)
- [ ] Gate 1 passes ✅
- [ ] Gate 2 passes ✅
- [ ] Manual test verified ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs ticked off ✅
- [ ] EPIC.md "Implementation Update" log appended ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT redesign the pricing cards while in this file — that's US-PAY-112. Touch only the banner
  text.

---

*Tasks created: 2026-08-21*
