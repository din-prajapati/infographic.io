---
title: Story Card — US-EDIT-026
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-29
---

# Story Card — US-EDIT-026 — Edit Elements review — confirm links before a poster becomes editable

> **Status:** 🔲 Not Started — drafted 2026-10-29. Harden with `/new-story` (test cases, Four-Pillars pre-flight, TASKS.md) before implementing.
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-10-extraction-review](../../milestones/M-EDIT-10-extraction-review.md)
> **Size:** L
> **Depends on:** US-EDIT-009, US-PROP-004
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md); V3 canvas mockup (`Mockups/buildographic-canvas-simplification-v3/`, untracked)

---

## Story

*As* an agent turning an AI poster into an editable design
*I want* to see what text was found, check what each piece will link to, and confirm it
*So that* the editable version shows my real listing values, and nothing from the image quietly changes my listing

---

## Acceptance Criteria

> Drafted from the 2026-10-29 V3 gap analysis. File paths are the expected touch points, to be confirmed by `/new-story`.

- [ ] **AC1 [spike-gate]:** **Before building:** a one-session spike runs the real extraction (US-AI-048) on 5 real generated posters and records here whether text, position and role come back well enough. If fewer than 4 of 5 are usable, this story drops the Locate highlight and keeps text + suggested link only.
- [ ] **AC2 [happy-path]:** **Make editable** on a flat AI poster opens a review panel listing each found text element: its role, the text found in the image, a suggested link (any bindable field, or *Independent text*), and the value it will show after linking.
- [ ] **AC3 [happy-path]:** **Locate** highlights that element's region on the canvas.
- [ ] **AC4 [edge-case]:** An element with a low-confidence or missing suggestion needs an explicit choice; **Confirm** stays disabled until every element is assigned.
- [ ] **AC5 [security]:** Linking adopts the current Property / Contact value; text found in the image never overwrites a listing fact.
- [ ] **AC6 [happy-path]:** **Confirm** replaces the flat poster with its background plus editable, linked elements as one undo step; **Cancel** keeps the flat image and every fact unchanged.
- [ ] **AC7 [happy-path]:** The compose response carries, per element, the detected text, a role and a confidence; results stay cached as today.

---

## Out of Scope

- Reading arbitrary uploaded posters (only AI-generated designs)
- Better text removal from the background
- Learning from corrections

---

## Engineering / PR

- **Branch:** milestone branch (see PROJECT_CONTEXT.yaml `git.branch_format`)
- **PR:** #_____
- **Expected files:**
  - `client/src/components/editor/CanvasEditToolbar.tsx` — Make editable opens the review
  - `client/src/components/editor/ExtractionReviewPanel.tsx` — new
  - `client/src/lib/canvasState.ts` — loadComposedDesignToCanvas applies confirmed links
  - `api/src/modules/ai-generation/**/generations.service.ts` — detected text + role + confidence per element

---

## Notes

This is V3's "Edit Elements" flow. V3 only simulates it with fixed sample positions; ours runs on real extraction, which is why the spike gate comes first.

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] Test cases written by `/new-story`, run and recorded
- [ ] Gate 1 passes · Gate 2 (frontend) · Gate 4 (backend) as applicable
- [ ] PR merged
- [ ] STORY.md status updated to ✅ Done

---

*Story drafted: 2026-10-29*
