---
title: Story Card — US-PROP-004
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-29
---

# Story Card — US-PROP-004 — Element binding types on the template contract

> **Status:** 🔲 Not Started — drafted 2026-10-29. Harden with `/new-story` (test cases, Four-Pillars pre-flight, TASKS.md) before implementing.
> **Epic:** [EPIC-PROP-01](../../EPIC.md)
> **Milestone:** [M-PROP-03-template-contract](../../milestones/M-PROP-03-template-contract.md)
> **Size:** M
> **Depends on:** — (independent of US-PROP-001)
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md); V3 canvas mockup (`Mockups/buildographic-canvas-simplification-v3/`, untracked)

---

## Story

*As* an agent (and the editor behind them)
*I want* every text element to carry an explicit link type — field, compound or independent
*So that* the editor can show, detach and reconnect links reliably, and templates are a dependable contract for kits later

---

## Acceptance Criteria

> Drafted from the 2026-10-29 V3 gap analysis. File paths are the expected touch points, to be confirmed by `/new-story`.

- [ ] **AC1 [happy-path]:** Canvas text elements gain `binding: { type: "field" | "compound" | "independent", key?, parts? }` in `canvasTypes.ts`; `listingBindings.ts` reads `binding` first.
- [ ] **AC2 [rollback]:** Designs and templates saved before this story migrate on load: a fact `slot` becomes a field binding, the specs/facts line becomes compound (beds, baths, area), untagged text becomes independent. Rendering is unchanged.
- [ ] **AC3 [happy-path]:** **Detach** sets `independent` and keeps the displayed text; **Reconnect** sets a field binding and adopts the field's current value — element text is never imported into a field.
- [ ] **AC4 [happy-path]:** The binding is saved with the design and with templates, and survives Save → reopen.
- [ ] **AC5 [edge-case]:** A unit test runs the migration over all curated premium templates and asserts every fact element gets the expected binding.

---

## Out of Scope

- Any UI for links (US-EDIT-020)
- New template content

---

## Engineering / PR

- **Branch:** milestone branch (see PROJECT_CONTEXT.yaml `git.branch_format`)
- **PR:** #_____
- **Expected files:**
  - `client/src/lib/canvasTypes.ts` — binding type
  - `client/src/lib/listingBindings.ts` — read binding; detach/reconnect
  - `api/scripts/data/premium-templates.data.ts` — explicit bindings
  - `api/tests/canvas/*` — migration test

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] Test cases written by `/new-story`, run and recorded
- [ ] Gate 1 passes · Gate 2 (frontend) · Gate 4 (backend) as applicable
- [ ] PR merged
- [ ] STORY.md status updated to ✅ Done

---

*Story drafted: 2026-10-29*
