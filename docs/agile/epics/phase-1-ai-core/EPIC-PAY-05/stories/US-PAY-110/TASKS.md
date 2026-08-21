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

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md filled
- [ ] **Muscle** — T1-T3 with exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded

---

## PR Scope Summary

**One-liner:** Checkout resolves price server-side and passes offer_id to Razorpay — never trusts a client-computed discount.

```
feat(pay): resolve price server-side, pass offer_id at checkout — US-PAY-110
```

---

## Task Breakdown

### T1 — createSubscription() uses getEffectivePrice() + offer_id
- **File:** `api/src/modules/payments/services/payments.service.ts`
- **Type:** `feat`
- **AC(s) covered:** AC1, AC2, AC3
- **Changes:**
  - `createSubscription()` calls `getEffectivePrice(tier, interval)` server-side, ignoring any
    client-supplied price field entirely
  - If a campaign is active and covers the requested tier, pass `offer_id` in the Razorpay
    subscription-creation payload
  - If the active campaign does not cover the requested tier, do not pass an `offer_id` (regular
    price applies) — reject only if the *client* explicitly requested a specific offer_id not valid
    for that tier

**Commit:**
```bash
git add api/src/modules/payments/services/payments.service.ts
git commit -m "feat(pay): resolve price server-side, pass offer_id at checkout — US-PAY-110"
```

---

### T2 — Atomic redemption increment
- **File:** `api/src/modules/payments/services/pricing-campaign.service.ts`
- **Type:** `feat`
- **AC(s) covered:** AC4
- **Changes:**
  - `incrementRedemption(campaignId)` — atomic `UPDATE ... SET redemptionsUsed = redemptionsUsed + 1
    WHERE id = ? AND redemptionsUsed < maxRedemptions RETURNING *` (or Prisma transaction
    equivalent), called on successful subscription creation only

**Commit:**
```bash
git add api/src/modules/payments/services/pricing-campaign.service.ts
git commit -m "feat(pay): atomic redemption-count increment — US-PAY-110"
```

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

- [ ] T1 — server-side price resolution + offer_id (file: `payments.service.ts`, type: `feat`)
- [ ] T2 — atomic redemption increment (file: `pricing-campaign.service.ts`, type: `feat`)
- [ ] T3 — unit tests (file: `payments.service.spec.ts`, type: `test`)
- [ ] Gate 1 passes ✅
- [ ] Gate 4 passes ✅
- [ ] Manual test verified ✅ (real staging checkout under active campaign)
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs ticked off ✅
- [ ] EPIC.md "Implementation Update" log appended ✅

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
