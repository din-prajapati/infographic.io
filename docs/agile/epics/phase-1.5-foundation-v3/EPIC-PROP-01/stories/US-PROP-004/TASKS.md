---
title: Tasks — US-PROP-004
type: tasks
tags: [orion, prop, canvas, binding]
updated: 2026-10-29
---

# Tasks — US-PROP-004

> **Story:** [US-PROP-004](./STORY.md) — Element binding types on the template contract
> **Branch:** `feat/prop/m-prop-03-template-contract`
> **PR:** #_____
> **PR scope:** `BindingDescriptor`; `migrateElementBinding` / `detachBinding` / `reconnectBinding`; load-time migration; explicit bindings in the curated seed data; tests. No UI, no change to the three write functions.

---

## Four-Pillars Pre-flight

- [ ] **Brain** — Read `listingBindings.ts`. Be able to say (a) why `slot` must stay the write channel, (b) why `stats` → compound while every other field → field (see `STORE_TO_CANVAS_ONLY` and the Q1 note), (c) why `reconnectBinding` must never call `writeCanvasToField`.
- [ ] **Muscle** — Baseline `npm run test:unit` green, including `api/tests/canvas/template-one-fact-per-element.spec.ts`.
- [ ] **Map** — Find `BaseElement` (and `slot?`, `frameOf?`, `slotFormat?`) in `canvasTypes.ts`; confirm `captureCanvasData()` serialises elements verbatim; find the function that loads a design/template into the canvas store (the migration call site).
- [ ] **Env** — `npm run dev`, `npm run check`, `npm run test:unit` all green before the first edit.

---

## Tasks

### T1 — `BindingDescriptor`
- [ ] Export the union type; add `binding?` to `BaseElement` with a US-PROP-004 note. Resolve any `BoundField` import cycle by moving the type. `npm run check`.

**ACs:** AC1 · **Effort:** XS

### T2 — `migrateElementBinding` + load call
- [ ] Rules per the table in STORY.md; idempotent; spread, never mutate.
- [ ] Call it on every element when a design or template loads (one place, in `canvasState.ts`).

**ACs:** AC2 · **Effort:** S

### T3 — `detachBinding` / `reconnectBinding`
- [ ] Detach → independent, same content, no store write.
- [ ] Reconnect → read the store value (read-only), `applySlotFormat(el.slotFormat, value)`, field binding; no store write.
- [ ] Client spec `client/src/lib/__tests__/listingBindings.binding.spec.ts` for T2 + T3 (TC-03 to TC-07).

**ACs:** AC2, AC3 · **Effort:** S

### T4 — Seed data bindings
- [ ] `binding?` on `TextOpts`; `text()` passes it through.
- [ ] Every slot-tagged `text()` call gets its binding (compound for specs/facts, field otherwise). Untagged elements stay without one — load-time migration covers them.

**ACs:** AC5 · **Effort:** S

### T5 — Seed-data spec
- [ ] `api/tests/canvas/element-binding-migration.spec.ts`: import `PREMIUM_CANVAS_TEMPLATES`; assert compound/field per slot; compare field count with the counted non-compound slot-tagged elements.

**ACs:** AC5 · **Effort:** S

### T6 — Round-trip check
- [ ] Open a curated template, check bindings in devtools, save, reopen, compare (TC-01, TC-02). Record in STORY.md.

**ACs:** AC4 · **Effort:** XS

---

## File → Task Map

| File | Task | Change type |
|---|:--:|---|
| `client/src/lib/canvasTypes.ts` | T1 | type + field |
| `client/src/lib/listingBindings.ts` | T2, T3 | three helpers |
| `client/src/lib/canvasState.ts` | T2 | load-time call |
| `client/src/lib/__tests__/listingBindings.binding.spec.ts` | T3 | new |
| `api/scripts/data/premium-templates.data.ts` | T4 | explicit bindings |
| `api/tests/canvas/element-binding-migration.spec.ts` | T5 | new |

---

## Test Commands

```bash
npm run check
npm run test:unit
cd api && npx vitest run tests/canvas/element-binding-migration.spec.ts tests/canvas/template-one-fact-per-element.spec.ts --reporter=verbose
```

---

## Anti-patterns for this story

- **Removing or renaming `slot`.** Every field-to-canvas write finds elements by it.
- **Calling `writeCanvasToField` from `reconnectBinding`.** Reconnect goes store → element only; the reverse would import stale or placeholder text into the listing.
- **Importing `client/src/` from `api/tests/`.** The API test runner can't resolve the client graph; test the helpers on the client side.

---

*Tasks created: 2026-10-29*
