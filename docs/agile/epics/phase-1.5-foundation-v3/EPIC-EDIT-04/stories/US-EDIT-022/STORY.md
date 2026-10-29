---
title: Story Card — US-EDIT-022
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-29
---

# Story Card — US-EDIT-022 — Design tab simplification

> **Status:** 🔲 Not Started — drafted 2026-10-29. Harden with `/new-story` (test cases, Four-Pillars pre-flight, TASKS.md) before implementing.
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-07-design-tab](../../milestones/M-EDIT-07-design-tab.md)
> **Size:** M
> **Depends on:** US-PROP-005 (proven looks), M-PROP-02 (logo)
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md); V3 canvas mockup (`Mockups/buildographic-canvas-simplification-v3/`, untracked)

---

## Story

*As* an agent styling a design
*I want* the Design tab to ask only which look, which accent colour, which photo, and which format and logo
*So that* styling is obvious, and changing it never loses my listing facts

---

## Acceptance Criteria

> Drafted from the 2026-10-29 V3 gap analysis. File paths are the expected touch points, to be confirmed by `/new-story`.

- [ ] **AC1 [happy-path]:** The right panel tabs are **Design / Property / Contact** (Agent renamed Contact).
- [ ] **AC2 [happy-path]:** **Look** shows the proven templates for the current format (US-PROP-005) as preview cards; choosing one re-applies the template and refills it from the Property and Brand profile in one undo step.
- [ ] **AC3 [edge-case]:** For a flat AI poster, Look is hidden with a hint: "This design is one image — regenerate it to change the look."
- [ ] **AC4 [happy-path]:** **Accent colour** (5 swatches + custom) replaces the Brand Styles grid and "None Selected"; a saved palette maps to its accent on load. **Property photo** offers recent photos and Upload. **Format & brand logo** is collapsed by default.
- [ ] **AC5 [happy-path]:** Quick Styles moves to the left rail's **Text** tool; nothing is removed from the canvas tools.

---

## Out of Scope

- Editor-wide light theme, phone layout
- New templates
- Removing shapes, fonts, crop or adjustments

---

## Engineering / PR

- **Branch:** milestone branch (see PROJECT_CONTEXT.yaml `git.branch_format`)
- **PR:** #_____
- **Expected files:**
  - `client/src/components/editor/RightSidebar.tsx` — Design tab sections
  - `client/src/components/editor/TemplatesPanel.tsx` — Look cards
  - `client/src/components/editor/BrandPaletteDialog.tsx` — accent mapping
  - `client/src/components/editor/LeftSidebar.tsx` — Text tool gets Quick Styles

---

## Notes

Replaces the behaviour that production checks P-25/P-26 test — update those rows in `docs/testing/PHASE_0_HUMAN_QA_CHECKLIST.md` when this ships.

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] Test cases written by `/new-story`, run and recorded
- [ ] Gate 1 passes · Gate 2 (frontend) · Gate 4 (backend) as applicable
- [ ] PR merged
- [ ] STORY.md status updated to ✅ Done

---

*Story drafted: 2026-10-29*
