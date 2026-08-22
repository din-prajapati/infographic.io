---
title: PR Task List — US-PAY-112
type: template
tags: [orion, template]
updated: 2026-08-21
---

# PR Task List — US-PAY-112

> **Story:** [STORY.md](./STORY.md)
> **Milestone branch:** `feat/pay/m-01-pricing-relaunch`
> **PR:** #_____
> **Linear:** LIN-XXX

---

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md filled
- [ ] **Muscle** — T1-T3 with exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded

---

## PR Scope Summary

**One-liner:** Redesign pricing cards — real-estate messaging, founding badge, Pro "Most Popular", monthly/annual toggle.

```
feat(pay): redesign pricing cards with founding badge and annual toggle — US-PAY-112
```

---

## Task Breakdown

### T1 — Pricing API endpoint (if none exists) exposing getEffectivePrice()
- **File:** `api/src/modules/payments/controllers/pricing.controller.ts` (new, if no existing
  pricing-read endpoint) or extend an existing one
- **Type:** `feat`
- **AC(s) covered:** AC1, AC3
- **Changes:**
  - `GET /api/v1/pricing` — returns `getEffectivePrice()` output for every tier × interval,
    read-only, no auth required (public pricing page)

**Commit:**
```bash
git add api/src/modules/payments/controllers/pricing.controller.ts
git commit -m "feat(pay): add public pricing-resolution endpoint — US-PAY-112"
```

---

### T2 — PricingPage.tsx card redesign
- **File:** `client/src/pages/PricingPage.tsx`
- **Type:** `feat`
- **AC(s) covered:** AC1, AC2, AC4
- **Changes:**
  - Cards for Free/Solo/Pro/Team/Agency/Enterprise per STORY.md AC1
  - Monthly/annual toggle switching displayed prices
  - Founding badge + struck-through regular price only when a campaign is active
  - Pro "MOST POPULAR" badge

**Commit:**
```bash
git add client/src/pages/PricingPage.tsx
git commit -m "feat(pay): redesign pricing cards with founding badge, toggle, Pro badge — US-PAY-112"
```

---

### T3 — LandingPage.tsx pricing section parity
- **File:** `client/src/pages/LandingPage.tsx`
- **Type:** `feat`
- **AC(s) covered:** AC1
- **Changes:**
  - Update the embedded pricing section to match `PricingPage.tsx`'s new source of truth (same
    `getEffectivePrice()` API call, same card summary)

**Commit:**
```bash
git add client/src/pages/LandingPage.tsx
git commit -m "feat(pay): update LandingPage pricing section to match relaunch — US-PAY-112"
```

---

### T4 — Tests
- **File:** `client/src/pages/__tests__/PricingPage.spec.tsx` (extend)
- **Type:** `test`
- **AC(s) covered:** AC1, AC2, AC4
- **Changes:** Cover TC-PAY-112-03

**Commit:**
```bash
git add client/src/pages/__tests__/PricingPage.spec.tsx
git commit -m "test(pay): cover pricing card rendering against getEffectivePrice() — US-PAY-112"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `pricing.controller.ts` | T1 | AC1, AC3 | new, if needed |
| `PricingPage.tsx` | T2 | AC1, AC2, AC4 | main redesign |
| `LandingPage.tsx` | T3 | AC1 | parity |
| `PricingPage.spec.tsx` | T4 | AC1, AC2, AC4 | |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
```

---

## Task Checklist

- [x] T1 — pricing API endpoint (file: `pricing.controller.ts`, type: `feat`)
- [x] T2 — card redesign (file: `PricingPage.tsx`, type: `feat`)
- [x] T3 — landing page parity (file: `LandingPage.tsx`, type: `feat`)
- [x] T4 — tests (file: `PricingPage.spec.tsx`, type: `test`)
- [x] Gate 1 passes ✅ (`npm run check` + `npm run test:unit` — 33+14 files, 663 tests green)
- [x] Gate 2 passes ✅ (card/teaser display logic unit-tested via extracted pure functions)
- [ ] Manual test verified (staging, with and without active campaign) — blocked on US-PAY-109 human task (Razorpay Plan objects) for a real checkout click-through
- [ ] PR opened with story card as description — milestone PR not yet opened
- [x] STORY.md ACs ticked off ✅
- [x] EPIC.md "Implementation Update" log appended ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT recompute discounted prices client-side — always call the pricing API / server-resolved
  value.
- Do NOT add fake countdown timers or "X spots left" unless backed by real
  `redemptionsUsed`/`maxRedemptions` data.

---

*Tasks created: 2026-08-21*
