---
title: Tasks — US-PROP-007
type: tasks
tags: [orion, prop, price, intent, editor]
updated: 2026-10-30
---

# Tasks — US-PROP-007

> **Story:** [US-PROP-007](./STORY.md) — Listing intent and price in the editor
> **Branch:** `feat/prop/m-01-property-record`
> **PR:** #_____
> **PR scope:** intent/period selects and price validation in `PropertyDetailsForm`; `property.intent` slot and `listingIntent` binding; price parsing and legacy back-fill in `listingBindings.ts`; one new client spec. No API, schema or prompt changes.

---

## Four-Pillars Pre-flight

- [ ] **Brain** — In `listingBindings.ts`, find `BoundField`, `FIELD_TO_SLOTS`, `patchFor`, `STORE_TO_CANVAS_ONLY`, `PrintedListing` and `applySavedListing`. Be able to say why the intent change must not call `pushToHistory`.
- [ ] **Muscle** — In the running app, typing in the Property tab price calls `writeFieldToCanvas('price', …)` per keystroke and the run coalesces into one undo step; `hydrateStoresFromCanvas` is subscribed to Undo/Redo at the bottom of `listingBindings.ts`.
- [ ] **Map** — Typed price → `parseIndianPrice` → `amount` → `formatPriceForLocale` → `property.price` slot.
- [ ] **Env** — US-PROP-002 merged (`parseIndianPrice` exported; `PropertyInfo.amount` exists); `npm run test:unit` green at baseline.

---

## Tasks

### T1 — Slot + binding
- [ ] `slotIds.ts`: `'property.intent'`.
- [ ] `listingBindings.ts`: `listingIntent` in `BoundField` and `FIELD_TO_SLOTS` (`['property.intent']`); `patchFor('listingIntent')` → `transaction`; the store→canvas value is `FOR SALE` / `FOR RENT`; `PrintedListing.intent`.

**ACs:** AC2 · **Effort:** S

### T2 — Price parsing in the binding + back-fill
- [ ] `patchFor('price', v)`: keep setting `price`; set `amount`/`currency` only when `parseIndianPrice(v)` succeeds.
- [ ] Rent: the slot value is `formatPriceForLocale(amount, …) + " / " + rentalPeriod`.
- [ ] `applySavedListing`: if `price` is set and `amount` missing, parse and set `amount`/`currency`; leave `amount` undefined on failure.

**ACs:** AC2, AC3, AC4 · **Effort:** S

### T3 — `PropertyDetailsForm.tsx`
- [ ] Intent select; on change: `setProperty({ transaction, amount: undefined, currency: undefined, price: '' })`, `writeFieldToCanvas('price', '')` (the only history entry), `writeFieldToCanvas('listingIntent', …)`.
- [ ] Label per intent; period select for rent (`setProperty({ rentalPeriod })` only, then rewrite the price slot without a history entry).
- [ ] Validate on blur; AC3 error text. `price-legacy-warning` when `price` is non-empty, `amount` undefined and unparseable.

**ACs:** AC1, AC3, AC4 · **Effort:** M

### T4 — Tests
- [ ] `client/src/lib/__tests__/listingBindings.price.spec.ts`: the AC5 cases. Existing `listingBindings.spec.ts` stays green.

**ACs:** AC5 · **Effort:** S

### T5 — Verify
- [ ] `npm run check`, `npm run test:unit`; TC-PROP-007-01 to -05 in the browser; record in STORY.md.

---

## File → Task Map

| File | Task(s) | Change type |
|---|:--:|---|
| `client/src/lib/slotIds.ts` | T1 | slot id |
| `client/src/lib/listingBindings.ts` | T1, T2 | binding, parsing, back-fill |
| `client/src/components/editor/PropertyDetailsForm.tsx` | T3 | UI |
| `client/src/lib/__tests__/listingBindings.price.spec.ts` | T4 | new |

---

## Test Commands

```bash
npm run check
npm run test:unit
cd client && npx vitest run src/lib/__tests__/listingBindings.price.spec.ts src/lib/__tests__/listingBindings.spec.ts --reporter=verbose
```

> Playwright defaults to **staging** — set `PLAYWRIGHT_BASE_URL=http://localhost:5000` for local runs.

---

## Anti-patterns for this story

- **Calling `pushToHistory` in the intent handler.** `writeFieldToCanvas` already records the entry; a second one breaks the one-Undo rule (AC1).
- **Removing `price: string`.** Saved designs carry it; `amount` is the canonical number, `price` stays as the buffer.
- **A parallel intent map.** Extend `BoundField` / `FIELD_TO_SLOTS`; every reader derives from them.

---

*Tasks created: 2026-10-30*
