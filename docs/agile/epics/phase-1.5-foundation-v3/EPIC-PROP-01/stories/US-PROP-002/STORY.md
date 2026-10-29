---
title: Story Card — US-PROP-002
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-29
---

# Story Card — US-PROP-002 — Structured price and listing intent

> **Status:** 🔲 Not Started — drafted 2026-10-29. Harden with `/new-story` (test cases, Four-Pillars pre-flight, TASKS.md) before implementing.
> **Epic:** [EPIC-PROP-01](../../EPIC.md)
> **Milestone:** [M-PROP-01-property-record](../../milestones/M-PROP-01-property-record.md)
> **Size:** M
> **Depends on:** US-PROP-001 (fields live on the Property)
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md); V3 canvas mockup (`Mockups/buildographic-canvas-simplification-v3/`, untracked)

---

## Story

*As* an agent who lists both sales and rentals
*I want* to say whether a listing is for sale or rent, and enter the price in the way I say it
*So that* a rental reads "FOR RENT · ₹50,000 / month" everywhere, and a sale reads "FOR SALE · ₹4.2 Cr"

---

## Acceptance Criteria

> Drafted from the 2026-10-29 V3 gap analysis. File paths are the expected touch points, to be confirmed by `/new-story`.

- [ ] **AC1 [happy-path]:** The Property holds `amount` (number), `currency`, `transaction` (`sale` | `rent`) and `rentalPeriod` (`month` | `week` | `year` | `day`); the display price is derived, never stored as the authority.
- [ ] **AC2 [happy-path]:** Price entry accepts `4.2 Cr`, `50 Lakh`, `50,000`, `₹50,000 / month` and formats in Indian notation: 1231231 shows as `₹12.3 L` (the V3 mockup printed the raw number — that is the bug this AC prevents).
- [ ] **AC3 [happy-path]:** The Property tab has a **Listing intent** select; the price label reads "Sale price" or "Rent per month/week/year/day". Changing intent clears the price as one undoable step; changing the rental period keeps the amount.
- [ ] **AC4 [happy-path]:** A FOR SALE / FOR RENT label binds through `listingBindings.ts`, and a rental price shows its period on the canvas, in the generation prompt (`infographic-prompt.builder.ts`) and in `buildPrintedListing`.
- [ ] **AC5 [error-path]:** An unparseable price (e.g. `abc`) shows an inline error and leaves the stored fact unchanged; a linked canvas edit with an invalid price is rejected the same way.
- [ ] **AC6 [rollback]:** A saved price string from before this story is parsed on open; if it cannot be parsed it is kept as display text, flagged for review, and export warns.

---

## Out of Scope

- Markets other than India (EPIC-MKT-01)
- Deposit / maintenance amounts as separate facts
- Currency conversion

---

## Engineering / PR

- **Branch:** milestone branch (see PROJECT_CONTEXT.yaml `git.branch_format`)
- **PR:** #_____
- **Expected files:**
  - `shared/` — price parse/format helpers with unit tests
  - `client/src/components/editor/PropertyDetailsForm.tsx` — intent + price fields
  - `client/src/lib/listingBindings.ts` — intent slot, period-aware price slot
  - `api/src/modules/ai-generation/**/infographic-prompt.builder.ts` — intent + period in the prompt and printed listing

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] Test cases written by `/new-story`, run and recorded
- [ ] Gate 1 passes · Gate 2 (frontend) · Gate 4 (backend) as applicable
- [ ] PR merged
- [ ] STORY.md status updated to ✅ Done

---

*Story drafted: 2026-10-29*
