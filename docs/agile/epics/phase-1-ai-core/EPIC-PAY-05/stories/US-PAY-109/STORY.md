---
title: Story Card — US-PAY-109
type: story
tags: [orion, pay, pricing, razorpay]
updated: 2026-08-21
---

# Story Card — US-PAY-109

> **Status:** 🔲 Not Started
> **Feature:** F-PAY-03 — Billing Integration (Razorpay)
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-03-billing-integration](../../milestones/M-PAY-03-billing-integration.md)
> **Linear:** LIN-XXX
> **Size:** S
> **Created:** 2026-08-21 | **Closed:** —

---

## Story

*As* a customer subscribing to PRO or AGENCY
*I want* checkout to charge against a real, correctly-priced Razorpay Plan
*So that* the subscription actually bills the right amount — extending the existing
`RAZORPAY_PLAN_*` env var pattern, not building a parallel mechanism

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** `payments.service.ts`'s `RAZORPAY_PLAN_KEYS` includes
      `RAZORPAY_PLAN_PRO_MONTHLY`, `RAZORPAY_PLAN_PRO_ANNUAL`, `RAZORPAY_PLAN_AGENCY_MONTHLY`,
      `RAZORPAY_PLAN_AGENCY_ANNUAL`, following the exact same lookup pattern already used for
      SOLO/TEAM/BROKERAGE.
- [ ] **AC2 [error-path]:** When a `RAZORPAY_PLAN_PRO_*` env var is unset, `PricingPage.tsx`'s
      existing `unconfiguredPaidTiers` mechanism (US-LAUNCH-007) correctly shows "Contact us" for
      PRO instead of a broken checkout button — verified, not assumed to already work by analogy.
- [ ] **AC3 [security]:** No placeholder fallback (`process.env.RAZORPAY_PLAN_PRO ||
      'plan_pro'`-style) ships to a path that could reach production — either the env var is set, or
      the tier is correctly marked unconfigured, never a fake plan ID that would fail at Razorpay.
- [ ] **AC4 [currency-edge]:** Each configured Razorpay Plan's actual dashboard-set amount matches
      `PLAN_CONFIG`'s value exactly (₹10,999/mo for PRO, ₹43,999/mo for AGENCY) — verified manually
      against the Razorpay dashboard, since the app cannot introspect Razorpay Plan amounts at
      runtime.

---

## Out of Scope

- Founding-price Offer objects (`US-PAY-108`, already done by this point in the dependency order).
- Checkout logic that selects which Plan ID to use (`US-PAY-110`).
- Webhook handling for the new tiers (`US-PAY-111`).

---

## Engineering / PR

- **Branch:** `feat/pay/m-01-pricing-relaunch`
- **PR:** #_____ (milestone PR)
- **Primary files touched:**
  - `api/src/modules/payments/services/payments.service.ts` — extend `RAZORPAY_PLAN_KEYS`
  - `.env.example` — document the 4 new env vars
  - `api/src/config/env.validation.ts` — add the new optional env var declarations

---

## AI Implementation Prompt

```
Project context: see PROJECT_CONTEXT.yaml at repo root.

Story: US-PAY-109 — New Razorpay Plan IDs for PRO/AGENCY tiers

As a customer subscribing to PRO or AGENCY, I want checkout to charge against a real, correctly-
priced Razorpay Plan, extending the existing RAZORPAY_PLAN_* pattern, not a parallel mechanism.

Acceptance Criteria:
  AC1 [happy-path]: RAZORPAY_PLAN_KEYS includes PRO_MONTHLY/ANNUAL and AGENCY_MONTHLY/ANNUAL,
    following the exact existing SOLO/TEAM/BROKERAGE lookup pattern.
  AC2 [error-path]: an unset PRO env var correctly shows "Contact us" via the existing
    unconfiguredPaidTiers mechanism — verify this actually works, don't assume by analogy.
  AC3 [security]: no fake placeholder plan ID fallback can reach production.
  AC4 [currency-edge]: configured Razorpay Plan amounts match PLAN_CONFIG exactly — manual dashboard
    verification.

Out of Scope:
  Founding Offer objects (US-PAY-108). Checkout Plan-ID-selection logic (US-PAY-110). Webhook
  handling (US-PAY-111).

Primary files to touch (do NOT touch other files):
  api/src/modules/payments/services/payments.service.ts
  .env.example
  api/src/config/env.validation.ts

Rules:
- Touch ONLY the files listed above
- Do NOT implement anything in Out of Scope
- Run verification gates before declaring done
- When done: list files changed, ACs checked ✅, test commands output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-PAY-109-01 | Unit | P0 | Given RAZORPAY_PLAN_PRO_MONTHLY set, when resolved, then the correct plan ID is used for a PRO monthly subscription | 🔲 | |
| TC-PAY-109-02 | Unit | P0 | Given RAZORPAY_PLAN_PRO_MONTHLY unset, when PricingPage renders, then PRO shows "Contact us" not a checkout button | 🔲 | |
| TC-PAY-109-03 | Manual | P1 | Given the Razorpay dashboard, when PRO/AGENCY Plan amounts are checked, then they match PLAN_CONFIG exactly | 🔲 | |

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
