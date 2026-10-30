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
> **Depends on:** — (independent of US-PROP-001; additive exports in `listingBindings.ts`, so it runs in parallel with US-PROP-007/003 and rebases if it merges second)
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

- [x] **AC1 [happy-path]:** `client/src/lib/canvasTypes.ts` exports `BindingDescriptor = { type: 'field'; key: BoundField } | { type: 'compound'; parts: string[] } | { type: 'independent' }`, and `BaseElement` gains optional `binding?: BindingDescriptor` (move `BoundField` into `canvasTypes.ts` and re-export it if importing it creates a cycle). `npm run check` has no new errors.
- [x] **AC2 [rollback]:** `migrateElementBinding(el)` exported from `listingBindings.ts` returns: `field`/`price` for `slot: 'property.price'`; `compound` with parts `beds, baths, sqft` for `slot: 'property.specs'`; `independent` for text with no slot; the element unchanged for non-text or when `binding` is already set. It never mutates its input and never changes `content`, `slot` or `slotFormat`. It runs inside `restoreCanvasData()` (`client/src/lib/canvasState.ts`), which every design and template load goes through.
- [x] **AC3 [happy-path]:** `detachBinding(el)` returns the element with `binding: { type: 'independent' }` and the same `content`, writing nothing to any store. `reconnectBinding(el, 'price')` with the store price "₹2.5 Cr" returns `binding: { type: 'field', key: 'price' }` and `content === applySlotFormat(el.slotFormat, '₹2.5 Cr')`, and never calls `setProperty` / `setAgent` — element text is never imported into a field.
- [x] **AC4 [happy-path]:** An element with `binding: { type: 'field', key: 'price' }` keeps exactly that `binding` after `captureCanvasData()` → `restoreCanvasData()` (save and reopen).
- [x] **AC5 [edge-case]:** `api/scripts/data/premium-templates.data.ts` gives every slot-tagged `text()` an explicit `binding`, and a new `api/tests/canvas/element-binding-migration.spec.ts` asserts on the seed data: every `property.specs` / `property.facts` element is `compound`; every element whose slot is in `SLOT_TO_FIELD` (and is not specs/facts) is `field` with the key its slot maps to; every slot-tagged element whose slot is **not** in `SLOT_TO_FIELD` (`agent.cta`, `openHouse.*`, `report.*`, …) is `independent` — matching the design table above. The spec cannot import client code, so it carries its own copy of the slot→field map with a comment pointing at `listingBindings.ts`; counts are computed in the test, not hard-coded. `npm run test:unit` passes, including `template-one-fact-per-element.spec.ts`.

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
| TC-PROP-004-01 | Manual | P0 | Given a design saved before this story (slot-tagged text, no `binding`), when it is opened in the editor, then every text element in the canvas store has a `binding` (devtools): a slot in `SLOT_TO_FIELD` gives field or compound, any other text gives independent; non-text elements get none. | ✅ | price→field:price, headline→field:headline, specs→compound[beds,baths,sqft], agent.cta→independent, untagged text→independent, slot-tagged shape→none (live `useCanvasStore` read in Chrome) — Chrome, local dev, 2026-10-30 |
| TC-PROP-004-02 | Manual | P0 | Given a price element with `binding: { type: 'field', key: 'price' }`, when the design is saved, closed and reopened, then its `binding` is deep-identical (devtools before and after). | ✅ | Saved via editor Save dialog (same design id), full reload: all 6 elements' bindings deep-equal before/after (key-order-insensitive; JSONB reorders keys) — Chrome, local dev, 2026-10-30 |
| TC-PROP-004-03 | Unit | P1 | Given a text element with `slot: 'property.price'` and no binding, when `migrateElementBinding(el)` runs, then it returns `binding: { type: 'field', key: 'price' }` with `content`, `slot`, `slotFormat` unchanged. | ✅ | |
| TC-PROP-004-04 | Unit | P1 | Given a text element with `slot: 'property.specs'`, when `migrateElementBinding(el)` runs, then `binding` is `{ type: 'compound', parts: ['beds', 'baths', 'sqft'] }` (not `area`). | ✅ | |
| TC-PROP-004-05 | Unit | P1 | Given (a) a text element with no slot and (b) a shape, when `migrateElementBinding` runs on each, then (a) is independent and (b) is returned unchanged with no `binding`. | ✅ | |
| TC-PROP-004-06 | Unit | P1 | Given a field-bound text element and spies on `setProperty` / `setAgent`, when `detachBinding(el)` runs, then it returns `binding: { type: 'independent' }` with identical `content`, and neither spy is called. | ✅ | |
| TC-PROP-004-07 | Unit | P1 | Given an independent text element (no `slotFormat`), the store price "₹2.5 Cr" and spies on `setProperty` / `setAgent`, when `reconnectBinding(el, 'price')` runs, then `binding` is `{ type: 'field', key: 'price' }`, `content === '₹2.5 Cr'`, and neither spy is called. | ✅ | |
| TC-PROP-004-08 | Unit | P1 | Given the seed data and the spec's own slot→field map, when `element-binding-migration.spec.ts` runs, then every specs/facts element is compound and every other `SLOT_TO_FIELD` slot is field with the mapped key. | ✅ | |
| TC-PROP-004-09 | Unit | P1 | Given a text element with `slot: 'property.facts'`, when `migrateElementBinding(el)` runs, then it is compound `beds, baths, sqft`, same as `property.specs`. | ✅ | |
| TC-PROP-004-10 | Unit | P1 | Given an element that already has a `binding` (e.g. `property.price` detached to independent), when `migrateElementBinding(el)` runs (twice), then the binding is not overwritten and the result is unchanged (idempotent). | ✅ | |
| TC-PROP-004-11 | Unit | P1 | Given a frozen element, when `migrateElementBinding`, `detachBinding` and `reconnectBinding` run on it, then none throws, the input is unchanged, and a changed result is a new object. | ✅ | |
| TC-PROP-004-12 | Unit | P1 | Given `slot: 'property.price'`, `slotFormat: 'From {}'`, content "From ₹2.5 Cr", when `migrateElementBinding(el)` runs, then `content`, `slot`, `slotFormat` are strictly equal to the originals; only `binding` is added. | ✅ | |
| TC-PROP-004-13 | Unit | P1 | Given text elements with slots `agent.cta`, `openHouse.*`, `report.*` (not in `SLOT_TO_FIELD`), when `migrateElementBinding` runs, then each is independent and keeps its `slot`. | ✅ | |
| TC-PROP-004-14 | Unit | P1 | Given `slot: 'agent.rera'`, `slotFormat: 'RERA {}'` and the agent store license set, when `reconnectBinding(el, 'agentLicense')` runs, then `content === 'RERA <license>'` via `applySlotFormat` and `binding` is field `agentLicense`. | ✅ | |
| TC-PROP-004-15 | Unit | P1 | Given legacy canvasData (price text, specs text, untagged text, shape), when `restoreCanvasData()` loads it, then the store's elements carry field/price, compound, independent and no binding respectively — the one path for design and template loads. | ✅ | |
| TC-PROP-004-16 | Unit | P0 | Given an element with `binding: { type: 'field', key: 'price' }` in the store, when `captureCanvasData()` → `restoreCanvasData()` runs, then the restored `binding` deep-equals the original. | ✅ | |
| TC-PROP-004-17 | Unit | P1 | Given the seed data, when `element-binding-migration.spec.ts` runs, then every slot-tagged text whose slot is not in `SLOT_TO_FIELD` is independent; compound/field/independent counts are computed in the test, each > 0, and sum to the slot-tagged text total. | ✅ | |
| TC-PROP-004-18 | Unit | P1 | Given the spec's copy of the slot→field map (comment points at `FIELD_TO_SLOTS` in `listingBindings.ts`), when `npm run test:unit` runs, then `template-one-fact-per-element.spec.ts` still passes alongside the new spec. | ✅ | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅ · all test cases run and recorded
- [x] `npm run check` · `npm run test:unit` pass
- [x] TC-PROP-004-01/02 confirmed in the browser
- [ ] PR merged (PR #_____)
- [ ] [TASKS.md](./TASKS.md) fully checked ✅ · STORY.md status `✅ Done`

---

## Implementation Update (log)

> Appended by code-agent during/after implementation. Newest entries on top.

### 2026-10-30 — Codex review of PR #87 (REQUEST CHANGES — evidence only)
- Codex found every AC met and scope respected; both BLOCKING items are missing evidence, not defects.
- **Evidence item 1 closed:** orchestrator re-ran Gate 1 on `feat/prop/us-prop-004-binding-types` @ `2f7b288` — `npm run check` **exit 0**; `npm run test:unit` **exit 0** — API 61 files / 815 tests passed; client 22 files / 407 passed, 1 pre-existing skip (`loadVariation.spec.ts:176`). (Codex's own rerun failed with EPERM in its read-only sandbox.)
- **Evidence item 2 closed:** TC-PROP-004-01/02 run in Chrome — see Test Cases table. Seeded a pre-story design (no `binding`) via the API on a throwaway account; test rows deleted afterwards.


### 2026-10-30 — US-PROP-004 implementation
- Added BindingDescriptor and optional BaseElement.binding; moved BoundField to canvasTypes.ts with a compatible re-export.
- Added immutable migration, detach and read-only reconnect helpers. restoreCanvasData migrates each loaded element; captureCanvasData remains unchanged. Slot-based write/hydration functions are unchanged.
- All slot-tagged seeded text elements carry explicit descriptors, including independent CTA/open-house/report slots; no template content changed. Existing API seed assertions remain unchanged.
- Extended the supplied client tests without weakening assertions: all mapped slots, unmapped report/prototype slots, frozen inputs, idempotence and compound migration in the load path. Focused client run: 32 passed; seed and one-fact specs: 8 passed. Full suites report backend 815 passed and client 407 passed / 1 pre-existing skipped (no tests skipped by this change).
- TC-03–18 pass via the automated specs. TC-01/02 and T6 remain unrun in a browser: the design/template service needs environment setup, which this task excludes. Automated capture → JSON → restore covers AC4. No UI, CSS, NestJS runtime or schema changes, so additional visual/token/API gates do not apply.
- `npm run check` exited 0 (frontend and API TypeScript checks). Both full unit runs (including an offline retry) printed 61 backend files / 815 tests passed and 22 client files / 407 tests passed, 1 skipped. The pre-existing skip is client/src/lib/layout/__tests__/loadVariation.spec.ts:176. The unit-command sessions remain open after the passing summaries; no final process exit code was observed, so the combined gate DoD remains unchecked.
- Initial npm commands failed with EPERM at C:\Users\dinpr; reran the required commands using NODE_OPTIONS=--preserve-symlinks --preserve-symlinks-main and ancestor dependencies. No environment files read or created, no commits/push/PR, no edits outside the contracted implementation files and these requested story/task records.

### 2026-10-30 — Opus review of PR #83
- AC5 fixed: the seed data also tags `agent.cta`, `openHouse.*` and `report.*`, which are not in `SLOT_TO_FIELD`; those are `independent`, as the design table says. The API-side spec needs its own copy of the slot→field map.
- The load point is `restoreCanvasData()`; the AC4 round trip is `captureCanvasData()` → `restoreCanvasData()`.

### 2026-10-29 — hardened by /new-story
- Decided `binding` sits beside `slot` (the three write functions find elements by slot).
- Compound parts use the real store field names `beds, baths, sqft` (the draft said "area").
- API-side tests can't import client code, so the seed-data spec checks annotations, and the helpers get a client-side spec.

---

*Story drafted: 2026-10-29 · hardened: 2026-10-29*
