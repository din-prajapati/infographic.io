# PR Task List — US-LAUNCH-006

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/launch-us-launch-006-receipt-email`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-XXX
> **Type:** feat

---

## Three Pillars Pre-flight (check before starting AI session)

- [ ] **Brain** — STORY.md filled
- [ ] **Muscle** — file list + ordered tasks + exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded
- [ ] **Dependency** — US-LAUNCH-002 (EmailService) merged

---

## PR Scope Summary

**One-liner:** Receipt email on subscription.charged webhook (activation + renewals), failure-isolated
```
feat(payments): receipt email on subscription charge — US-LAUNCH-006
```

---

## Task Breakdown

### T1 — Receipt send in webhook charge handler
**Files:** `api/src/modules/payments/services/payments.service.ts`, `payments.module.ts`
**AC(s) covered:** AC1, AC2, AC3, AC4
**Changes:** *(fill during implementation session)*

### T2 — Unit tests
**File:** `api/tests/payments/receipt-email.spec.ts` (new)
**AC(s) covered:** AC5
**Changes:** *(fill during implementation session)*

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `payments.service.ts` + module | T1 | AC1–AC4 | after state update, try/catch |
| `api/tests/payments/receipt-email.spec.ts` | T2 | AC5 | mock EmailService |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
cd api && npx vitest run tests/payments/receipt-email.spec.ts --reporter=verbose
```

---

## Task Checklist

- [ ] T1 — webhook receipt send
- [ ] T2 — unit tests
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs updated ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT let email affect the webhook response — RazorPay retries on non-200 and would double-process
- Do NOT touch signature verification or PENDING→ACTIVE logic
- Do NOT generate a PDF invoice — plain HTML receipt only (GST invoicing is a later story)

---

*Tasks created: 2026-07-07*
