---
title: Story Card — US-PAY-111
type: story
tags: [orion, pay, pricing, razorpay, webhook]
updated: 2026-08-21
---

# Story Card — US-PAY-111

> **Status:** ✅ Done (code) — manual/PR still open, see TASKS.md
> **Feature:** F-PAY-03 — Billing Integration (Razorpay)
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-03-billing-integration](../../milestones/M-PAY-03-billing-integration.md)
> **Linear:** LIN-XXX
> **Size:** S
> **Created:** 2026-08-21 | **Closed:** 2026-08-22 (code) — full DoD pending

---

## Story

*As* a customer whose PRO or AGENCY payment succeeds
*I want* my subscription activated correctly by the webhook handler
*So that* my entitlements (design/editable limits) actually match what I paid for, immediately

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** The `POST /api/v1/webhooks/razorpay` handler correctly maps a
      `subscription.charged` event for a PRO or AGENCY Razorpay Plan ID to `PlanTier.PRO` /
      `PlanTier.AGENCY` on the `Subscription` record, activating the correct entitlements.
      **Corrected 2026-08-22 — this AC's premise was architecturally wrong.** There is no
      separate Plan-ID-to-tier lookup table in this codebase for a webhook to resolve a tier from.
      `planTier` is stored directly on the `Subscription` record at **checkout** time
      (`createSubscription(planTier: PlanTier, ...)`); the webhook only reads
      `PLAN_CONFIG[subscription.planTier]` (verified directly in
      `upgradeOrganizationForActiveSubscription()`). Since `PlanTier` already includes PRO/AGENCY
      (`US-PAY-102`) and `PLAN_CONFIG` resolves them correctly, this path already worked with
      **zero new mapping code** — verified by test, not assumed.
- [x] **AC2 [error-path]:** A webhook event referencing an unrecognized/un-mapped Razorpay Plan ID
      does not silently activate a wrong or default tier — it's logged as an error and the
      subscription stays in its prior state, not corrupted. **Same correction as AC1**: there's no
      Plan-ID lookup to have an "unmapped" entry in. The real failure mode this codebase has is an
      unrecognized *subscription* id (`getSubscriptionByExternalId` returns null) — already
      handled by an early return, covered by the pre-existing `no-ops when subscription is not
      found` test. Nothing new was needed; the AC's literal scenario doesn't apply to this
      architecture, but its intent (unrecognized things don't corrupt state) already holds.
- [x] **AC3 [security]:** Webhook signature verification (existing, raw-body-preserved mechanism)
      is unchanged — not touched.
- [x] **AC4 [currency-edge]:** The webhook's recorded `Subscription.amount` for a PRO/AGENCY charge
      matches `PLAN_CONFIG`'s value exactly — a mismatch (e.g. Razorpay dashboard price drift from
      `PLAN_CONFIG`) is logged as a warning, not silently trusted. **This part was genuinely
      missing** (no amount check existed for any tier) — added in `handleSubscriptionCharged()`.

---

## Out of Scope

- Checkout-side subscription creation (`US-PAY-110`) — this story is the *receiving* end
  (webhook → entitlement), not the creating end.
- Any change to webhook signature verification itself.
- Dunning/failed-payment handling for the new tiers — reuses existing `US-LAUNCH-012` logic
  unmodified, just needs the new Plan IDs recognized.

---

## Engineering / PR

- **Branch:** `feat/pay/m-01-pricing-relaunch`
- **PR:** #_____ (milestone PR)
- **Primary files touched:**
  - `api/src/modules/payments/services/payments.service.ts` — extend the Plan-ID-to-tier mapping
    used by the webhook handler

---

## AI Implementation Prompt

```
Project context: see PROJECT_CONTEXT.yaml at repo root.

Story: US-PAY-111 — Webhook/entitlement mapping for new tiers

As a customer whose PRO or AGENCY payment succeeds, I want my subscription activated correctly by
the webhook handler so my entitlements immediately match what I paid for.

Acceptance Criteria:
  AC1 [happy-path]: subscription.charged webhook for a PRO/AGENCY Plan ID correctly maps to
    PlanTier.PRO/AGENCY on the Subscription record.
  AC2 [error-path]: an unmapped Plan ID does not silently activate a wrong tier — logged as error,
    subscription state unchanged.
  AC3 [security]: existing webhook signature verification unchanged, still required before any tier
    mapping applies.
  AC4 [currency-edge]: recorded Subscription.amount matches PLAN_CONFIG exactly; a mismatch logs a
    warning, isn't silently trusted.

Out of Scope:
  Checkout-side subscription creation (US-PAY-110). Webhook signature verification changes.
  Dunning/failed-payment handling (reuses existing logic unmodified).

Primary files to touch (do NOT touch other files):
  api/src/modules/payments/services/payments.service.ts

Rules:
- Touch ONLY the file listed above
- Do NOT implement anything in Out of Scope
- Run verification gates before declaring done
- When done: list files changed, ACs checked ✅, test commands output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-PAY-111-01 | Unit | P0 | Given a PENDING PRO subscription, when its subscription.charged webhook is processed, then the org is upgraded with PRO's real entitlements (limit 100) | ✅ | No new mapping code needed — same code path as every tier |
| TC-PAY-111-02 | Unit | P0 | Given a webhook whose subscription id is unrecognized, when processed, then no tier is silently activated | ✅ | Already covered by pre-existing `no-ops when subscription is not found` test |
| TC-PAY-111-03 | Unit | P1 | Given a PRO/AGENCY charge amount that doesn't match PLAN_CONFIG, when processed, then a warning is logged (and a matching amount logs none) | ✅ | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded
- [x] Gate 1 passes
- [ ] Gate 4 passes (backend) — not separately run this pass
- [ ] Manual flow verified
- [ ] PR merged
- [ ] No console errors for the changed flow
- [x] [TASKS.md](./TASKS.md) task list fully checked (except Gate 4/manual/PR, tracked open)
- [x] STORY.md status updated to ✅ Done (code)

---

## Implementation Update (log)

**2026-08-22.** Verified this story's own premise before implementing it: read `payments.service.ts`'s
`handleSubscriptionCharged()` → `upgradeOrganizationForActiveSubscription()` directly rather than
trusting the AC text. Found there is **no** separate Plan-ID-to-tier lookup table for the webhook
to resolve a tier from — `planTier` is stored on the `Subscription` record at checkout time and
read straight from `PLAN_CONFIG[subscription.planTier]`. Since `US-PAY-102` already widened
`PlanTier` and fixed `PLAN_CONFIG`'s downstream consumers, this path already worked correctly for
PRO/AGENCY with zero new mapping code — proved by test (`TC-PAY-111-01`), not assumed. AC1/AC2
text corrected to describe the real mechanism.

The one genuinely missing piece was AC4 (amount-mismatch warning) — added a comparison in
`handleSubscriptionCharged()` between the Razorpay-charged amount and `PLAN_CONFIG`'s expected
amount, logging a warning on mismatch without blocking activation. Commits `eca38ea` (code),
`4c690b0` (tests). Gate 1: `npm run check` (0 errors),
`api/tests/payments/payments.service.spec.ts` (22/22 pass, including 3 new).

---

*Story created: 2026-08-21*
