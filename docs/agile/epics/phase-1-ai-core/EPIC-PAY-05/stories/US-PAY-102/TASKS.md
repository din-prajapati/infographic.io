---
title: PR Task List — US-PAY-102
type: template
tags: [orion, template]
updated: 2026-08-21
---

# PR Task List — US-PAY-102

> **Story:** [STORY.md](./STORY.md)
> **Milestone branch:** `feat/pay/m-01-pricing-relaunch`
> **PR:** #_____ (milestone PR)
> **Linear:** LIN-XXX

---

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md filled: ACs written, out-of-scope listed, AI prompt ready
- [ ] **Muscle** — this TASKS.md has T1..T4 with exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists for this epic
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded

---

## PR Scope Summary

**One-liner:** Add PRO and AGENCY tiers to PLAN_CONFIG and the Prisma PlanTier enum.

```
feat(pay): add PRO and AGENCY tiers to PLAN_CONFIG — US-PAY-102
```

---

## Task Breakdown

### T1 — Add PRO/AGENCY to PLAN_CONFIG + editableLimit field
- **File:** `shared/schema.ts`
- **Type:** `feat`
- **AC(s) covered:** AC1, AC4
- **Changes:**
  - Add `PRO: { price: 1099900, limit: 100, userLimit: 1, currency: 'INR', editableLimit: 25 }`
  - Add `AGENCY: { price: 4399900, limit: 400, userLimit: -1, currency: 'INR', editableLimit: 150 }`
  - Add `editableLimit` to existing `SOLO` (10) and `TEAM` (60) entries

**Commit:**
```bash
git add shared/schema.ts
git commit -m "feat(pay): add PRO and AGENCY tiers to PLAN_CONFIG — US-PAY-102"
```

---

### T2 — Add PRO/AGENCY to Prisma PlanTier enum + migration
- **File:** `api/prisma/schema.prisma`
- **Type:** `feat`
- **AC(s) covered:** AC3
- **Changes:**
  - Add `PRO` and `AGENCY` to the `PlanTier` enum
  - Run `npx prisma migrate dev --name add_pro_agency_plan_tiers --schema=api/prisma/schema.prisma`

**Commit:**
```bash
git add api/prisma/schema.prisma api/prisma/migrations/
git commit -m "feat(pay): add PRO/AGENCY to PlanTier enum, migration — US-PAY-102"
```

---

### T3 — Update usage-limit.service.ts fallback table
- **File:** `api/src/modules/infographics/services/usage-limit.service.ts`
- **Type:** `fix`
- **AC(s) covered:** AC2
- **Changes:**
  - Add `PRO: 100` and `AGENCY: 400` to `PLAN_TIER_MONTHLY_LIMITS`

**Commit:**
```bash
git add api/src/modules/infographics/services/usage-limit.service.ts
git commit -m "fix(pay): add PRO/AGENCY to monthly-limit fallback table — US-PAY-102"
```

---

### T4 — Unit tests
- **File:** `shared/__tests__/plan-config.spec.ts` (new)
- **Type:** `test`
- **AC(s) covered:** AC1, AC2, AC4
- **Changes:**
  - Assert PLAN_CONFIG.PRO/AGENCY shape matches spec exactly
  - Assert `resolveMonthlyLimit()` returns 100/400 for PRO/AGENCY orgs
  - Assert every `PLAN_CONFIG[tier].price` is `Number.isInteger()`

**Commit:**
```bash
git add shared/__tests__/plan-config.spec.ts
git commit -m "test(pay): cover PRO/AGENCY plan config shape and limits — US-PAY-102"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `shared/schema.ts` | T1 | AC1, AC4 | |
| `api/prisma/schema.prisma` | T2 | AC3 | + migration |
| `api/src/modules/infographics/services/usage-limit.service.ts` | T3 | AC2 | |
| `shared/__tests__/plan-config.spec.ts` | T4 | AC1, AC2, AC4 | new test file |

---

## Exact Test Commands

```bash
# Gate 1 — mandatory
npm run check
npm run test:unit

# Manual: confirm prisma migrate dev succeeds against a dev DB
npx prisma generate --schema=api/prisma/schema.prisma
```

---

## Task Checklist

- [x] T1 — PLAN_CONFIG PRO/AGENCY + editableLimit (file: `shared/schema.ts`, type: `feat`) — commit `0dd872c`
- [x] T2 — Prisma enum (file: `api/prisma/schema.prisma`, type: `feat`) — commit `4941b2d`.
      **Deviation:** ran `npx prisma generate` only, not `prisma migrate dev` — this project has no
      versioned migrations directory (`api/prisma/migrations/` holds one manual SQL file, not a
      real migrate history), it uses the `db push` workflow per CLAUDE.md's own command list.
      `npx prisma db push` against the dev DB is a follow-up step, not run in this session.
- [x] T3 — usage-limit fallback table (file: `usage-limit.service.ts`, type: `fix`) — commit `0bbc93a`
- [x] T4 — unit tests (type: `test`) — commit `21e6157`. **Deviation:** planned file was
      `shared/__tests__/plan-config.spec.ts`; used `client/src/lib/__tests__/planConfig.spec.ts`
      instead (client vitest already resolves `@shared`, no test runner exists directly under
      `shared/`), plus 2 tests added to the existing `api/tests/infographics/usage-limit.service.spec.ts`.
- [x] **Extra, not in original scope:** `client/src/lib/api.ts`, `server/payments/services/subscription.service.ts`,
      `api/src/modules/payments/services/payments.service.ts` — commit `bce3a4f`. Necessary: extending
      `PlanTier` broke 3 separate hardcoded narrower unions/maps (one caused a real test crash in
      `tests/payments/plan-availability.spec.ts`). **Deviates from this file's own Anti-Pattern
      below ("do not touch payments.service.ts — that's US-PAY-109")** — only structural key
      entries were added (same naming pattern as every other tier, empty-string fallback), no real
      Razorpay Plan ID values chosen. That value-selection work is still genuinely US-PAY-109's.
- [x] Gate 1 passes ✅ — verified: `npm run check` (0 errors), `npm run test:unit:backend` (370/370),
      `npm run test:unit:client` (236/237, 1 pre-existing skip)
- [ ] Gate 4 passes for backend — not run this pass (no live DB `db push` yet)
- [ ] Manual test verified — pending
- [ ] PR opened with story card as description — pending (milestone PR, opens with M-PAY-01)
- [x] STORY.md ACs ticked off ✅
- [x] EPIC.md "Implementation Update" log appended ✅

---

## Test Is Truth

> **Rule (non-negotiable):** Do not weaken, skip, or modify a failing test to make it pass. Fix the
> code. Do not open a PR until all commands in "Exact Test Commands" pass or are explicitly marked
> N/A with a written reason.

---

## Anti-Patterns to Avoid in This Story

- Do NOT touch `RAZORPAY_PLAN_*` env vars or `payments.service.ts` — that's US-PAY-109.
- Do NOT rename or remove `BROKERAGE` — AGENCY is additive, not a rename.
- Do NOT add founding-price fields directly onto `PLAN_CONFIG` — that's the `PricingCampaign` model
  in US-PAY-105, kept deliberately separate.

---

*Tasks created: 2026-08-21*
