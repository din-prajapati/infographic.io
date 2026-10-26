---
title: Story Card — US-EDIT-014
type: story
tags: [orion, edit, canvas, binding]
updated: 2026-10-25
---

# Story Card — US-EDIT-014 — Foundation: one binding contract for listing facts

> **Status:** 🔲 Not Started
> **Epic:** [EPIC-EDIT-03](../../EPIC.md)
> **Milestone:** [M-EDIT-05-one-source-of-truth](../../milestones/M-EDIT-05-one-source-of-truth.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Stage:** **Foundation — sequential. Merges before Lanes A and B fork.**
> **Engine:** Claude (primary)
> **Created:** 2026-10-25 | **Closed:** —

```yaml
depends_on: []
owns:
  - client/src/lib/listingBindings.ts        # new
  - client/src/lib/slotIds.ts
  - client/src/lib/templateSlots.ts
  - client/src/lib/canvasState.ts            # delete local LISTING_FIELD_TO_SLOT, import instead
  - client/src/lib/layout/connectLayout.ts   # delete local FIELD_TO_SLOT, import instead
  - client/src/hooks/usePropertyStore.ts
  - client/src/hooks/useAgentStore.ts
  - client/src/lib/__tests__/**
may_read:
  - client/src/components/editor/TemplateSlotSection.tsx   # the slot catalogues
forbidden:
  - client/src/components/**                 # Lanes A, B and C
  - api/**                                   # no backend change in this milestone
verification:
  - npm run check
  - npm run test:unit:client
risk: medium        # two call sites stop owning their own map; hydration touches every design load
```

---

## User Story

**As** a listing agent,
**I want** each listing fact stored once, with the canvas showing that stored value,
**so that** the price in the sidebar is always the price on my design.

---

## Context

Two maps from listing field to canvas slot exist and already disagree:
`canvasState.ts` (`LISTING_FIELD_TO_SLOT`, maps `stats` → `property.specs`) and
`connectLayout.ts` (`FIELD_TO_SLOT`, maps `stats` → `property.facts`). Both carry a "keep in sync"
comment. The templates use both ids: *Premium Listing — Story* tags its facts `property.facts`,
*MLS Listing Sheet* uses `property.specs`.

`updateSlot()` (`templateSlots.ts`) already writes a value to every element carrying a slot in one
history entry. This story publishes the one map and the three functions both lanes call. It changes
no component.

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** `client/src/lib/listingBindings.ts` exports `FIELD_TO_SLOT` and
      `SLOT_TO_FIELD`. `canvasState.ts` and `connectLayout.ts` import it and no longer declare their
      own map.
- [ ] **AC2 [happy-path]:** `stats` resolves to `property.specs` **and** `property.facts` (D5): a
      store→canvas write updates elements carrying either id, and both ids map back to `stats`.
- [ ] **AC3 [happy-path]:** `writeFieldToCanvas(field, value)` updates every element tagged with the
      field's slot(s) and produces exactly **one** history entry per call.
- [ ] **AC4 [happy-path]:** `hydrateStoresFromCanvas()` fills the property and agent stores from the
      canvas's slot-tagged text: a real value hydrates as itself; a bracketed placeholder (`[Price]`,
      `[Property\nname]` — match with `[\s\S]`) hydrates as `''`.
- [ ] **AC5 [error-path]:** `hydrateStoresFromCanvas()` on a canvas with **no** slot-tagged text is a
      no-op — it does not reset or blank any store field. (After a poster placement the slot layers
      are gone; the stores must keep the user's facts.)
- [ ] **AC6 [error-path]:** A field with no slot (e.g. `website`) and a slot with no field (e.g.
      `openHouse.date`, `report.kpis`) are handled without throwing: the write is a no-op, the lookup
      returns `undefined`.
- [ ] **AC7 [error-path]:** A framing shape carrying `frameOf` (BL-44) is never read or written as a
      slot value, and a non-text element carrying a text slot is skipped by hydration.
- [ ] **AC8 [happy-path]:** No file under `client/src/components/` is changed.
- [ ] **AC9 [happy-path]:** `restoreCanvasData` (the single load path for templates and saved designs)
      calls `hydrateStoresFromCanvas` after loading, so D4's "fill the stores on load" happens without
      any component change. *Added 2026-10-26 during implementation: no story wired hydration to load.*

---

## The map (starting point — partial by design)

| Store field | Slot(s) | Note |
|---|---|---|
| `property.headline` | `property.headline` | |
| `property.price` | `property.price` | |
| `property.address` | `property.location` | |
| `stats` (from `beds`, `baths`, `sqft`) | `property.specs`, `property.facts` | **Q1 answered** — store→canvas only |
| `property.description` | `property.description` | |
| `property.features` | `property.features` | array ↔ newline-separated text |
| `agent.name` | `agent.name` | |
| `agent.phone` | `agent.phone` | |
| `agent.email` | `agent.email` | |
| `agent.license` | `agent.rera` | |
| `agent.brokerage` | `brand.name` | **Q2 answered** — the Agent tab's Brokerage field is the only editor of the agency name |

No slot: `agent.website`, `property.type`, `property.locale`. No field: `property.heroImage`,
`property.galleryImage`, `openHouse.*`, `report.*`, `agent.photo`, `agent.cta`, `brand.logo`,
`brand.accentColor`. Do not invent slots or fields to make the map total.

---

## Questions — answered by Dinesh, 2026-10-26

- **Q1 — the specs line.** The store holds `beds`, `baths`, `sqft` as separate values; the canvas
  shows one sentence. Store→canvas is a formatter. Canvas→store (D3) would need parsing free text.
  **Answer: store→canvas only.** A canvas edit to the specs line stays on the canvas and does not
  touch `beds`/`baths`/`sqft` — a documented exception to D3.
- **Q2 — agency name.** `agent.brokerage` maps to `brand.name`, which D2 keeps in the Design tab.
  **Answer: the Agent tab owns it.** `agent.brokerage` is bound to `brand.name`; the Design tab no
  longer shows a Brand / Agency Name field. The Design tab keeps canvas-design controls only (logo,
  accent colour, styles).

---

## Out of Scope

- Any component change (Lanes A, B, C).
- A Prisma or stored-data migration (D4).
- Binding image slots (`heroImage`, `agent.photo`, `brand.logo`).

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-EDIT-014-01 | Unit | P0 | Given both modules, When imported, Then they share one `FIELD_TO_SLOT` and neither declares its own | 🔲 | |
| TC-EDIT-014-02 | Unit | P0 | Given a canvas with `property.facts` and one with `property.specs`, When `stats` is written, Then both update | 🔲 | |
| TC-EDIT-014-03 | Unit | P0 | Given a price write, When it lands, Then history grows by exactly one | 🔲 | |
| TC-EDIT-014-04 | Unit | P0 | Given `[Price]` and `[Property\nname]` on the canvas, When hydrated, Then the fields are `''` | 🔲 | |
| TC-EDIT-014-05 | Unit | P0 | Given filled stores and a canvas with no slot text, When hydrated, Then the stores are unchanged | 🔲 | |
| TC-EDIT-014-06 | Unit | P1 | Given `website` and `openHouse.date`, When written/looked up, Then no throw, no change | 🔲 | |
| TC-EDIT-014-07 | Unit | P1 | Given a `frameOf` shape and a shape tagged with a text slot, When hydrated, Then neither is read | 🔲 | |
| TC-EDIT-014-08 | Unit | P0 | Given saved canvas data with slot text, When `restoreCanvasData` runs, Then the stores hold its values; given data with no slot text, Then the stores are unchanged | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] Gate 1 passes (`npm run check`, `npm run test:unit:client`)
- [ ] PR merged (milestone PR #_____)
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

*Story created: 2026-10-25*
