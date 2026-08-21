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

- [ ] T1 — PLAN_CONFIG PRO/AGENCY + editableLimit (file: `shared/schema.ts`, type: `feat`)
- [ ] T2 — Prisma enum + migration (file: `api/prisma/schema.prisma`, type: `feat`)
- [ ] T3 — usage-limit fallback table (file: `usage-limit.service.ts`, type: `fix`)
- [ ] T4 — unit tests (file: `plan-config.spec.ts`, type: `test`)
- [ ] Gate 1 passes ✅
- [ ] Gate 4 passes for backend ✅
- [ ] Manual test verified ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs ticked off ✅
- [ ] EPIC.md "Implementation Update" log appended ✅

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
