---
title: Story Card — US-PAY-109
type: story
tags: [orion, pay, pricing, razorpay]
updated: 2026-08-21
---

# Story Card — US-PAY-109

> **Status:** 🟡 In Progress (code done) — blocked on T0 HUMAN task (real Razorpay Plan objects),
> see TASKS.md
> **Scope extended 2026-08-23**: now also covers the new SOLO/TEAM Razorpay Plans made necessary
> by `US-PAY-102`'s repricing (see AC5) — folded in here rather than a new story, since it's the
> exact same task shape (create Plan objects, wire env vars) this story already does for PRO/AGENCY.
> **Feature:** F-PAY-03 — Billing Integration (Razorpay)
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-03-billing-integration](../../milestones/M-PAY-03-billing-integration.md)
> **Linear:** LIN-XXX
> **Size:** S
> **Created:** 2026-08-21 | **Closed:** — (AC4 needs T0 first)

---

## Story

*As* a customer subscribing to PRO or AGENCY
*I want* checkout to charge against a real, correctly-priced Razorpay Plan
*So that* the subscription actually bills the right amount — extending the existing
`RAZORPAY_PLAN_*` env var pattern, not building a parallel mechanism

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** `payments.service.ts`'s `RAZORPAY_PLAN_KEYS` includes
      `RAZORPAY_PLAN_PRO_MONTHLY`, `RAZORPAY_PLAN_PRO_ANNUAL`, `RAZORPAY_PLAN_AGENCY_MONTHLY`,
      `RAZORPAY_PLAN_AGENCY_ANNUAL`, following the exact same lookup pattern already used for
      SOLO/TEAM/BROKERAGE. Landed as a side effect of `US-PAY-102`'s downstream-consumer fix
      (commit `bce3a4f`); env docs completed here (`.env.example`, `env.validation.ts`).
- [x] **AC2 [error-path]:** When a `RAZORPAY_PLAN_PRO_*` env var is unset, `PricingPage.tsx`'s
      existing `unconfiguredPaidTiers` mechanism (US-LAUNCH-007) correctly shows "Contact us" for
      PRO instead of a broken checkout button. Verified, not assumed — new tests in
      `plan-availability.spec.ts` prove `getAvailablePlans()` reports `configured: false` for
      PRO/AGENCY without their env vars, and `true` once set.
- [x] **AC3 [security]:** No placeholder fallback (`process.env.RAZORPAY_PLAN_PRO ||
      'plan_pro'`-style) ships to a path that could reach production. Confirmed by construction
      (both `RAZORPAY_PLAN_KEYS.PRO` and `PLAN_IDS.PRO.RAZORPAY` fall back to `''`, never a fake
      id) and by test.
- [ ] **AC4 [currency-edge]:** Each configured Razorpay Plan's actual dashboard-set amount matches
      `PLAN_CONFIG`'s value exactly (₹10,999/mo for PRO, ₹43,999/mo for AGENCY) — **genuinely
      blocked on T0** (a human creating the 4 real Razorpay Plan objects), cannot be verified from
      code. Not run this pass.
- [ ] **AC5 [added 2026-08-23, currency-edge]:** New Razorpay Plans exist for the repriced SOLO
      (₹5,499/mo, ₹54,990/yr) and TEAM (₹21,999/mo, ₹219,990/yr — `US-PAY-102`'s re-open), and
      `RAZORPAY_PLAN_SOLO_MONTHLY`/`_ANNUAL`/`RAZORPAY_PLAN_TEAM_MONTHLY`/`_ANNUAL` are repointed
      at them. **No code change is required for this AC** — unlike PRO/AGENCY, those exact env-var
      *keys* already existed and were already wired before this relaunch; only their *values* need
      to change. Existing SOLO/TEAM subscribers are unaffected — their subscription stays bound to
      whichever Plan object it was created against; only new checkouts pick up the new price.
      Blocked on the same T0 human task as AC4.

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
| TC-PAY-109-01 | Unit | P0 | Given RAZORPAY_PLAN_PRO_MONTHLY set, when resolved, then the correct plan ID is used for a PRO monthly subscription | ✅ | |
| TC-PAY-109-02 | Unit | P0 | Given RAZORPAY_PLAN_PRO_MONTHLY unset, when PricingPage renders, then PRO shows "Contact us" not a checkout button | ✅ | Verified via `getAvailablePlans()`'s `configured` flag, the same mechanism the page reads |
| TC-PAY-109-03 | Manual | P1 | Given the Razorpay dashboard, when PRO/AGENCY Plan amounts are checked, then they match PLAN_CONFIG exactly | ⏸ | Blocked on T0 (human dashboard task) |
| TC-PAY-109-04 | Manual | P1 | Given the Razorpay dashboard, when the new SOLO/TEAM Plan amounts are checked, then they match ₹5,499/₹21,999 exactly, and the env vars point at them | ⏸ | Added 2026-08-23; blocked on T0 |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅ — AC1/2/3 done; AC4 genuinely blocked on T0 (human)
- [x] All test cases run and recorded (TC-03 blocked, recorded as such)
- [x] Gate 1 passes
- [ ] Gate 4 passes (backend) — not separately run this pass
- [ ] Manual flow verified — blocked on T0
- [ ] PR merged
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked — T0 (human) still open
- [ ] STORY.md status updated to ✅ Done — stays 🟡 until T0 clears

---

## Implementation Update (log)

**2026-08-22.** T1 (`RAZORPAY_PLAN_KEYS` entries) had already landed as a side effect of
`US-PAY-102`'s downstream-consumer fix — found already correct, not redone. Completed T2 (env
docs) and T3 (unconfigured-tier tests, in `plan-availability.spec.ts` — the dedicated
`US-LAUNCH-007` test file, a better home than the originally-planned
`payments.service.spec.ts`). AC1-3 are genuinely done and verified by test — this story cannot go
further than that without T0 (a human creating 4 real Razorpay Plan objects in the dashboard);
AC4 stays open, not faked. Commits `bda66cb`, `5f2b2a6`. Gate 1: `npm run check` (0 errors),
`npm run test:unit:backend` (377/377, up from 373, +4 new).

**2026-08-23 — scope extended, not a new story.** `US-PAY-102`'s repricing of SOLO/TEAM (found as
a real gap while implementing `US-PAY-106`) needs new Razorpay Plan objects, same as PRO/AGENCY —
folded in here as AC5 rather than opening a new story, since it's the identical task shape this
story already owns. Checked the code first: no new work needed. `RAZORPAY_PLAN_SOLO_MONTHLY`/
`_ANNUAL`/`RAZORPAY_PLAN_TEAM_MONTHLY`/`_ANNUAL` already existed as env-var keys before this
relaunch (unlike PRO/AGENCY, which needed brand-new keys added) — the code already reads whatever
plan id is in them. This AC is purely T0 (human): create 4 more Plan objects, repoint 4 existing
env vars. `HUMAN_TASKS.md` #6 updated to include all 8 Plan objects (PRO/AGENCY new + SOLO/TEAM
repriced) as one consolidated task rather than a separate #6b entry.

---

*Story created: 2026-08-21*
