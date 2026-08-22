---
title: PR Task List — US-PAY-111
type: template
tags: [orion, template]
updated: 2026-08-21
---

# PR Task List — US-PAY-111

> **Story:** [STORY.md](./STORY.md)
> **Milestone branch:** `feat/pay/m-01-pricing-relaunch`
> **PR:** #_____
> **Linear:** LIN-XXX

---

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md filled
- [ ] **Muscle** — T1-T2 with exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded

---

## PR Scope Summary

**One-liner:** Extend webhook Plan-ID-to-tier mapping for PRO/AGENCY.

```
feat(pay): map PRO/AGENCY Plan IDs in webhook entitlement handler — US-PAY-111
```

---

## Task Breakdown

### T1 — Extend Plan-ID-to-tier mapping
- **File:** `api/src/modules/payments/services/payments.service.ts`
- **Type:** `feat`
- **AC(s) covered:** AC1, AC2, AC4
- **Changes:**
  - Extend whatever lookup the webhook handler uses to resolve `PlanTier` from a Razorpay Plan ID to
    include the new PRO/AGENCY monthly/annual IDs
  - Unrecognized Plan ID: log error, leave subscription state unchanged (no default/fallback tier)
  - Amount mismatch vs `PLAN_CONFIG`: log warning, still record what Razorpay actually sent

**Commit:**
```bash
git add api/src/modules/payments/services/payments.service.ts
git commit -m "feat(pay): map PRO/AGENCY Plan IDs in webhook handler — US-PAY-111"
```

---

### T2 — Unit tests
- **File:** `api/tests/payments/payments.service.spec.ts` (extend)
- **Type:** `test`
- **AC(s) covered:** AC1, AC2, AC4
- **Changes:**
  - Cover TC-PAY-111-01/02/03

**Commit:**
```bash
git add api/tests/payments/payments.service.spec.ts
git commit -m "test(pay): cover PRO/AGENCY webhook tier mapping — US-PAY-111"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `payments.service.ts` | T1 | AC1, AC2, AC4 | |
| `payments.service.spec.ts` | T2 | AC1, AC2, AC4 | |

---

## Exact Test Commands

```bash
npm run check
cd api && npx vitest run tests/payments/payments.service.spec.ts --reporter=verbose
```

---

## Task Checklist

- [x] T1 — **reframed**: no Plan-ID-to-tier mapping exists to extend (see STORY.md correction);
      added the AC4 amount-mismatch warning instead (file: `payments.service.ts`, type: `feat`) —
      commit `eca38ea`
- [x] T2 — unit tests (file: `payments.service.spec.ts`, type: `test`) — commit `4c690b0`
- [x] Gate 1 passes ✅ — `npm run check` (0 errors), 22/22 tests pass
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

- Do NOT touch webhook signature verification — out of scope, high-risk if broken.
- Do NOT default an unrecognized Plan ID to any tier — fail loudly (logged error), never silently.

---

*Tasks created: 2026-08-21*
