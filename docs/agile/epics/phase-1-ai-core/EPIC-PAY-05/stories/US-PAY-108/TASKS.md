---
title: PR Task List — US-PAY-108
type: template
tags: [orion, template]
updated: 2026-08-21
---

# PR Task List — US-PAY-108

> **Story:** [STORY.md](./STORY.md)
> **Milestone branch:** `feat/pay/m-01-pricing-relaunch`
> **PR:** #_____
> **Linear:** LIN-XXX

---

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md filled
- [ ] **Muscle** — T1-T3 with exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded — **HUMAN TASK first**: create 4 Razorpay Offer
      objects (dashboard) before this story can complete AC3

---

## PR Scope Summary

**One-liner:** Seed the Founding Customer 100 campaign as the first real PricingCampaign row.

```
feat(pay): seed Founding Customer 100 campaign — US-PAY-108
```

---

## Task Breakdown

### T0 — HUMAN: create Razorpay Offer objects
- Not a code task. Create 4 Offer objects in the Razorpay dashboard (SOLO/PRO/TEAM/AGENCY, "Forever"
  duration for the subscription's life, correct percentage per tier). Record the 4 `offer_...` IDs
  for T1.

---

### T1 — Seed script
- **File:** `api/prisma/seed-founding-campaign.ts`
- **Type:** `feat`
- **AC(s) covered:** AC1, AC4
- **Changes:**
  - Insert one `PricingCampaign` row: `code: "FOUNDING100"`, exact tierDiscounts per STORY.md AC4,
    `maxRedemptions: 100`, `isActive: true`
  - Uses `RAZORPAY_OFFER_FOUNDING_*` env vars (from T0) for `razorpayOfferId` values, never
    hardcoded literals

**Commit:**
```bash
git add api/prisma/seed-founding-campaign.ts
git commit -m "feat(pay): seed Founding Customer 100 PricingCampaign — US-PAY-108"
```

---

### T2 — Document env vars
- **File:** `.env.example`
- **Type:** `docs`
- **AC(s) covered:** AC3
- **Changes:**
  - Add `RAZORPAY_OFFER_FOUNDING_SOLO/PRO/TEAM/AGENCY` with comments, matching ENV.yaml

**Commit:**
```bash
git add .env.example
git commit -m "docs(pay): document RAZORPAY_OFFER_FOUNDING_* env vars — US-PAY-108"
```

---

### T3 — Unit tests (redemption-cap fallback)
- **File:** `api/tests/payments/pricing-resolution.service.spec.ts` (extend from US-PAY-106)
- **Type:** `test`
- **AC(s) covered:** AC2
- **Changes:**
  - Add case: `redemptionsUsed === maxRedemptions` → `getEffectivePrice()` returns regular price

**Commit:**
```bash
git add api/tests/payments/pricing-resolution.service.spec.ts
git commit -m "test(pay): cover Founding-100 redemption-cap fallback — US-PAY-108"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `seed-founding-campaign.ts` | T1 | AC1, AC4 | new file |
| `.env.example` | T2 | AC3 | |
| `pricing-resolution.service.spec.ts` | T3 | AC2 | extends US-PAY-106's test file |

---

## Exact Test Commands

```bash
npm run check
cd api && npx vitest run tests/payments/pricing-resolution.service.spec.ts --reporter=verbose
# Manual: run seed script against staging DB, verify FOUNDING100 row via prisma studio
```

---

## Task Checklist

- [x] ~~T0 — HUMAN: 4 Razorpay Offer objects~~ — ❌ **RETIRED 2026-08-27, do not create them.**
      Razorpay Offers are no longer used anywhere: a promo is its own price-immutable Plan object,
      so there is nothing left for an Offer to discount. `HUMAN_TASKS.md` §7 is struck out and the
      4 `RAZORPAY_OFFER_FOUNDING_*` vars are removed from `.env.example`. Ticked as resolved
      because the task is void, not because it was performed — folded into
      `US-PAY-109`'s consolidated dashboard task, see `HUMAN_TASKS.md` #6/#7
- [x] T1 — seed script (file: `api/scripts/seed-founding-campaign.ts`, type: `feat`) — commit
      `40076f7`. **Deviation:** `api/scripts/`, not `api/prisma/` as originally listed
- [x] T2 — env docs (file: `.env.example`, type: `docs`) — commit `40a4418`
- [x] T3 — redemption-cap test — commit `47ebff8` (`pricing-resolution.service.spec.ts` +
      new `founding-campaign-pricing.spec.ts` for AC4's exact percentages)
- [x] Gate 1 passes ✅ — `npm run test:unit:backend` (410/410)
- [x] Gate 4 — **N/A**, story closed as superseded 2026-08-27 (not shipped as written)
- [x] EPIC.md "Implementation Update" log appended for the supersede decision ✅
- [ ] Manual test verified — **cannot run**: needs an authored founding price + its promo Plan
      objects, neither of which exists. Blocked on a product decision, not on engineering
- [ ] PR opened with story card as description — pending (milestone PR)
- [x] STORY.md ACs reconciled 2026-08-27 — AC2 shipped and stands; AC1 partly survives in the
      authored-price shape; **AC3 and AC4 are void** (Offers gone, percentages gone). See STORY.md
      "What 2026-08-27 changed" for the AC-by-AC table
- [x] EPIC.md "Implementation Update" log appended ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT hardcode Offer IDs as literals in the seed script — read from env vars.
- Do NOT implement redemption-count incrementing here — that's `US-PAY-110`, at real checkout time.

---

*Tasks created: 2026-08-21*
