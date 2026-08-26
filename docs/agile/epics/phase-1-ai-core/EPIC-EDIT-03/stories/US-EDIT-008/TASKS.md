---
title: Tasks — US-EDIT-008
type: tasks
tags: [orion, edit, quota, billing-ux]
updated: 2026-08-26
---

# Tasks — US-EDIT-008

> **Story:** [US-EDIT-008](./STORY.md) — editable quota badge + charge confirmation
> **Branch:** `feat/edit/us-edit-008-quota-badge`
> **PR:** #_____
> **Deferred from:** US-EDIT-005 AC4 / T4b
> **PR scope:** Return the charge signal the compose endpoint already computes, and use it plus
> the existing quota endpoint to show a real allowance and an honest charge confirmation.

---

## Four-Pillars Pre-flight

- [ ] **Brain** — read US-EDIT-005 §AC4 and EPIC.md §Blockers. Confirm you can state why this
      could not be built client-side.
- [ ] **Muscle** — confirm `GET /infographics/generations/usage/quota/editable` responds for a
      logged-in account before building against it.
- [ ] **Map** — read `generations.service.ts:337-389`. `isCacheHit` and `isExtraCompose` already
      exist as local variables; this story returns them, it does not recompute them.
- [ ] **Env** — `npm run dev` up. A **paid-tier** test account is required for TC-02 (the metered
      path is unreachable on FREE, which gets one lifetime trial and then a 402).

---

## Tasks

### T1 — Response contract

- [ ] Add typed cache-hit / credit-consumed fields to `composed-design.types.ts` (AC1).
- [ ] Return the existing local flags from `getComposedDesign()` — additive only, no behaviour
      change to what is charged or when.
- [ ] Unit-cover all three shapes: cache hit, free first compose, metered extra (TC-01).

**Effort:** S

---

### T2 — Client reads the contract

- [ ] Surface the new fields through `client/src/lib/api.ts`.
- [ ] Do **not** infer charge state from timing, payload size, or response latency — that is the
      guessing US-EDIT-005 refused to do.

**Effort:** XS

---

### T3 — Badge + confirmation

- [ ] Fetch the allowance from the existing endpoint; no second quota mechanism (AC2).
- [ ] Decrement + confirmation only when a credit was actually consumed (AC3).
- [ ] Cache hit / free compose → unchanged, no confirmation, visibly distinct (AC4).
- [ ] Endpoint failure → badge absent, control still usable, compose still possible (AC5).

**Effort:** M

---

### T4 — Verify

- [ ] Unit: TC-01 across all three compose shapes.
- [ ] E2E: `e2e/us-edit-008-quota-badge.spec.ts` — TC-02/03/04.
- [ ] Regression: `e2e/us-edit-005-canvas-edit-toolbar.spec.ts` (AC6, TC-05).
- [ ] Record results in STORY.md's test-case table.

**Effort:** S

---

## File → Task Map

| File | Task | Change type |
|---|:--:|---|
| `api/src/modules/ai-generation/types/composed-design.types.ts` | T1 | contract |
| `api/src/modules/infographics/services/generations.service.ts` | T1 | return existing flags |
| `client/src/lib/api.ts` | T2 | read fields |
| `client/src/components/editor/CanvasEditToolbar.tsx` | T3 | badge + confirmation |
| `e2e/us-edit-008-quota-badge.spec.ts` | T4 | new |

---

## Test Commands

```bash
npm run check
npm run test:unit
cd api && npx vitest run tests/infographics/editable-gating.spec.ts --reporter=verbose
PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-edit-008-quota-badge.spec.ts --project=chrome-headed
PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-edit-005-canvas-edit-toolbar.spec.ts --project=chrome-headed
```

> Backend changes require a full dev-server restart — only Vite hot-reloads.

---

## Anti-patterns for this story

- **Do not infer the charge from timing.** A fast response means cache hit *today*, on this
  machine. That is the exact class of guess this story exists to replace with a real field.
- **Do not build a second quota source.** `getEditableUsageQuota()` already exists; a parallel
  count will drift from it and the two will disagree in front of a paying customer.
- **Do not change what is charged.** The credit rules are correct. This story makes them visible,
  not different. Any change to metering belongs to EPIC-PAY-05.
- **Do not block the control on the badge.** If the quota call fails, composing must still work —
  a broken badge must never become a broken feature (AC5).

---

*Tasks created: 2026-08-26 — deferred from US-EDIT-005 T4b*
