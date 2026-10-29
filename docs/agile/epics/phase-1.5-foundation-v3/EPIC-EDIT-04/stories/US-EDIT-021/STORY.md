---
title: Story Card — US-EDIT-021
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-29
---

# Story Card — US-EDIT-021 — Export review dialog and out-of-date image guard

> **Status:** 🔲 Not Started — drafted 2026-10-29. Harden with `/new-story` (test cases, Four-Pillars pre-flight, TASKS.md) before implementing.
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-06-linked-editing](../../milestones/M-EDIT-06-linked-editing.md)
> **Size:** M
> **Depends on:** US-EDIT-020 (shares the binding read-outs); US-EDIT-009 (Make editable)
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md); V3 canvas mockup (`Mockups/buildographic-canvas-simplification-v3/`, untracked)

---

## Story

*As* an agent about to share a design
*I want* one last check before the file downloads
*So that* I never post a design with a missing price, a placeholder, or facts that changed after the poster was generated

---

## Acceptance Criteria

> Drafted from the 2026-10-29 V3 gap analysis. File paths are the expected touch points, to be confirmed by `/new-story`.

- [ ] **AC1 [happy-path]:** **Export** opens a dialog with a preview, a checklist (headline and location · price and contact · no unresolved `[placeholders]`), the format choice (PNG/JPG as today) and **Download**.
- [ ] **AC2 [error-path]:** A missing price or contact, or a remaining placeholder, shows how to fix it and blocks Download.
- [ ] **AC3 [edge-case]:** A flat AI poster whose printed listing (`printedListing`) differs from the current facts is flagged **out of date**, with **Make editable** and **Regenerate** offered; Download is blocked until one is done.
- [ ] **AC4 [happy-path]:** When every check passes, Download behaves as today (`canvasExport.ts`).

---

## Out of Scope

- SVG/PDF export
- Export history
- Verifying photos or registration numbers

---

## Engineering / PR

- **Branch:** milestone branch (see PROJECT_CONTEXT.yaml `git.branch_format`)
- **PR:** #_____
- **Expected files:**
  - `client/src/components/editor/EditorLayout.tsx` — Export opens the dialog
  - `client/src/components/editor/ExportReviewDialog.tsx` — new
  - `client/src/lib/canvasExport.ts` — unchanged download path

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] Test cases written by `/new-story`, run and recorded
- [ ] Gate 1 passes · Gate 2 (frontend) · Gate 4 (backend) as applicable
- [ ] PR merged
- [ ] STORY.md status updated to ✅ Done

---

*Story drafted: 2026-10-29*
