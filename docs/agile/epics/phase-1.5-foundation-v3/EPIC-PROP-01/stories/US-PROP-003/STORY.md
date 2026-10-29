---
title: Story Card — US-PROP-003
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-29
---

# Story Card — US-PROP-003 — Auto-Fill from a listing message, with review

> **Status:** 🔲 Not Started — drafted 2026-10-29. Harden with `/new-story` (test cases, Four-Pillars pre-flight, TASKS.md) before implementing.
> **Epic:** [EPIC-PROP-01](../../EPIC.md)
> **Milestone:** [M-PROP-01-property-record](../../milestones/M-PROP-01-property-record.md)
> **Size:** M
> **Depends on:** US-PROP-002 (intent and period fields)
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md); V3 canvas mockup (`Mockups/buildographic-canvas-simplification-v3/`, untracked)

---

## Story

*As* an agent who receives listings as WhatsApp messages
*I want* to paste the message and review what was found before it fills my Property
*So that* I stop retyping listings, and nothing in my listing changes without my say-so

---

## Acceptance Criteria

> Drafted from the 2026-10-29 V3 gap analysis. File paths are the expected touch points, to be confirmed by `/new-story`.

- [ ] **AC1 [happy-path]:** The Property tab has "Paste a listing or seller message" → **Extract & review**, which calls the existing `POST /extractions` and shows each detected fact next to its current value, each with its own checkbox.
- [ ] **AC2 [happy-path]:** Nothing changes until **Apply selected**; applied facts reach the canvas through `writeFieldToCanvas` as one undo step, and each accepted field records `origin: accepted-source-text`.
- [ ] **AC3 [edge-case]:** An existing value is never replaced unless its checkbox is ticked; empty fields are pre-ticked, filled ones are not.
- [ ] **AC4 [happy-path]:** The extractor also returns `rentalPeriod`; `listingType` maps to `transaction` (`for_sale` → sale, `for_rent` → rent, `sold` → status).
- [ ] **AC5 [security]:** Contact and brand fields are never written from pasted text — they appear as suggestions only, because the message is usually from the seller, not the agent.
- [ ] **AC6 [error-path]:** If extraction fails or times out, a message says so and the form is unchanged.

---

## Out of Scope

- Listing URL ingestion (ADR-002 delta 1)
- Reading facts from photos
- Changes to the AI chat (retired by US-EDIT-023)

---

## Engineering / PR

- **Branch:** milestone branch (see PROJECT_CONTEXT.yaml `git.branch_format`)
- **PR:** #_____
- **Expected files:**
  - `api/src/modules/infographics/services/prompt-extractor.service.ts` — add rentalPeriod
  - `client/src/components/editor/PropertyDetailsForm.tsx` — paste box + review list
  - `client/src/lib/listingBindings.ts` — apply accepted facts as one undo step

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] Test cases written by `/new-story`, run and recorded
- [ ] Gate 1 passes · Gate 2 (frontend) · Gate 4 (backend) as applicable
- [ ] PR merged
- [ ] STORY.md status updated to ✅ Done

---

*Story drafted: 2026-10-29*
