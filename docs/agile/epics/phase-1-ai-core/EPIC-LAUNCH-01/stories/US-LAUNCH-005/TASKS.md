# PR Task List — US-LAUNCH-005

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/launch-us-launch-005-razorpay-live`
> **PR:** none — ops-only scope; closed 2026-10-19 with a documented DoD exception in STORY.md
> **Linear:** LIN-XXX
> **Type:** feat (code) + ops (HUMAN checklist in STORY.md)

---

## Three Pillars Pre-flight (check before starting AI session)

- [x] **Brain** — STORY.md filled
- [x] **Muscle** — file list + ordered tasks + exact test commands
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [x] **Env** — [ENV.yaml](../../ENV.yaml) loaded (all RAZORPAY_* live vars listed there)

---

## PR Scope Summary

**One-liner:** Production startup assert refusing test-mode RazorPay config; live-mode ops via HUMAN checklist
```
feat(payments): production live-key startup assert — US-LAUNCH-005
```

---

## Task Breakdown

### T1 — Startup assert (pure function + bootstrap call)
**File:** `api/src/main.ts` or payments module init `(TBC)`
**AC(s) covered:** AC4
**Changes:** *(fill during implementation session)*

### T2 — Unit tests for assert
**File:** `api/tests/payments/live-key-assert.spec.ts` (new)
**AC(s) covered:** AC4
**Changes:** *(fill during implementation session)*

### T3 — Env documentation
**Files:** `.env.example`, epic `ENV.yaml`
**AC(s) covered:** AC3 (documentation side)
**Changes:** *(fill during implementation session)*

### T4 — HUMAN ops (no code)
Follow "Human Ops Checklist" in STORY.md — KYC/activation, live plans, webhook, Railway vars, real ₹ transaction + refund.

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `api/src/main.ts` (TBC) | T1 | AC4 | pure function, testable |
| `api/tests/payments/live-key-assert.spec.ts` | T2 | AC4 | new |
| `.env.example`, `ENV.yaml` | T3 | AC3 | docs only |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
cd api && npx vitest run tests/payments/live-key-assert.spec.ts --reporter=verbose
npm run verify:payment-prereqs   # against prod config (AC5)
```

---

## Task Checklist

- [x] T1 — startup assert — shipped separately under US-LAUNCH-010's boot-validation guard (`api/src/config/env.validation.ts` / `app-env.ts`), not a standalone T1 PR here
- [x] T2 — unit tests — covered by US-LAUNCH-010's test suite
- [x] T3 — env docs — `ENV.yaml` lists every live plan variable checkout reads, including PRO/AGENCY (added 2026-10-26)
- [x] T4 — HUMAN ops checklist complete — real ₹5,499 SOLO charge run on production 2026-10-16 → 19: charged, webhook verified, `PENDING → ACTIVE`, refunded and cancelled
- [x] `npm run check` passes ✅
- [x] `npm run test:unit` passes ✅
- [x] ~~PR opened with story card as description~~ — n/a, ops-only scope (T3/T4); see the DoD exception in STORY.md
- [x] STORY.md ACs updated ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT commit any live key/secret to the repo — Railway env vars only
- Do NOT touch payments.service.ts or provider files — this PR is assert + docs only
- Do NOT let the assert fire outside NODE_ENV=production (local dev uses test keys by design)

---

*Tasks created: 2026-07-07*
