---
title: Story Card — US-PAY-102
type: story
tags: [orion, pay, pricing]
updated: 2026-08-21
---

# Story Card — US-PAY-102

> **Status:** 🔲 Not Started
> **Feature:** F-PAY-01 — Pricing Configuration & Entitlements
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-01-pricing-foundation](../../milestones/M-PAY-01-pricing-foundation.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Created:** 2026-08-21 | **Closed:** —

---

## Story

*As* Buildographic's business owner
*I want* `PLAN_CONFIG` extended with real PRO and AGENCY tiers at the feasibility-checked prices and
limits
*So that* every downstream consumer (pricing page, checkout, entitlements) reads one correct,
single-sourced set of tier definitions instead of drifting hardcoded copies

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** `shared/schema.ts` `PLAN_CONFIG` contains `PRO` (price `1099900` paise,
      limit `100`) and `AGENCY` (price `4399900` paise, limit `400`) entries with the same shape as
      existing tiers (`price`, `limit`, `userLimit`, `currency`), plus a new `editableLimit` field
      populated for every paid tier (`SOLO: 10, PRO: 25, TEAM: 60, AGENCY: 150`).
- [ ] **AC2 [error-path]:** When `usage-limit.service.ts`'s `resolveMonthlyLimit()` is called for
      an org on `PRO` or `AGENCY`, it returns the correct limit (100 / 400) instead of falling
      through to `undefined` or the old `PLAN_TIER_MONTHLY_LIMITS` fallback table missing these
      tiers.
- [ ] **AC3 [security]:** `api/prisma/schema.prisma`'s `PlanTier` enum includes `PRO` and `AGENCY`
      as real values (not string literals bypassing the enum) — a subscription cannot be created
      with an arbitrary/unrecognized tier string.
- [ ] **AC4 [currency-edge]:** All new prices are stored as integer paise (`1099900`, `4399900`),
      never floating-point rupees — verified by a unit test asserting `Number.isInteger()` on every
      `PLAN_CONFIG[tier].price`.

---

## Out of Scope

- Founding-price values (F-PAY-02, `PricingCampaign` model) — this story only sets *regular* prices.
- Annual pricing (F-PAY-02, `US-PAY-107`).
- Razorpay Plan ID creation (F-PAY-03).
- Renaming or migrating `BROKERAGE` — it stays as-is; `AGENCY` is a new, separate tier with
  different volume (400 vs 1,000/mo).
- Any UI change (F-PAY-04 reads this config, doesn't get touched here).

---

## Engineering / PR

- **Branch:** `feat/pay/m-01-pricing-relaunch`
- **PR:** #_____ (milestone PR — opens when M-PAY-01's Acceptance is complete)
- **Primary files touched:**
  - `shared/schema.ts` — add `PRO`, `AGENCY` to `PLAN_CONFIG`; add `editableLimit` field to every
    paid tier
  - `api/prisma/schema.prisma` — add `PRO`, `AGENCY` to the `PlanTier` enum; migration
  - `api/src/modules/infographics/services/usage-limit.service.ts` — update
    `PLAN_TIER_MONTHLY_LIMITS` fallback table to include the new tiers

---

## AI Implementation Prompt

> Paste this block into Claude Code to implement the story.

```
Project context: see PROJECT_CONTEXT.yaml at repo root.

Story: US-PAY-102 — Extend PLAN_CONFIG with PRO and AGENCY tiers

As Buildographic's business owner, I want PLAN_CONFIG extended with real PRO and AGENCY tiers at
the feasibility-checked prices and limits, so that every downstream consumer reads one correct,
single-sourced set of tier definitions.

Acceptance Criteria:
  AC1 [happy-path]: PLAN_CONFIG contains PRO (1099900 paise, limit 100) and AGENCY (4399900 paise,
    limit 400) with the same shape as existing tiers, plus editableLimit (SOLO:10, PRO:25, TEAM:60,
    AGENCY:150).
  AC2 [error-path]: resolveMonthlyLimit() returns correct limits for PRO/AGENCY, no fallthrough to
    undefined or a stale fallback table.
  AC3 [security]: PlanTier Prisma enum includes PRO and AGENCY as real enum values.
  AC4 [currency-edge]: all new prices are integer paise, unit-tested with Number.isInteger().

Out of Scope:
  Founding prices, annual pricing, Razorpay Plan IDs, renaming/migrating BROKERAGE, any UI change.

Primary files to touch (do NOT touch other files):
  shared/schema.ts
  api/prisma/schema.prisma
  api/src/modules/infographics/services/usage-limit.service.ts

Rules:
- Touch ONLY the files listed above
- Do NOT implement anything in Out of Scope
- Run verification gates (see PROJECT_CONTEXT.yaml.gates) before declaring done
- When done: list files changed, ACs checked ✅, test commands output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-PAY-102-01 | Unit | P0 | Given PLAN_CONFIG, when read for PRO/AGENCY, then price/limit/editableLimit match the spec exactly | 🔲 | |
| TC-PAY-102-02 | Unit | P0 | Given an org on PRO, when resolveMonthlyLimit() is called, then it returns 100 | 🔲 | |
| TC-PAY-102-03 | Unit | P1 | Given every PLAN_CONFIG price value, when checked, then all are integers (no floats) | 🔲 | |

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
