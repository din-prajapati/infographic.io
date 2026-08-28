---
title: PR Task List — US-PAY-110
type: template
tags: [orion, template]
updated: 2026-08-21
---

# PR Task List — US-PAY-110

> **Story:** [STORY.md](./STORY.md)
> **Milestone branch:** `feat/pay/m-01-pricing-relaunch`
> **PR:** #_____
> **Linear:** LIN-XXX

---

> ⚠️ **Rescoped 2026-08-27.** The `offer_id` mechanism below was replaced by promo Plan selection
> when the pricing module was simplified. T1 is rewritten, T2/T3 are done. See STORY.md
> "What 2026-08-27 changed".

## Four Pillars Pre-flight

- [x] **Brain** — STORY.md filled, ACs rewritten to the implemented mechanism
- [x] **Muscle** — T1-T3 below with exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) — needs the `RAZORPAY_PLAN_<TIER>_<INTERVAL>_<CODE>` pattern added

---

## PR Scope Summary

**One-liner:** Checkout resolves price server-side and selects the promo's own Razorpay Plan — never trusts a client-computed discount, never falls back to list price under a promo.

```
feat(pay): select the promo Plan at checkout + close the redemption cap — US-PAY-110
```

---

## Task Breakdown

### ~~T1 — createSubscription() uses getEffectivePrice() + offer_id~~ → **T1′ (done)**
- **File:** `api/src/modules/payments/services/payments.service.ts`
- **Type:** `feat`
- **AC(s) covered:** AC1′, AC2, AC3
- **Superseded:** Razorpay Offers are not used. A promo is a separate price-immutable Plan object,
  so there is nothing to pass an `offer_id` for.
- **Changes as implemented:**
  - [x] `createSubscription()` calls `getEffectivePrice(tier, interval)` server-side, ignoring any
        client-supplied price field entirely
  - [x] `getExternalPlanId()` gained a promo dimension — resolves
        `RAZORPAY_PLAN_<TIER>_<INTERVAL>_<CAMPAIGN_CODE>` when a promo applies
  - [x] The old `CAMPAIGN_NOT_APPLICABLE_AT_CHECKOUT` guard inverted into
        `PROMO_PLAN_NOT_CONFIGURED` — blocks when a promo price is advertised with no Plan behind
        it, rather than silently charging list

---

### T2 — Atomic redemption increment ✅ **done**
- **File:** `api/src/modules/payments/services/pricing-campaign.service.ts`
- **Type:** `feat`
- **AC(s) covered:** AC4
- **Changes as implemented:**
  - [x] `tryConsumeRedemption(code)` — conditional `updateMany` with the cap in the `WHERE` clause
        (`redemptionsUsed < maxRedemptions`, or `maxRedemptions IS NULL`), returning whether it was
        consumed. Postgres serialises the conditional update, so no transaction or row lock is
        needed and none is held across the provider call.
  - [x] Called from `PaymentsService` after a promo-priced subscription is created. Non-fatal on
        failure — the subscription already exists, and failing the request would tell a customer
        their checkout failed when it did not.
  - **Why this mattered:** `redemptionsUsed` was read to enforce the cap and written **nowhere** in
    the codebase. A "Founding 100" campaign would never have stopped at 100.

---

### T3 — Unit tests
- **File:** `api/tests/payments/payments.service.spec.ts` (extend)
- **Type:** `test`
- **AC(s) covered:** AC1, AC2, AC3, AC4
- **Changes:**
  - Cover TC-PAY-110-01 through 04, including a concurrency test for AC4 (two near-simultaneous
    calls near the cap)

**Commit:**
```bash
git add api/tests/payments/payments.service.spec.ts
git commit -m "test(pay): cover server-side price resolution and offer_id checkout — US-PAY-110"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `payments.service.ts` | T1 | AC1-3 | |
| `pricing-campaign.service.ts` | T2 | AC4 | atomic increment |
| `payments.service.spec.ts` | T3 | AC1-4 | includes concurrency test |

---

## Exact Test Commands

```bash
npm run check
cd api && npx vitest run tests/payments/payments.service.spec.ts --reporter=verbose
```

---

## Task Checklist

- [x] T1′ — server-side price resolution + **promo Plan selection** (file: `payments.service.ts`,
      type: `feat`) — `offer_id` half superseded 2026-08-27, see the task breakdown above
- [x] T2 — atomic redemption increment (file: `pricing-campaign.service.ts`, type: `feat`)
- [x] T3 — unit tests (files: `payments.service.spec.ts`, `pricing-campaign.service.spec.ts`,
      `pricing-resolution.service.spec.ts`, type: `test`)
- [x] Gate 1 passes ✅ — `npm run check` (0 errors) + `npm run test:unit` (426/426 backend,
      14/14 frontend suites), 2026-08-27
- [ ] Gate 4 passes — not separately run this pass
- [ ] Manual test verified — **cannot run yet**: requires an active campaign, which requires an
      authored founding price and its 4 annual promo Plan objects. None exist. Blocked on a product
      decision, not on engineering
- [ ] PR opened with story card as description — pending (milestone PR)
- [x] STORY.md ACs ticked off ✅ — AC1 void/replaced by AC1′; AC1′/AC2/AC3/AC4 all implemented
- [ ] EPIC.md "Implementation Update" log appended

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT accept any client-supplied price or discount amount, ever, at any point in this flow —
  this is the single most security-sensitive story in the epic.
- Do NOT increment `redemptionsUsed` non-atomically (read-then-write) — that's a real race condition
  under concurrent checkout near the cap.

---

*Tasks created: 2026-08-21*
