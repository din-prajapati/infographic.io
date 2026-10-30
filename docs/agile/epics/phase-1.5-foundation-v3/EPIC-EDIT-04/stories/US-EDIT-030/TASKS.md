---
title: Tasks — US-EDIT-030
type: tasks
tags: [orion, edit, phase-1.5]
updated: 2026-10-30
---

# Tasks — US-EDIT-030

> **Story:** [US-EDIT-030](./STORY.md) — For sale / For rent badge in the canvas header
> **Branch:** `feat/edit/m-09-v3-shell` (milestone branch, after it is rebased onto `main` post-M-PROP-01)
> **PR:** #_____
> **PR scope:** one badge in `CanvasHeader`; extra cases in the US-EDIT-024 E2E. Nothing else.

---

## Four-Pillars Pre-flight

- [ ] **Brain** — `PropertyInfo.transaction` exists on `main` with values `'sale' | 'rent'` (US-PROP-002); confirm the exact type in `usePropertyStore.ts`.
- [ ] **Muscle** — `git log origin/main --grep US-PROP-002` shows the merge; the milestone branch contains it.
- [ ] **Map** — `CanvasHeader.tsx` (US-EDIT-024) has a right-hand group holding Preview.
- [ ] **Env** — `npm run dev` clean; the Property tab offers the listing intent (US-PROP-007).

---

## Tasks

### T1 — Badge (`CanvasHeader.tsx`)
- [ ] Subscribe to `property.transaction`; render the AC1 badge or nothing (AC2); tokens only.

**ACs:** AC1, AC2, AC3 · **Effort:** XS

### T2 — Verify (`e2e/us-edit-024-v3-shell.spec.ts`)
- [ ] TC-EDIT-030-01 to -04; `npm run check`, `npm run test:unit`; record in STORY.md.

**ACs:** AC4

---

## File → Task Map

| File | Task | Change type |
|---|:--:|---|
| `client/src/components/editor/CanvasHeader.tsx` | T1 | badge |
| `e2e/us-edit-024-v3-shell.spec.ts` | T2 | badge cases + contrast |

---

## Test Commands

```bash
npm run check
npm run test:unit
PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-edit-024-v3-shell.spec.ts
```

---

## Anti-patterns for this story

- **Starting before US-PROP-002 is on `main`.** A local `transaction` type would collide with the real one on rebase.
- **Showing "For sale" as a default.** No intent means no badge (AC2); a wrong badge is worse than none.

---

*Tasks created: 2026-10-30*
