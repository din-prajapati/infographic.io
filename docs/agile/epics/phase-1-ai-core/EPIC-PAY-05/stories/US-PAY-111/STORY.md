---
title: Story Card — US-PAY-111
type: story
tags: [orion, pay, pricing, razorpay, webhook]
updated: 2026-08-21
---

# Story Card — US-PAY-111

> **Status:** 🔲 Not Started
> **Feature:** F-PAY-03 — Billing Integration (Razorpay)
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-03-billing-integration](../../milestones/M-PAY-03-billing-integration.md)
> **Linear:** LIN-XXX
> **Size:** S
> **Created:** 2026-08-21 | **Closed:** —

---

## Story

*As* a customer whose PRO or AGENCY payment succeeds
*I want* my subscription activated correctly by the webhook handler
*So that* my entitlements (design/editable limits) actually match what I paid for, immediately

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** The `POST /api/v1/webhooks/razorpay` handler correctly maps a
      `subscription.charged` event for a PRO or AGENCY Razorpay Plan ID to `PlanTier.PRO` /
      `PlanTier.AGENCY` on the `Subscription` record, activating the correct entitlements.
- [ ] **AC2 [error-path]:** A webhook event referencing an unrecognized/未-mapped Razorpay Plan ID
      does not silently activate a wrong or default tier — it's logged as an error and the
      subscription stays in its prior state, not corrupted.
- [ ] **AC3 [security]:** Webhook signature verification (existing, raw-body-preserved mechanism)
      is unchanged and still required before any tier mapping is applied — this story only adds new
      Plan-ID-to-tier mappings, never weakens verification.
- [ ] **AC4 [currency-edge]:** The webhook's recorded `Subscription.amount` (paise) for a PRO/AGENCY
      charge matches `PLAN_CONFIG`'s value exactly — a mismatch (e.g. Razorpay dashboard price drift
      from `PLAN_CONFIG`) is logged as a warning, not silently trusted.

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
| TC-PAY-111-01 | Unit | P0 | Given a subscription.charged webhook for the PRO monthly Plan ID, when processed, then Subscription.planTier == PRO | 🔲 | |
| TC-PAY-111-02 | Unit | P0 | Given a webhook with an unrecognized Plan ID, when processed, then no tier is silently activated and an error is logged | 🔲 | |
| TC-PAY-111-03 | Unit | P1 | Given a PRO charge amount that doesn't match PLAN_CONFIG, when processed, then a warning is logged | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] Gate 1 passes
- [ ] Gate 4 passes (backend)
- [ ] Manual flow verified
- [ ] PR merged
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

## Implementation Update (log)

---

*Story created: 2026-08-21*
