---
title: Story Card — US-PAY-105
type: story
tags: [orion, pay, pricing, discounts]
updated: 2026-08-21
---

# Story Card — US-PAY-105

> **Status:** 🔲 Not Started
> **Feature:** F-PAY-02 — Discount & Campaign Architecture
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-02-discount-architecture](../../milestones/M-PAY-02-discount-architecture.md)
> **Linear:** LIN-XXX
> **Size:** S
> **Created:** 2026-08-21 | **Closed:** —

---

## Story

*As* Buildographic's business owner
*I want* a generic, reusable `PricingCampaign` database model
*So that* Founding Customer 100 and every future campaign (festival, referral, …) are rows in one
table, not hardcoded per-campaign fields requiring a code change each time

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** `api/prisma/schema.prisma` has a `PricingCampaign` model with fields
      `id, code (unique), name, displayBadge?, tierDiscounts (Json), startsAt, endsAt?,
      maxRedemptions?, redemptionsUsed (default 0), isActive (default false)`, migrated
      successfully.
- [ ] **AC2 [error-path]:** Attempting to insert a second `PricingCampaign` row with `isActive: true`
      while another row already has `isActive: true` is rejected — enforced at the service layer (a
      DB-level partial unique index if Prisma/Postgres supports it cleanly, otherwise a guarded
      service method; either is acceptable, but silent dual-active rows are not).
- [ ] **AC3 [security]:** `code` is unique and immutable after creation (no update path that changes
      it) — prevents a redemption-tracking mixup between two campaigns sharing a code.
- [ ] **AC4 [currency-edge]:** `tierDiscounts` JSON values (`{type: "PERCENT"|"FLAT", value, ...}`)
      are validated on write — a `PERCENT` value outside `0 < value < 100`, or a negative `FLAT`
      value, is rejected before persisting.

---

## Out of Scope

- The price-resolution logic that reads this model (`US-PAY-106`).
- Seeding the actual Founding Customer 100 row (`US-PAY-108`).
- Any Razorpay Offer object creation (human task, `US-PAY-108`).
- Admin UI for managing campaigns — first pass is direct DB row insert/API, not a UI.

---

## Engineering / PR

- **Branch:** `feat/pay/m-01-pricing-relaunch`
- **PR:** #_____ (milestone PR)
- **Primary files touched:**
  - `api/prisma/schema.prisma` — new `PricingCampaign` model + migration
  - `api/src/modules/payments/services/pricing-campaign.service.ts` (new) — CRUD + the
    single-active-campaign guard

---

## AI Implementation Prompt

```
Project context: see PROJECT_CONTEXT.yaml at repo root.

Story: US-PAY-105 — PricingCampaign Prisma model + migration

As Buildographic's business owner, I want a generic PricingCampaign model so Founding Customer 100
and every future campaign are rows in one table, not per-campaign code changes.

Acceptance Criteria:
  AC1 [happy-path]: PricingCampaign model with id, code (unique), name, displayBadge?, tierDiscounts
    (Json), startsAt, endsAt?, maxRedemptions?, redemptionsUsed (default 0), isActive (default
    false), migrated successfully.
  AC2 [error-path]: a second isActive:true row is rejected (DB constraint or guarded service).
  AC3 [security]: code is unique and immutable after creation.
  AC4 [currency-edge]: tierDiscounts values are validated (PERCENT in (0,100), FLAT >= 0) before
    persisting.

Out of Scope:
  Price-resolution logic reading this model. Seeding the real Founding-100 row. Razorpay Offer
  creation. Admin UI.

Primary files to touch (do NOT touch other files):
  api/prisma/schema.prisma
  api/src/modules/payments/services/pricing-campaign.service.ts (new)

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
| TC-PAY-105-01 | Unit | P0 | Given valid campaign fields, when created, then the row persists with all fields correct | 🔲 | |
| TC-PAY-105-02 | Unit | P0 | Given one active campaign, when a second isActive:true campaign is created, then it's rejected | 🔲 | |
| TC-PAY-105-03 | Unit | P1 | Given tierDiscounts with PERCENT value 150, when created, then validation rejects it | 🔲 | |

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
