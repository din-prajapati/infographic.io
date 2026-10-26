---
title: PR Task List — US-EDIT-016
type: tasks
updated: 2026-10-25
---

# PR Task List — US-EDIT-016 — Lane B · canvas write-back

> **Branch:** `feat/edit/m05-lb-canvas` (worktree `../bg-cleanup`), squash into the milestone branch
> **Scope:** a canvas edit on slot-tagged text writes the field, in one Undo step

---

## Four Pillars Pre-flight

- [x] **Brain** — STORY.md filled, 6 typed ACs
- [x] **Muscle** — T1–T3 below
- [x] **Map** — runbook §Stage 3 · Lane B
- [x] **Env** — no environment changes

---

## Task Breakdown

### T1 — Write-back at the commit point ✅
In `TextElement.tsx`, after `updateElement(...)`, call `writeCanvasToField(slot, value)` when the element has a bound slot.
Commit: `a016932` — imported `writeCanvasToField`, exported `commitEdit`, used in `handleBlur`.

### T2 — One history entry ✅
Verify `updateElement` and the store write together push exactly one entry. If that needs a change in `useCanvasStore.ts` (read-only here), **stop and ask**.
Verified by inspection: `updateElement` calls `pushToHistory`; `writeCanvasToField` calls only `setProperty`/`setAgent` — no history push. One edit = one entry. No change to `useCanvasStore.ts` needed. Confirmed by TC-EDIT-016-02.

### T3 — Tests ✅
`client/src/components/canvas/__tests__/` — TC-EDIT-016-01 … 05.
All 9 tests pass. Mutation check: removing the write-back causes TC-EDIT-016-01 (2 tests) to fail.

---

## Gates

- [x] Gate 1 — `npm run check`, `npm run test:unit:client` — 340 passed, 1 skipped (pre-existing)
- [ ] Gate 2 — runbook MV-05-02 in Chrome (TC-EDIT-016-06, manual, lead runs at integration)
