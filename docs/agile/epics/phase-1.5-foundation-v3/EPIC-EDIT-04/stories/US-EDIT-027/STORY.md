---
title: Story Card — US-EDIT-027
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-29
---

# Story Card — US-EDIT-027 — Autosave and save status

> **Status:** 🔲 Not Started — drafted 2026-10-29. Harden with `/new-story` (test cases, Four-Pillars pre-flight, TASKS.md) before implementing.
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-09-v3-shell](../../milestones/M-EDIT-09-v3-shell.md)
> **Size:** M
> **Depends on:** — (shows its status in US-EDIT-024's top-bar slot)
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md); V3 canvas mockup (`Mockups/buildographic-canvas-simplification-v3/`, untracked)

---

## Story

*As* an agent working on a design
*I want* my changes saved automatically, with a clear status
*So that* I never lose work, and I don't have to remember to press Save

---

## Acceptance Criteria

> Drafted from the 2026-10-29 V3 gap analysis. File paths are the expected touch points, to be confirmed by `/new-story`.

- [ ] **AC1 [happy-path]:** A design that already exists saves automatically about 2 seconds after the last change; a brand-new design starts autosaving after its first save.
- [ ] **AC2 [happy-path]:** The top bar shows **Saving…**, **All changes saved** or **Couldn't save — Retry**; the Save button still works.
- [ ] **AC3 [error-path]:** When a save fails, the edits stay in the editor and in the local draft, and Retry sends them again.
- [ ] **AC4 [edge-case]:** Leaving the page with unsaved changes asks for confirmation.
- [ ] **AC5 [concurrent]:** Saves are sent one at a time and each sends the latest state, so a slow save never overwrites a newer one.

---

## Out of Scope

- Real-time collaboration
- Version history UI
- Autosaving sample designs

---

## Engineering / PR

- **Branch:** milestone branch (see PROJECT_CONTEXT.yaml `git.branch_format`)
- **PR:** #_____
- **Expected files:**
  - `client/src/hooks/useAutosave.ts` — new
  - `client/src/components/editor/EditorLayout.tsx` — status in the top bar
  - `client/src/components/editor/SaveDialog.tsx` — first-save path unchanged
  - `client/src/lib/storage.ts` — local draft (existing autosave key)

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] Test cases written by `/new-story`, run and recorded
- [ ] Gate 1 passes · Gate 2 (frontend) · Gate 4 (backend) as applicable
- [ ] PR merged
- [ ] STORY.md status updated to ✅ Done

---

*Story drafted: 2026-10-29*
