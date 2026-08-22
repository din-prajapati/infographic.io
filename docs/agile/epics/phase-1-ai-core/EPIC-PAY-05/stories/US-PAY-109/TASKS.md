---
title: PR Task List — US-PAY-109
type: template
tags: [orion, template]
updated: 2026-08-21
---

# PR Task List — US-PAY-109

> **Story:** [STORY.md](./STORY.md)
> **Milestone branch:** `feat/pay/m-01-pricing-relaunch`
> **PR:** #_____
> **Linear:** LIN-XXX

---

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md filled
- [ ] **Muscle** — T1-T3 with exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded — **HUMAN TASK first**: create 4 Razorpay Plan
      objects (dashboard) for PRO/AGENCY × monthly/annual

---

## PR Scope Summary

**One-liner:** Extend RAZORPAY_PLAN_KEYS with PRO and AGENCY tier plan IDs.

```
feat(pay): add Razorpay Plan IDs for PRO/AGENCY tiers — US-PAY-109
```

---

## Task Breakdown

### T0 — HUMAN: create Razorpay Plan objects
- Not a code task. Create 8 Plan objects in Razorpay dashboard:
  - PRO monthly (₹10,999), PRO annual (₹109,990) — new tier, new env vars (T1 below)
  - AGENCY monthly (₹43,999), AGENCY annual (₹439,990) — new tier, new env vars (T1 below)
  - **Added 2026-08-23 (`US-PAY-102`'s repricing, AC5)**: SOLO monthly (₹5,499), SOLO annual
    (₹54,990), TEAM monthly (₹21,999), TEAM annual (₹219,990) — **existing** tiers, **existing**
    env-var keys (`RAZORPAY_PLAN_SOLO_MONTHLY`/`_ANNUAL`/`RAZORPAY_PLAN_TEAM_MONTHLY`/`_ANNUAL`) —
    just repoint them at these 4 new plan ids, no T1 code work needed for these four. Existing
    SOLO/TEAM subscribers are unaffected (their subscription stays bound to whichever plan it was
    created against).
  - Record all 8 `plan_...` IDs.

---

### T1 — Extend RAZORPAY_PLAN_KEYS
- **File:** `api/src/modules/payments/services/payments.service.ts`
- **Type:** `feat`
- **AC(s) covered:** AC1, AC3
- **Changes:**
  - Add `RAZORPAY_PLAN_PRO_MONTHLY`, `RAZORPAY_PLAN_PRO_ANNUAL`, `RAZORPAY_PLAN_AGENCY_MONTHLY`,
    `RAZORPAY_PLAN_AGENCY_ANNUAL` to `RAZORPAY_PLAN_KEYS`, following the exact existing pattern
    (lines 25-53) — no placeholder fallback string

**Commit:**
```bash
git add api/src/modules/payments/services/payments.service.ts
git commit -m "feat(pay): add RAZORPAY_PLAN_PRO/AGENCY env var keys — US-PAY-109"
```

---

### T2 — Document + validate env vars
- **File:** `.env.example`, `api/src/config/env.validation.ts`
- **Type:** `docs`
- **AC(s) covered:** AC3
- **Changes:**
  - Document in `.env.example` matching the SOLO/TEAM pattern
  - Add as optional entries in `env.validation.ts`

**Commit:**
```bash
git add .env.example api/src/config/env.validation.ts
git commit -m "docs(pay): document RAZORPAY_PLAN_PRO/AGENCY env vars — US-PAY-109"
```

---

### T3 — Verify unconfiguredPaidTiers behavior + manual amount check
- **File:** `api/tests/payments/payments.service.spec.ts` (extend)
- **Type:** `test`
- **AC(s) covered:** AC2
- **Changes:**
  - Test: unset PRO env var → tier correctly flagged unconfigured
  - Manual: verify Razorpay dashboard Plan amounts against PLAN_CONFIG (TC-PAY-109-03)

**Commit:**
```bash
git add api/tests/payments/payments.service.spec.ts
git commit -m "test(pay): cover unconfigured-tier fallback for PRO/AGENCY — US-PAY-109"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `payments.service.ts` | T1 | AC1, AC3 | |
| `.env.example`, `env.validation.ts` | T2 | AC3 | |
| `payments.service.spec.ts` | T3 | AC2 | + manual TC-03 |

---

## Exact Test Commands

```bash
npm run check
cd api && npx vitest run tests/payments/payments.service.spec.ts --reporter=verbose
```

---

## Task Checklist

- [ ] T0 — **HUMAN, still open**: 8 Razorpay Plan objects created and IDs recorded (4 PRO/AGENCY +
      4 SOLO/TEAM, added 2026-08-23 per `US-PAY-102`'s repricing) — nothing else in this story can
      fully close until this happens
- [x] T1 — extend RAZORPAY_PLAN_KEYS (file: `payments.service.ts`, type: `feat`) — landed as a
      side effect of `US-PAY-102`'s commit `bce3a4f`
- [x] T2 — env docs (file: `.env.example`/`env.validation.ts`, type: `docs`) — commit `bda66cb`
- [x] T3 — unconfigured-tier test — commit `5f2b2a6`. **Deviation:** planned file was
      `payments.service.spec.ts`; used `plan-availability.spec.ts` instead — the dedicated
      `US-LAUNCH-007` test file for exactly this `configured` mechanism, a better fit than a
      generic extend.
- [x] Gate 1 passes ✅ — `npm run check` (0 errors), 377/377 backend tests pass
- [ ] Gate 4 passes — not separately run this pass
- [ ] Manual test verified — blocked on T0
- [ ] PR opened with story card as description — pending
- [ ] STORY.md ACs ticked off — AC1-3 done, AC4 blocked on T0
- [x] EPIC.md "Implementation Update" log appended ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT introduce a placeholder fallback plan ID string — unset means unconfigured, shown as
  "Contact us," never a fake ID that fails silently at Razorpay.

---

*Tasks created: 2026-08-21*
