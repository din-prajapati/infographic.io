---
title: PR Task List — US-PAY-113
type: template
tags: [orion, template]
updated: 2026-08-21
---

# PR Task List — US-PAY-113

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

**One-liner:** Mobile-responsive pricing layout, comparison section, real-estate messaging.

```
feat(pay): responsive pricing layout, comparison section, RE messaging — US-PAY-113
```

---

## Task Breakdown

### T1 — Responsive breakpoints
- **File:** `client/src/pages/PricingPage.tsx`
- **Type:** `feat`
- **AC(s) covered:** AC1
- **Changes:**
  - Tailwind responsive classes so cards stack on mobile, toggle/CTAs stay usable at 375px width

**Commit:**
```bash
git add client/src/pages/PricingPage.tsx
git commit -m "feat(pay): responsive pricing card layout for mobile — US-PAY-113"
```

---

### T2 — Comparison section + messaging
- **File:** `client/src/pages/PricingPage.tsx`
- **Type:** `feat`
- **AC(s) covered:** AC2
- **Changes:**
  - Full feature-matrix comparison table below the cards, independently rendered (doesn't break
    cards if it fails)
  - Primary/supporting messaging: "Create professional real-estate marketing creatives in minutes —
    without hiring a designer" / "AI-powered property marketing, branding and campaign creation
    built specifically for real estate"

**Commit:**
```bash
git add client/src/pages/PricingPage.tsx
git commit -m "feat(pay): add comparison section and RE-specialization messaging — US-PAY-113"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `PricingPage.tsx` | T1, T2 | AC1, AC2 | same file, two focused commits |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit:client
# Manual: resize browser to 375px width, check for horizontal scroll / broken CTAs
```

---

## Task Checklist

- [x] T1 — responsive breakpoints (file: `PricingPage.tsx`, type: `feat`)
- [x] T2 — comparison section + messaging (file: `PricingPage.tsx`, type: `feat`)
- [x] Gate 1 passes ✅ (`npm run check` + `npm run test:unit:client` — 14 files, 254 tests green)
- [x] Gate 2 passes ✅ (`buildComparisonRows()` unit-tested; 5 new tests)
- [ ] Manual test verified (mobile + desktop, staging) — deferred, needs a deployed environment + real device
- [ ] PR opened with story card as description — milestone PR not yet opened
- [x] STORY.md ACs ticked off ✅
- [x] EPIC.md "Implementation Update" log appended ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT put 20+ feature rows back onto the cards themselves — that's exactly what the comparison
  section exists to move out.
- Do NOT make unlabeled competitor-savings claims ("Save ₹40,000/month") — only illustrative,
  clearly-labeled comparisons per the PRD.

---

*Tasks created: 2026-08-21*
