---
title: PR Task List — US-PAY-105
type: template
tags: [orion, template]
updated: 2026-08-21
---

# PR Task List — US-PAY-105

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

**One-liner:** Add the generic PricingCampaign model used by every present and future discount campaign.

```
feat(pay): add PricingCampaign model — US-PAY-105
```

---

## Task Breakdown

### T1 — PricingCampaign Prisma model + migration
- **File:** `api/prisma/schema.prisma`
- **Type:** `feat`
- **AC(s) covered:** AC1
- **Changes:**
  - Add the model exactly as specified in STORY.md AC1
  - `npx prisma migrate dev --name add_pricing_campaign --schema=api/prisma/schema.prisma`

**Commit:**
```bash
git add api/prisma/schema.prisma api/prisma/migrations/
git commit -m "feat(pay): add PricingCampaign Prisma model + migration — US-PAY-105"
```

---

### T2 — pricing-campaign.service.ts — CRUD + single-active guard + tierDiscounts validation
- **File:** `api/src/modules/payments/services/pricing-campaign.service.ts`
- **Type:** `feat`
- **AC(s) covered:** AC2, AC3, AC4
- **Changes:**
  - `createCampaign()`, `activateCampaign(id)` (deactivates any other active row in a transaction),
    `getActiveCampaign()`
  - Validate `tierDiscounts` shape and value ranges before write
  - `code` has no update path in the service (create-only)

**Commit:**
```bash
git add api/src/modules/payments/services/pricing-campaign.service.ts
git commit -m "feat(pay): PricingCampaignService with single-active guard and validation — US-PAY-105"
```

---

### T3 — Unit tests
- **File:** `api/tests/payments/pricing-campaign.service.spec.ts` (new)
- **Type:** `test`
- **AC(s) covered:** AC1, AC2, AC3, AC4
- **Changes:**
  - Cover TC-PAY-105-01/02/03

**Commit:**
```bash
git add api/tests/payments/pricing-campaign.service.spec.ts
git commit -m "test(pay): cover PricingCampaign model and service guards — US-PAY-105"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `api/prisma/schema.prisma` | T1 | AC1 | + migration |
| `pricing-campaign.service.ts` | T2 | AC2-4 | new file |
| `pricing-campaign.service.spec.ts` | T3 | AC1-4 | new file |

---

## Exact Test Commands

```bash
npm run check
cd api && npx vitest run tests/payments/pricing-campaign.service.spec.ts --reporter=verbose
```

---

## Task Checklist

- [x] T1 — Prisma model (file: `schema.prisma`, type: `feat`) — commit `8efc0e1`. **Deviation:**
      `npx prisma generate` only, not `migrate dev` (this project uses `db push`, see US-PAY-102's log)
- [x] T2 — service + guards (file: `pricing-campaign.service.ts`, type: `feat`) — commit `2bd8339`.
      Also registered in `payments.module.ts` (not in original file list, necessary for DI)
- [x] T3 — unit tests (file: `pricing-campaign.service.spec.ts`, type: `test`) — commit `1d05c4b`
- [x] Gate 1 passes ✅ — `npm run check` (0 errors), 395/395 backend tests pass
- [ ] Gate 4 passes — not separately run this pass
- [ ] Manual test verified — pending
- [ ] PR opened with story card as description — pending (milestone PR)
- [x] STORY.md ACs ticked off ✅
- [x] EPIC.md "Implementation Update" log appended ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT add `founding_price`/`founding_enabled` style fields to `PLAN_CONFIG` — that's the exact
  anti-pattern this model exists to avoid.
- Do NOT build price-resolution logic here — that's `US-PAY-106`, a separate file/service.

---

*Tasks created: 2026-08-21*
