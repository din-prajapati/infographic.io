---
title: PR Task List — US-EDIT-014
type: tasks
updated: 2026-10-25
---

# PR Task List — US-EDIT-014 — Foundation

> **Branch:** `feat/edit/m-05-one-source-of-truth` (milestone branch — Foundation is not a worktree)
> **PR:** milestone PR
> **Scope:** one field↔slot map and three binding functions; no component change

---

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md filled, 8 typed ACs
- [ ] **Muscle** — T1–T5 below
- [ ] **Map** — runbook §Contract
- [ ] **Env** — no environment changes; no migration (D4)

---

## Task Breakdown

### T1 — One map
Create `listingBindings.ts` with `FIELD_TO_SLOT` / `SLOT_TO_FIELD` per STORY.md §The map. `stats` maps to both `property.specs` and `property.facts`. Delete the local maps in `canvasState.ts` and `connectLayout.ts`; import instead.

### T2 — `writeFieldToCanvas`
Wrap `updateSlot()`; for multi-slot fields write all slots in one history entry. No-op for a field with no slot.

### T3 — `writeCanvasToField`
Slot → field lookup → store setter. Unknown slot: no-op, no throw. (Called by Lane B.)

### T4 — `hydrateStoresFromCanvas`
Read slot-tagged **text** elements only (skip `frameOf` shapes and non-text). Placeholder filter `^\[[\s\S]+\]$` → `''`. No slot text on the canvas → return without touching the stores.

### T5 — Tests
`client/src/lib/__tests__/listingBindings.spec.ts` — TC-EDIT-014-01 … 07 against the real stores.

---

## Files — exclusive ownership

See STORY.md `owns:`. Nothing under `client/src/components/`.

---

## Gates

- [ ] Gate 1 — `npm run check`, `npm run test:unit:client`
