---
title: Story Card — US-EDIT-023
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-29
---

# Story Card — US-EDIT-023 — AI Assistant — Create design or Generate Background

> **Status:** 🔲 Not Started — drafted 2026-10-29. Harden with `/new-story` (test cases, Four-Pillars pre-flight, TASKS.md) before implementing.
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-08-ai-assistant](../../milestones/M-EDIT-08-ai-assistant.md)
> **Size:** L
> **Depends on:** US-PROP-003, US-EDIT-009
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md); V3 canvas mockup (`Mockups/buildographic-canvas-simplification-v3/`, untracked)

---

## Story

*As* an agent using AI on a listing
*I want* one Assistant panel where I choose either a full design for inspiration or only a new background
*So that* I get ideas when I want them, and a better visual without risking my text when I don't

---

## Acceptance Criteria

> Drafted from the 2026-10-29 V3 gap analysis. File paths are the expected touch points, to be confirmed by `/new-story`.

- [ ] **AC1 [happy-path]:** **AI Assistant** opens in the right panel with a task choice: **Create design** (a complete poster) or **Generate Background** (image only). Both show "Using this listing" with a Review details link, and read Property, Contact and Design.
- [ ] **AC2 [happy-path]:** Style chips (Luxury / Modern / Minimal), one optional line of direction and **Add property photo** feed the prompt; the button shows the credit it will use.
- [ ] **AC3 [happy-path]:** The result is shown next to the current design with **Use** (one undo step) and **Keep current**. A Create design result offers **Make editable** (US-EDIT-009).
- [ ] **AC4 [edge-case]:** A Generate Background preview is temporary; applying it replaces only the background, and every linked text element is unchanged.
- [ ] **AC5 [happy-path]:** The floating "Describe listing" chat is removed; listing text pasted into the Assistant goes through US-PROP-003's review first, so facts always land in the Property.

---

## Out of Scope

- Conversational AI (EPIC-AI-01, backlog)
- Refine chips (US-AI-015)
- Campaign or kit generation

---

## Engineering / PR

- **Branch:** milestone branch (see PROJECT_CONTEXT.yaml `git.branch_format`)
- **PR:** #_____
- **Expected files:**
  - `client/src/components/editor/RightSidebar.tsx` — Assistant mode replaces the Quick Generate header
  - `client/src/components/ai-chat/*` — retire the floating chat
  - `client/src/lib/canvasState.ts` — background-only apply

---

## Notes

Generation already distinguishes a background from a full poster (`composition`, US-EDIT-011), so both tasks reuse the existing endpoint.

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] Test cases written by `/new-story`, run and recorded
- [ ] Gate 1 passes · Gate 2 (frontend) · Gate 4 (backend) as applicable
- [ ] PR merged
- [ ] STORY.md status updated to ✅ Done

---

*Story drafted: 2026-10-29*
