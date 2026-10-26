---
title: PR Task List — US-EDIT-017
type: tasks
updated: 2026-10-26
---

# PR Task List — US-EDIT-017 — Lane C · dead code

> **Branch:** `feat/edit/m05-lc-customize-panel` (worktree `../bg-deadcode`), squash into the milestone branch — lands first at integration
> **Scope:** delete `CustomizePanel.tsx`, correct two comments

---

## Four Pillars Pre-flight

- [x] **Brain** — STORY.md filled, 4 typed ACs
- [x] **Muscle** — T1–T3 below
- [x] **Map** — runbook §Stage 3 · Lane C
- [x] **Env** — no environment changes

---

## Task Breakdown

### T1 — Re-verify it is orphaned
`grep -rn "CustomizePanel" client/src/` — only its own file and comment mentions. Anything else: stop, report (AC3).

### T2 — Delete
Remove `client/src/components/editor/CustomizePanel.tsx`. Do **not** touch `TemplateSlotSection.tsx`, its live twin.

### T3 — Fix the comments
`slotIds.ts` and `templateSlots.ts` header comments: name `TemplateSlotSection`.

---

## Gates

- [x] Gate 1 — `npm run check`, `npm run test:unit:client`
