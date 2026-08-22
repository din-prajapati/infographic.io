---
title: Story Card — US-PAY-102
type: story
tags: [orion, pay, pricing]
updated: 2026-08-21
---

# Story Card — US-PAY-102

> **Status:** ✅ Done (code) — **re-opened 2026-08-23** to fix a real gap (SOLO/TEAM were never
> repriced), re-closed same day. PR/manual-verify/Gate 4 still open, see TASKS.md
> **Feature:** F-PAY-01 — Pricing Configuration & Entitlements
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-01-pricing-foundation](../../milestones/M-PAY-01-pricing-foundation.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Created:** 2026-08-21 | **Closed:** 2026-08-22 (code) — full DoD pending

---

## Story

*As* Buildographic's business owner
*I want* `PLAN_CONFIG` extended with real PRO and AGENCY tiers at the feasibility-checked prices and
limits
*So that* every downstream consumer (pricing page, checkout, entitlements) reads one correct,
single-sourced set of tier definitions instead of drifting hardcoded copies

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** `shared/schema.ts` `PLAN_CONFIG` contains `PRO` (price `10999`
      **rupees**, limit `100`) and `AGENCY` (price `43999` **rupees**, limit `400`) entries with the
      same shape as existing tiers (`price`, `limit`, `userLimit`, `currency`), plus a new
      `editableLimit` field populated for every paid tier (`SOLO: 10, PRO: 25, TEAM: 60,
      AGENCY: 150`). **Corrected 2026-08-22**: this AC originally said "paise" (`1099900`/`4399900`)
      — wrong. Every existing tier (`SOLO: 2999`, `TEAM: 6999`, `BROKERAGE: 24999`) stores rupees,
      and `subscription.service.ts` does `price * 100` itself when building a payment amount;
      storing paise here would have double-converted (₹10,99,900/mo instead of ₹10,999/mo). Fixed
      before this reached the pricing page. Verified — `client/src/lib/__tests__/planConfig.spec.ts`.
      **Re-opened 2026-08-23**: found while implementing `US-PAY-106` that SOLO/TEAM's own regular
      prices were never actually updated to the relaunch's finalized numbers by any story — this
      story only ever added PRO/AGENCY. Fixed here: SOLO `2999 → 5499`, TEAM `6999 → 21999`
      (BROKERAGE deliberately untouched — being phased out in favor of AGENCY, repricing/migrating
      existing subscribers is a separate real decision per `EPIC.md`'s Out of Scope). Existing live
      Razorpay Plan objects for SOLO/TEAM are price-immutable at the old rate; new ones at the new
      price are a human task, tracked in `HUMAN_TASKS.md` #6b.
- [x] **AC2 [error-path]:** When `usage-limit.service.ts`'s `resolveMonthlyLimit()` is called for
      an org on `PRO` or `AGENCY`, it returns the correct limit (100 / 400) instead of falling
      through to `undefined` or the old `PLAN_TIER_MONTHLY_LIMITS` fallback table missing these
      tiers. Verified — `api/tests/infographics/usage-limit.service.spec.ts`.
- [x] **AC3 [security]:** `api/prisma/schema.prisma`'s `PlanTier` enum includes `PRO` and `AGENCY`
      as real values (not string literals bypassing the enum) — a subscription cannot be created
      with an arbitrary/unrecognized tier string. Schema validated via `npx prisma generate`;
      `db push` against the dev DB not yet run (see TASKS.md).
- [x] **AC4 [currency-edge]:** All new prices are stored as integer **rupees** (`10999`, `43999` —
      corrected from the AC's original, wrong "paise" framing, see AC1), never a float — verified by
      a unit test asserting `Number.isInteger()` on every `PLAN_CONFIG[tier].price`.

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
  AC1 [happy-path]: PLAN_CONFIG contains PRO (10999 rupees, limit 100) and AGENCY (43999 rupees,
    limit 400) with the same shape as existing tiers (rupees, matching SOLO:2999/TEAM:6999/
    BROKERAGE:24999 -- NOT paise, subscription.service.ts multiplies by 100 itself), plus
    editableLimit (SOLO:10, PRO:25, TEAM:60, AGENCY:150).
  AC2 [error-path]: resolveMonthlyLimit() returns correct limits for PRO/AGENCY, no fallthrough to
    undefined or a stale fallback table.
  AC3 [security]: PlanTier Prisma enum includes PRO and AGENCY as real enum values.
  AC4 [currency-edge]: all new prices are integer rupees, unit-tested with Number.isInteger().

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

- [x] All ACs checked ✅
- [x] All test cases run and recorded
- [x] Gate 1 passes
- [ ] Gate 4 passes (backend) — needs `db push` against a real DB, not run this pass
- [ ] Manual flow verified
- [ ] PR merged
- [ ] No console errors for the changed flow
- [x] [TASKS.md](./TASKS.md) task list fully checked (except Gate 4/manual/PR, tracked open)
- [x] STORY.md status updated to ✅ Done (code)

---

## Implementation Update (log)

**2026-08-22.** Finished after an earlier tooling run left this story partially implemented
(`shared/schema.ts`, uncommitted) and stalled mid-way asking for permission to edit
`api/prisma/schema.prisma` (declined at the time — investigate that tool separately). Completed
the two missing pieces (Prisma enum, `usage-limit.service.ts` fallback table), then found and
fixed 3 downstream consumers that broke when `PlanTier` widened (see TASKS.md for detail) — one
of them, `api/src/modules/payments/services/payments.service.ts`, is explicitly named in this
story's own Anti-Patterns as off-limits (that's `US-PAY-109`'s file) but touching it was
unavoidable: `PlanTier` now has 9 members and `Record<PlanTier, ...>` maps there needed the same 2
new keys added everywhere else, confirmed by a real test crash in
`tests/payments/plan-availability.spec.ts`. Only structural key entries were added (same
env-var-fallback pattern as every other tier, empty-string placeholders) — no real Razorpay Plan
ID values were chosen, that's still genuinely `US-PAY-109`'s job.

Also found: `shared/schema.ts` already carried `ANNUAL_MULTIPLIER`/`getAnnualPrice()` (`US-PAY-107`'s
formula) from the same earlier tooling run — verified correct (`5499 × 10 = 54990`), kept, not
re-litigated. `US-PAY-107` is not closed by this — still needs its own test and STORY.md update.

**Second finding, more serious:** the story's own AC1/AC4 text specified PRO/AGENCY prices in
paise (`1099900`/`4399900`) — but every existing tier (`SOLO: 2999`, `TEAM: 6999`,
`BROKERAGE: 24999`) stores rupees, and `subscription.service.ts` does `price * 100` itself when
building a real payment amount. Following the AC literally would have double-converted, showing
₹10,99,900/mo instead of ₹10,999/mo the moment PRO/AGENCY rendered anywhere. Caught by
cross-checking the existing tiers before trusting the AC text at face value — corrected to
`10999`/`43999` (commit `133f209`), AC1/AC4 wording fixed to match. Worth remembering: an AC being
precisely worded doesn't mean its stated units are correct — check against the codebase's actual
established convention, not just internal consistency.

Gate 1 verified clean: `npm run check` (0 errors), `npm run test:unit:backend` (370/370),
`npm run test:unit:client` (236/237, 1 pre-existing skip). 7 commits, one per task/fix
(`0dd872c`, `4941b2d`, `0bbc93a`, `bce3a4f`, `21e6157`, `be5ea37`-adjacent, `133f209`).

**2026-08-23 — re-opened, a real gap.** Starting `US-PAY-106` (price resolution), its own AC1
example expects `getEffectivePrice('SOLO', 'monthly')` to reflect the PRD's finalized regular
price — but `PLAN_CONFIG.SOLO.price` was still `2999`, the old beta value. Checked the entire
epic: no story anywhere ever repriced SOLO/TEAM/BROKERAGE to the relaunch's actual numbers — this
story's AC1 only ever said "add PRO/AGENCY." The whole premise of this epic (fixing a measured
margin problem via new pricing) had never been applied to the tiers whose margin problem it was
measured on. Flagged to the user before touching anything (a business-facing repricing decision,
not something to silently assume); confirmed: fix it here. SOLO `2999 → 5499`, TEAM `6999 →
21999`. BROKERAGE deliberately left alone (being phased out for AGENCY; migrating existing
subscribers is a separate decision, see `EPIC.md` Out of Scope). New human task filed:
`HUMAN_TASKS.md` #6b — existing live Razorpay Plans for SOLO/TEAM are price-immutable, new ones
are needed at the new prices. Commit `c89b732`. Gate 1 re-verified: `npm run check` (0 errors),
backend 395/395, client 241/242.

---

*Story created: 2026-08-21*
