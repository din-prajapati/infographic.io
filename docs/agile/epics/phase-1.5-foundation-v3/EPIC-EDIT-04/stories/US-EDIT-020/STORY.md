---
title: Story Card — US-EDIT-020
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-29
---

# Story Card — US-EDIT-020 — Linked-element inspector and Manage links

> **Status:** 🔲 Not Started — drafted 2026-10-29. Harden with `/new-story` (test cases, Four-Pillars pre-flight, TASKS.md) before implementing.
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-06-linked-editing](../../milestones/M-EDIT-06-linked-editing.md)
> **Size:** M
> **Depends on:** US-PROP-004, US-PROP-002
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md); V3 canvas mockup (`Mockups/buildographic-canvas-simplification-v3/`, untracked)

---

## Story

*As* an agent editing a design
*I want* to see which listing fact each text element shows, and detach, reconnect or change it
*So that* I trust that changing the price changes it everywhere, and I can keep a slogan independent

---

## Acceptance Criteria

> Drafted from the 2026-10-29 V3 gap analysis. File paths are the expected touch points, to be confirmed by `/new-story`.

- [ ] **AC1 [happy-path]:** Selecting a linked text shows a chip such as "Property → Price · Linked" with **Edit text**, **Hide**, **Detach as independent text** and **Change link** (a list of the bindable fields).
- [ ] **AC2 [happy-path]:** A compound element (beds · baths · area) edits through its component fields, and the line is derived from them.
- [ ] **AC3 [happy-path]:** Detach keeps the displayed text; Reconnect adopts the field's current value; each is one undo step.
- [ ] **AC4 [error-path]:** Editing linked text validates it (price through US-PROP-002's parser); invalid text shows an error and the fact is unchanged.
- [ ] **AC5 [happy-path]:** The Layers panel gains a **Links** view listing every text element with its binding and a show/hide control.

---

## Out of Scope

- New binding semantics (US-PROP-004 owns them)
- Reading facts from image pixels

---

## Engineering / PR

- **Branch:** milestone branch (see PROJECT_CONTEXT.yaml `git.branch_format`)
- **PR:** #_____
- **Expected files:**
  - `client/src/components/editor/RightSidebar.tsx` — element view
  - `client/src/components/editor/LayersPanel.tsx` — Links view
  - `client/src/components/editor/ContextualToolbar.tsx` — link chip + actions
  - `client/src/lib/listingBindings.ts` — detach/reconnect calls

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] Test cases written by `/new-story`, run and recorded
- [ ] Gate 1 passes · Gate 2 (frontend) · Gate 4 (backend) as applicable
- [ ] PR merged
- [ ] STORY.md status updated to ✅ Done

---

*Story drafted: 2026-10-29*
