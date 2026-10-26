---
title: Story Card — US-EDIT-018
type: story
tags: [orion, edit, binding, persistence, ai-generation]
updated: 2026-10-26
---

# Story Card — US-EDIT-018 — Listing facts persist with the design

> **Status:** ✅ Done — merged in [#73](https://github.com/din-prajapati/infographic.io/pull/73) (2026-10-26)
> **Epic:** [EPIC-EDIT-03](../../EPIC.md)
> **Milestone:** [M-EDIT-05-one-source-of-truth](../../milestones/M-EDIT-05-one-source-of-truth.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Engine:** Claude (primary)
> **Created:** 2026-10-26 | **Closed:** 2026-10-26

```yaml
depends_on: [US-EDIT-014]
owns:
  - client/src/lib/canvasState.ts               # captureCanvasData, restoreCanvasData, loadAiVariationToCanvas
  - client/src/lib/listingBindings.ts
  - client/src/lib/__tests__/**
  - client/src/components/editor/RightSidebar.tsx   # poster note only
  - client/src/components/editor/CenterCanvas.tsx   # pass the listing through
  - client/src/components/ai-chat/AIChatBox.tsx     # carry the listing onto the variation
  - client/src/lib/api.ts                           # ResultVariation type
  - api/src/modules/ai-generation/services/ai-orchestrator.service.ts  # persist printed listing
  - api/src/modules/infographics/services/generations.service.ts       # return it
  - api/tests/**
verification:
  - npm run check
  - npm run test:unit
  - npm run test:unit:client
risk: medium
```

---

## User Story

**As** a listing agent,
**I want** the sidebar to keep my listing details with the design, and to show what an AI poster actually printed,
**so that** reopening a design or placing a poster never leaves the sidebar disagreeing with the design.

---

## Context

Found in M-EDIT-05 Gate 2 (2026-10-26):

1. After an AI poster is placed, its text is part of the image and the template's slot layers are
   removed (M-EDIT-04). D4 then leaves the stores alone, so the sidebar kept `₹85,00,000` while the
   poster printed `₹4.2 Cr`.
2. Listing facts were stored only as canvas text. A fact with no element on the template — Brokerage on
   *Premium Listing — Story*, Website and Property type everywhere — was lost on reopen.

The server already computes the exact strings it prints (`buildExpectedTexts`); it never sends them.
Decision (user, 2026-10-26): fill the fields from what the poster printed; persist the facts with the design.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** A saved design carries the listing facts (`canvasData.listing`: property and
      agent fields, logo excluded). Reopening it restores every field, including ones with no canvas element.
- [x] **AC2 [happy-path]:** On restore, the saved listing is applied first and the canvas's slot text then
      wins where it exists (D4 still holds for slot text). Fields from a previously open design do not leak
      into a design that carries its own listing.
- [x] **AC3 [error-path]:** A design or template with no `listing` (everything saved before this story, all
      seeded templates) restores exactly as before — no reset, no error.
- [x] **AC4 [happy-path]:** A completed generation stores what it printed (headline, address, price, stats
      line, agent name, brokerage, plus beds/baths/sqft), and `GET /generations/:id/variations` returns it as
      `listing` on each variation.
- [x] **AC5 [happy-path]:** Placing a **poster** (one whose placement removed slot layers) fills the
      fields from that `listing`: every non-empty printed value replaces the field. One Undo reverts the
      placement and the fields together (AC10).
- [x] **AC6 [error-path]:** A variation with no `listing` (generated before this story), or a background
      placement that kept the slot layers, leaves the fields as they are.
- [x] **AC7 [happy-path]:** While the canvas holds an AI poster, the Property and Agent tabs say that the
      design's text is part of the image and that changes apply to the next generation.

---

## Out of Scope

- Re-rendering a poster when a field changes (the text is pixels).
- Parsing the printed stats line back into beds/baths/sqft — the raw numbers come from the generation record.
- Any migration of saved designs (D4).

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-EDIT-018-01 | Unit | P0 | Given stores with a brokerage and no `brand.name` element, When captured and restored, Then brokerage is restored | ✅ |  |
| TC-EDIT-018-02 | Unit | P0 | Given design A's fields then design B with its own listing, When B restores, Then no A value remains | ✅ |  |
| TC-EDIT-018-03 | Unit | P0 | Given canvas data with no listing, When restored, Then behaviour equals US-EDIT-014 AC9 | ✅ |  |
| TC-EDIT-018-04 | Unit (api) | P0 | Given a completed generation with a stored printed listing, When variations are fetched, Then each carries it; without one, the field is absent | ✅ | `api/tests/ai-generation/printed-listing.spec.ts` — through the real service |
| TC-EDIT-018-05 | Unit | P0 | Given a poster placement over a template with slots, Then the fields hold the printed values; one Undo restores canvas and fields | ✅ | Store side unit-tested; the placement call verified in Chrome (repo rule: no mocking the image-fetch pipeline) |
| TC-EDIT-018-06 | Unit | P1 | Given a background placement or no listing, Then the fields are unchanged | ✅ |  |
| TC-EDIT-018-07 | Manual | P0 | Chrome: generate without a photo, place, Then the sidebar price equals the poster's price; save, reload, reopen, Then brokerage survives | ⚠️ | 2026-10-26: poster printed ₹4.2 Cr, headline, 3 BHK, 1,850 sq ft → sidebar showed the same; note shown; one Undo restored template + ₹85,00,000. Reopen kept Brokerage. Finding: beds/sqft stay after Undo (Q1 — stats never hydrate) |

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded
- [x] Gate 1 passes (`npm run check`, `npm run test:unit`, `npm run test:unit:client`)
- [x] Gate 2 passes (TC-EDIT-018-07)
- [x] PR merged (milestone PR #73)
- [x] [TASKS.md](./TASKS.md) task list fully checked
- [x] STORY.md status updated to ✅ Done

---

*Story created: 2026-10-26*
