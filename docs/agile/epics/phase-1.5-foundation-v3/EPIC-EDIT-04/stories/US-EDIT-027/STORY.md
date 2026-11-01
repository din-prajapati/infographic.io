---
title: Story Card — US-EDIT-027
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-29
---

# Story Card — US-EDIT-027 — Autosave and save status

> **Status:** In progress — reconciled 2026-10-31 against the approved V3 integration plan.
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

> Runtime: opt-in App → V3Editor → useV3DesignSession → v3DesignSession → existing designsApi. Legacy useAutosave and EditorLayout stay unchanged.

- [x] **AC1 [happy-path]:** A design that already exists saves automatically about 2 seconds after the last change; a brand-new design starts autosaving after its first save.
- [x] **AC2 [happy-path]:** The approved title-adjacent cloud exposes **Saving…**, **Changes saved** or **Changes not saved** in its status/popover; a failed save shows **Save failed** with **Retry save**. The manual Save button still works. Wording follows the approved cloud interaction.
- [x] **AC3 [error-path]:** When a save fails, the edits stay in the editor and in the local draft, and Retry sends them again.
- [ ] **AC4 [edge-case]:** Leaving the page with unsaved changes asks for confirmation.
- [x] **AC5 [concurrent]:** Saves are sent one at a time and each sends the latest state, so a slow save never overwrites a newer one.
- [x] **AC6 [security]:** `client/src/lib/v3Autosave.ts` scopes drafts to authenticated user ID and canonical design ID (or new); recovery is offered explicitly through `useV3DesignSession`, never automatically restored or uploaded. Restored drafts require explicit Save before autosave resumes.
- [x] **AC7 [happy-path]:** `client/src/lib/v3DesignSession.ts` exposes lastSavedAt only from an acknowledged successful write; failed or stale responses never advance it. Load alone does not invent a last-save timestamp.
- [x] **AC8 [error-path]:** A failed autosave stops automatic retries until manual Save succeeds; local-storage failure is exposed separately and does not block server save. Disposal or switching designs cancels pending debounce and stale acknowledgements cannot affect the active document.

---

## Out of Scope

- Real-time collaboration
- Version history UI
- Autosaving sample designs

---

## Engineering / PR

- **Branch:** milestone branch (see PROJECT_CONTEXT.yaml `git.branch_format`)
- **PR:** #_____
- **Primary files touched:**
  - `client/src/lib/v3DesignSession.ts` — guarded debounce, acknowledgement status and recovery controller
  - `client/src/hooks/useV3DesignSession.ts` — authenticated draft adapter, beforeunload and navigation confirmation API
  - `client/src/lib/v3Autosave.ts` — scoped local draft serialization
  - `client/src/lib/__tests__/v3Autosave.spec.ts` — timed autosave and recovery contracts
  - `client/src/lib/__tests__/v3DesignSession.spec.ts` — retained slice regression contracts

Shell rendering of status/recovery/navigation lives in US-EDIT-024; no backend, legacy autosave, or serialized canvas-format change.

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] Test cases written by `/new-story`, run and recorded
- [ ] Gate 1 passes · Gate 2 (frontend) · Gate 4 (backend) as applicable
- [ ] PR merged
- [ ] STORY.md status updated to ✅ Done

---

*Story drafted: 2026-10-29*

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-EDIT-027-01 | Unit | P0 | happy-path: A design that already exists saves automatically about 2 … | ✅ | Session/autosave contracts and combined browser/live smoke pass. |
| TC-EDIT-027-02 | Unit | P0 | happy-path: The top bar shows **Saving…**, **All changes saved** or *… | ✅ | Session/autosave contracts and combined browser/live smoke pass. |
| TC-EDIT-027-03 | Unit | P0 | error-path: When a save fails, the edits stay in the editor and in th… | ✅ | Session/autosave contracts and combined browser/live smoke pass. |
| TC-EDIT-027-04 | Unit | P1 | edge-case: Leaving the page with unsaved changes asks for confirmation. | ⚠️ Partial | Unload/Projects covered; central Back/Forward guard remains. |
| TC-EDIT-027-05 | Integration | P1 | concurrent: Saves are sent one at a time and each sends the latest st… | ✅ | Session/autosave contracts and combined browser/live smoke pass. |
| TC-EDIT-027-06 | Unit | P1 | security: scopes drafts to authenticated user ID and canonical desi… | ✅ | Session/autosave contracts and combined browser/live smoke pass. |
| TC-EDIT-027-07 | Unit | P0 | happy-path: exposes lastSavedAt only from an acknowledged successful … | ✅ | Session/autosave contracts and combined browser/live smoke pass. |
| TC-EDIT-027-08 | Unit | P0 | error-path: A failed autosave stops automatic retries until manual Sa… | ✅ | Session/autosave contracts and combined browser/live smoke pass. |

## Local verification — 2026-11-01

Autosave, acknowledgement timestamp, recovery, failures, serialization, account isolation and unload/Projects guarding are implemented and tested. AC4 remains partial for browser Back/Forward and other same-document route transitions; a central router guard is outside the supplied session API. Formal review/merge remains pending.
