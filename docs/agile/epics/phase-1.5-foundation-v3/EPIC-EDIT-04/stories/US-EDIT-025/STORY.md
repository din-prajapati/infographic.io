---
title: Story Card — US-EDIT-025
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-29
---

# Story Card — US-EDIT-025 — Property and Contact tabs in the V3 layout

> **Status:** 🔲 Not Started — drafted 2026-10-29. Harden with `/new-story` (test cases, Four-Pillars pre-flight, TASKS.md) before implementing.
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-09-v3-shell](../../milestones/M-EDIT-09-v3-shell.md)
> **Size:** M
> **Depends on:** US-PROP-002, US-PROP-003, US-AI-028; after US-EDIT-022 (same RightSidebar.tsx)
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md); V3 canvas mockup (`Mockups/buildographic-canvas-simplification-v3/`, untracked)

---

## Story

*As* an agent filling in a listing
*I want* the Property and Contact tabs laid out as in V3 — paste-first, grouped, and clear about what reaches the canvas
*So that* entering a listing is quick and I can see which details are on the design

---

## Acceptance Criteria

> Drafted from the 2026-10-29 V3 gap analysis. File paths are the expected touch points, to be confirmed by `/new-story`.

- [ ] **AC1 [happy-path]:** **Property tab:** the Auto-Fill card (US-PROP-003) on top, then *Listing details* — property type, headline with a character count, listing intent, price (label follows intent), location, beds · baths · area, features, status/possession. A field shown on the canvas carries a small "linked" indicator.
- [ ] **AC2 [happy-path]:** **Contact tab** (renamed from Agent): agent name, phone, email, agency, licence / RERA registration, **call to action**, agent photo and logo — read from and saved to the Brand profile (M-PROP-02), with the note "Used on every new design".
- [ ] **AC3 [happy-path]:** The call to action and the registration number bind to the canvas through `listingBindings.ts` (`contact.cta`, `contact.registration`) like the other facts.
- [ ] **AC4 [error-path]:** An invalid phone number or price shows an inline error and leaves the stored value unchanged.
- [ ] **AC5 [happy-path]:** The panel footer mirrors the export checks: "Core details provided · review before export", or which detail is missing.
- [ ] **AC6 [theme]:** The new layout works in **both light and dark themes**, as the editor does today: every new surface uses the existing theme tokens (no hard-coded hex — the Pricing and Landing pages are light-only because of exactly that), the theme toggle re-renders all of it, and text contrast is at least 4.5:1 in both themes.

---

## Out of Scope

- New listing facts beyond the CTA and registration
- Per-property overrides of the Brand profile
- Market-specific fields (EPIC-MKT-01)

---

## Engineering / PR

- **Branch:** milestone branch (see PROJECT_CONTEXT.yaml `git.branch_format`)
- **PR:** #_____
- **Expected files:**
  - `client/src/components/editor/PropertyDetailsForm.tsx` — V3 sections
  - `client/src/components/editor/AgentInfoForm.tsx` — becomes the Contact form
  - `client/src/components/editor/RightSidebar.tsx` — tab content
  - `client/src/lib/listingBindings.ts` — contact.cta, contact.registration

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] Test cases written by `/new-story`, run and recorded
- [ ] Gate 1 passes · Gate 2 (frontend) · Gate 4 (backend) as applicable
- [ ] PR merged
- [ ] STORY.md status updated to ✅ Done

---

*Story drafted: 2026-10-29*
