---
title: Story Card — US-PROP-004
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-29
---

# Story Card — US-PROP-004 — Element binding types on the template contract

> **Status:** 🔲 Not Started — hardened 2026-10-29 by /new-story
> **Epic:** [EPIC-PROP-01](../../EPIC.md)
> **Milestone:** [M-PROP-03-template-contract](../../milestones/M-PROP-03-template-contract.md)
> **Size:** M
> **Depends on:** — (independent of US-PROP-001)
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md); V3 canvas mockup (`Mockups/buildographic-canvas-simplification-v3/`, untracked)

---

## Story

*As* an agent (and the editor working for them)
*I want* every text element to carry an explicit link type — field, compound or independent
*So that* the editor can show, detach and reconnect links reliably, and templates become a dependable contract for kits

---

## Design decision — `binding` sits beside `slot`

`binding` is **additive**; it does not replace `slot`. `slot` stays the write channel: `writeFieldToCanvas`,
`writeCanvasToField` and `hydrateStoresFromCanvas` all find elements by `el.slot`. `binding` names the link type and key.
Legacy elements get a `binding` on load from their `slot`; elements that already have one are left alone.

| `el.slot` | `binding` |
|---|---|
| `property.specs` or `property.facts` (both map to `stats`) | `{ type: 'compound', parts: ['beds', 'baths', 'sqft'] }` |
| any other slot in `SLOT_TO_FIELD` | `{ type: 'field', key: <BoundField> }` |
| no slot, or a slot not in `SLOT_TO_FIELD` | `{ type: 'independent' }` |
| non-text element | unchanged |

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** `client/src/lib/canvasTypes.ts` exports `BindingDescriptor = { type: 'field'; key: BoundField } | { type: 'compound'; parts: string[] } | { type: 'independent' }`, and `BaseElement` gains optional `binding?: BindingDescriptor` (move `BoundField` into `canvasTypes.ts` and re-export it if importing it creates a cycle). `npm run check` has no new errors.
- [ ] **AC2 [rollback]:** `migrateElementBinding(el)` exported from `listingBindings.ts` returns: `field`/`price` for `slot: 'property.price'`; `compound` with parts `beds, baths, sqft` for `slot: 'property.specs'`; `independent` for text with no slot; the element unchanged for non-text or when `binding` is already set. It never mutates its input and never changes `content`, `slot` or `slotFormat`. It runs inside `restoreCanvasData()` (`client/src/lib/canvasState.ts`), which every design and template load goes through.
- [ ] **AC3 [happy-path]:** `detachBinding(el)` returns the element with `binding: { type: 'independent' }` and the same `content`, writing nothing to any store. `reconnectBinding(el, 'price')` with the store price "₹2.5 Cr" returns `binding: { type: 'field', key: 'price' }` and `content === applySlotFormat(el.slotFormat, '₹2.5 Cr')`, and never calls `setProperty` / `setAgent` — element text is never imported into a field.
- [ ] **AC4 [happy-path]:** An element with `binding: { type: 'field', key: 'price' }` keeps exactly that `binding` after `captureCanvasData()` → `restoreCanvasData()` (save and reopen).
- [ ] **AC5 [edge-case]:** `api/scripts/data/premium-templates.data.ts` gives every slot-tagged `text()` an explicit `binding`, and a new `api/tests/canvas/element-binding-migration.spec.ts` asserts on the seed data: every `property.specs` / `property.facts` element is `compound`; every element whose slot is in `SLOT_TO_FIELD` (and is not specs/facts) is `field` with the key its slot maps to; every slot-tagged element whose slot is **not** in `SLOT_TO_FIELD` (`agent.cta`, `openHouse.*`, `report.*`, …) is `independent` — matching the design table above. The spec cannot import client code, so it carries its own copy of the slot→field map with a comment pointing at `listingBindings.ts`; counts are computed in the test, not hard-coded. `npm run test:unit` passes, including `template-one-fact-per-element.spec.ts`.

---

## Out of Scope

- Any linking UI — showing, detaching or reconnecting in the editor is US-EDIT-020 (the helpers here have no call sites yet)
- Changes to `writeFieldToCanvas`, `writeCanvasToField` or `hydrateStoresFromCanvas`
- New template content
- Migrating bindings on save — only on load

---

## Engineering / PR

- **Branch:** `feat/prop/m-03-template-contract`
- **PR:** #_____
- **Primary files touched:**
  - `client/src/lib/canvasTypes.ts` — `BindingDescriptor`, `binding?` on `BaseElement`
  - `client/src/lib/listingBindings.ts` — `migrateElementBinding`, `detachBinding`, `reconnectBinding`
  - `client/src/lib/canvasState.ts` — call `migrateElementBinding` on every element inside `restoreCanvasData()`
  - `client/src/lib/__tests__/listingBindings.binding.spec.ts` — unit tests for the three helpers (new)
  - `api/scripts/data/premium-templates.data.ts` — `binding?` on `TextOpts`; explicit bindings on slot-tagged elements
  - `api/tests/canvas/element-binding-migration.spec.ts` — seed-data assertions (new)

---

## AI Implementation Prompt

> Paste this block into Claude Code to implement the story.

```
Context: Buildographic (code name InfographicAI) — React client canvas types + bindings; NestJS seed data; see CLAUDE.md.

Story: US-PROP-004 — Element binding types on the template contract

Acceptance Criteria:
AC1: BindingDescriptor in canvasTypes.ts; binding? on BaseElement; no new type errors.
AC2: migrateElementBinding(el): property.specs/property.facts → compound (beds, baths, sqft); other SLOT_TO_FIELD slots → field;
     untagged text → independent; non-text or already-bound → unchanged; never mutates; content/slot/slotFormat unchanged; runs inside
     restoreCanvasData() (canvasState.ts), which every design and template load goes through.
AC3: detachBinding → independent, same content, no store write. reconnectBinding(el, key) → field + store value via applySlotFormat;
     never writes the store.
AC4: binding survives captureCanvasData → restoreCanvasData unchanged.
AC5: premium-templates.data.ts slot-tagged text() calls carry explicit bindings: specs/facts → compound; slots in SLOT_TO_FIELD →
     field; other slots (agent.cta, openHouse.*, report.*) → independent. api/tests/canvas/element-binding-migration.spec.ts asserts
     them with its own copy of the slot→field map (it cannot import client code); counts computed in the test.

Constraints:
- binding is ADDITIVE beside slot. Never remove slot. Do not change writeFieldToCanvas / writeCanvasToField / hydrateStoresFromCanvas.
- The store fields are beds, baths, sqft (not area).
- Tests under api/tests/ cannot import client/src/. Unit-test the helpers under client/src/lib/__tests__/ instead.

Out of Scope: any UI (US-EDIT-020) · changes to the three write functions · new template content · save-time migration.

Primary files (do NOT touch others): client/src/lib/canvasTypes.ts · client/src/lib/listingBindings.ts · client/src/lib/canvasState.ts
(load path only) · client/src/lib/__tests__/listingBindings.binding.spec.ts (new) · api/scripts/data/premium-templates.data.ts ·
api/tests/canvas/element-binding-migration.spec.ts (new)

Rules: touch only these files; run `npm run check` and `npm run test:unit`; report files changed, ACs checked, test output.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-PROP-004-01 | Manual | P0 | Given a design saved before this story (slots, no bindings), when it is opened, then every text element in the canvas store has a `binding` (devtools) | 🔲 | |
| TC-PROP-004-02 | Manual | P0 | Given a price element with a field binding, when the design is saved and reopened, then its `binding` is identical | 🔲 | |
| TC-PROP-004-03 | Unit | P1 | `migrateElementBinding` on `slot: 'property.price'` → field/price; content and slot unchanged | 🔲 | |
| TC-PROP-004-04 | Unit | P1 | `migrateElementBinding` on `slot: 'property.specs'` → compound beds/baths/sqft | 🔲 | |
| TC-PROP-004-05 | Unit | P1 | `migrateElementBinding` on untagged text → independent; on a shape → unchanged | 🔲 | |
| TC-PROP-004-06 | Unit | P1 | `detachBinding` → independent, same content, no `setProperty`/`setAgent` call | 🔲 | |
| TC-PROP-004-07 | Unit | P1 | `reconnectBinding(el, 'price')` with store "₹2.5 Cr" → key price, content "₹2.5 Cr", no store write | 🔲 | |
| TC-PROP-004-08 | Unit | P1 | Seed data: all compound slots compound, all field slots field with the right key — `element-binding-migration.spec.ts` | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅ · all test cases run and recorded
- [ ] `npm run check` · `npm run test:unit` pass
- [ ] TC-PROP-004-01/02 confirmed in the browser
- [ ] PR merged (PR #_____)
- [ ] [TASKS.md](./TASKS.md) fully checked ✅ · STORY.md status `✅ Done`

---

## Implementation Update (log)

> Appended by code-agent during/after implementation. Newest entries on top.

### 2026-10-30 — Opus review of PR #83
- AC5 fixed: the seed data also tags `agent.cta`, `openHouse.*` and `report.*`, which are not in `SLOT_TO_FIELD`; those are `independent`, as the design table says. The API-side spec needs its own copy of the slot→field map.
- The load point is `restoreCanvasData()`; the AC4 round trip is `captureCanvasData()` → `restoreCanvasData()`.

### 2026-10-29 — hardened by /new-story
- Decided `binding` sits beside `slot` (the three write functions find elements by slot).
- Compound parts use the real store field names `beds, baths, sqft` (the draft said "area").
- API-side tests can't import client code, so the seed-data spec checks annotations, and the helpers get a client-side spec.

---

*Story drafted: 2026-10-29 · hardened: 2026-10-29*
