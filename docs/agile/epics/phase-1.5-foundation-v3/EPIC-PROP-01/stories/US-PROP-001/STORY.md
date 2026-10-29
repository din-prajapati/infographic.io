---
title: Story Card — US-PROP-001
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-29
---

# Story Card — US-PROP-001 — Property as a saved record

> **Status:** 🔲 Not Started — drafted 2026-10-29. Harden with `/new-story` (test cases, Four-Pillars pre-flight, TASKS.md) before implementing.
> **Epic:** [EPIC-PROP-01](../../EPIC.md)
> **Milestone:** [M-PROP-01-property-record](../../milestones/M-PROP-01-property-record.md)
> **Size:** L
> **Depends on:** —
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md); V3 canvas mockup (`Mockups/buildographic-canvas-simplification-v3/`, untracked)

---

## Story

*As* a real-estate agent
*I want* each listing saved once as a Property that my designs point to
*So that* two designs for the same flat never disagree, and I never retype a listing

---

## Acceptance Criteria

> Drafted from the 2026-10-29 V3 gap analysis. File paths are the expected touch points, to be confirmed by `/new-story`.

- [ ] **AC1 [happy-path]:** A new Prisma model `Property` (organization-owned; headline, location/address, property type, beds, baths, area + unit, features, the price fields of US-PROP-002, status, photo references) exists, and `Infographic` gains a nullable `propertyId`. Migration applied through the existing `prisma migrate deploy` path.
- [ ] **AC2 [happy-path]:** Opening a design that has a `propertyId` fills `usePropertyStore` from the Property; editing a fact saves it to the Property (debounced), not to the design's embedded `listing`.
- [ ] **AC3 [rollback]:** A design saved before this story (embedded `listing` from US-EDIT-018, or no listing at all) still opens with the same facts. On first save it gets a Property created from its embedded listing and its `propertyId` set; nothing is lost.
- [ ] **AC4 [security]:** Property endpoints are scoped to the caller's organization: reading or writing another organization's Property returns 404, and `propertyId` on a design cannot point at another organization's Property.
- [ ] **AC5 [happy-path]:** A minimal **My Properties** page lists properties (title/location, last updated, number of designs) with "New design for this property" and opens the editor bound to it.
- [ ] **AC6 [concurrent]:** With two designs on one Property, a price edited in design A shows in design B the next time B is opened. Live multi-tab sync is not required.

---

## Out of Scope

- Campaigns, kits, property revision history UI, photo approval workflow
- Live multi-tab sync
- Sharing a Property across organizations
- Structured price parsing (US-PROP-002) and Auto-Fill (US-PROP-003)

---

## Engineering / PR

- **Branch:** milestone branch (see PROJECT_CONTEXT.yaml `git.branch_format`)
- **PR:** #_____
- **Expected files:**
  - `api/prisma/schema.prisma` — Property model, Infographic.propertyId
  - `api/src/modules/properties/*` — new module: controller, service, DTOs
  - `api/src/modules/designs/*` — accept/return propertyId
  - `client/src/hooks/usePropertyStore.ts` — load from / save to a Property
  - `client/src/lib/canvasState.ts` — captureCanvasData / applySavedListing hand off to the Property
  - `client/src/pages/MyPropertiesPage.tsx` — new page; route in App.tsx

---

## Notes

Biggest story in the phase; `/new-story` may split it (model + API, then editor + page).

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] Test cases written by `/new-story`, run and recorded
- [ ] Gate 1 passes · Gate 2 (frontend) · Gate 4 (backend) as applicable
- [ ] PR merged
- [ ] STORY.md status updated to ✅ Done

---

*Story drafted: 2026-10-29*
