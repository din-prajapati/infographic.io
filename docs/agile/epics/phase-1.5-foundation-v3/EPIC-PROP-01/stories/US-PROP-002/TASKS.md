---
title: Tasks — US-PROP-002
type: tasks
tags: [orion, prop, price, intent]
updated: 2026-10-29
---

# Tasks — US-PROP-002

> **Story:** [US-PROP-002](./STORY.md) — Structured price and listing intent
> **Branch:** `feat/prop/m-prop-01-property-record`
> **PR:** #_____
> **PR scope:** Indian price parsing, the listing-intent select, and FOR SALE / FOR RENT through canvas, prompt and printed listing. Extends `shared/locale.ts`, `listingBindings.ts` and `infographic-prompt.builder.ts`. No template, extraction or export changes.

---

## Four-Pillars Pre-flight

- [ ] **Brain** — Read `shared/locale.ts`. `parseIndianPrice` is the inverse of `formatPriceForLocale`: strip the symbol with `extractCurrencyToken`, strip a period hint, strip commas, multiply by the magnitude. Reuse — don't re-implement the tables.
- [ ] **Muscle** — In the running app, typing in the Property tab price calls `writeFieldToCanvas('price', …)` per keystroke and the run coalesces into one undo step; `hydrateStoresFromCanvas` is subscribed to Undo/Redo at the bottom of `listingBindings.ts`.
- [ ] **Map** — Trace typed price → `parseIndianPrice` → `amount` → `formatPriceForLocale` → `property.price` slot → `buildImagePrompt` (the builder gets the number; locale and currency token arrive separately on the DTO).
- [ ] **Env** — US-PROP-001 migration applied (`Property` table visible in Prisma Studio); `npm run test:unit` green at baseline.

---

## Tasks

### T1 — `parseIndianPrice()` in `shared/locale.ts`
- [ ] Export `ParsedPrice { amount; currency: string | null; periodHint: 'month'|'week'|'year'|'day'|null }` and `parseIndianPrice(raw): ParsedPrice | null`.
- [ ] Symbol via `extractCurrencyToken`; period from `/`, `per` or `a` + month/week/year/day (incl. monthly/annual forms, canonicalised); commas stripped; `Cr|Crore` 10⁷, `Lakh|Lac|L` 10⁵, `K` 10³ as whole words.
- [ ] `null` for no number or 0; never throws.

**Effort:** S

### T2 — Parser tests
- [ ] `api/tests/ai-generation/locale-price-parser.spec.ts`: the five AC2 parses, two format round-trips (incl. `"₹12.3 Lakh"`), three `null` cases. Pure functions, no mocks.

**Effort:** XS

### T3 — Store fields
- [ ] `PropertyInfo`: `amount?`, `currency?`, `transaction?`, `rentalPeriod?`; `undefined` in `DEFAULT_PROPERTY`. Keep `price: string`. `npm run check`.

**Effort:** XS

### T4 — Migration + DTO
- [ ] `schema.prisma`: the four `Property` columns; `npx prisma migrate dev --name prop_price_fields` (generated, after US-PROP-001's migration).
- [ ] `update-property.dto.ts`: four optional validated fields.

**Effort:** XS

### T5 — `PropertyDetailsForm.tsx`
- [ ] Intent select; on change: `setProperty({ transaction, amount: undefined, currency: undefined, price: '' })`, `writeFieldToCanvas('price', '')` (the only history entry — no extra `pushToHistory`), `writeFieldToCanvas('listingIntent', 'FOR SALE'|'FOR RENT')`.
- [ ] Label per intent; period select for rent (`setProperty({ rentalPeriod })` only).
- [ ] Price input: keep the buffer; on a parse, set `amount`/`currency` and write the slot value (`formatPriceForLocale` + " / period" for rent). Validate on blur; error text per AC5.
- [ ] `price-legacy-warning` when `price` is non-empty, `amount` undefined and unparseable.

**Effort:** M

### T6 — Slot + bindings
- [ ] `slotIds.ts`: `property.intent`. `listingBindings.ts`: `listingIntent` in `BoundField` / `FIELD_TO_SLOTS`; `patchFor('price')` parses and returns `undefined` on failure; `patchFor('listingIntent')` → `transaction`; `PrintedListing.intent`.

**Effort:** S

### T7 — Prompt builder
- [ ] `intent` in `PromptParts`; "- Listing type: …" line; rent price line with period; `listingIntent` in `ExpectedText['key']` + `REPAIR_LOCATORS` (`/\bFOR\s+(SALE|RENT)\b/i`); `buildExpectedTexts` and `buildPrintedListing` carry it.
- [ ] Existing prompt-builder and printed-listing specs stay green.

**Effort:** S

### T8 — Back-fill on load
- [ ] `applySavedListing`: if `price` is set and `amount` missing, parse and set `amount`/`currency`; leave `amount` undefined on failure (T5 shows the warning).
- [ ] Verify both AC6 cases; no warning for fresh designs.

**Effort:** XS

---

## File → Task Map

| File | Task(s) | Change type |
|---|:--:|---|
| `shared/locale.ts` | T1 | new exports |
| `api/tests/ai-generation/locale-price-parser.spec.ts` | T2 | new |
| `client/src/hooks/usePropertyStore.ts` | T3 | fields |
| `api/prisma/schema.prisma` + migration | T4 | 4 columns |
| `api/src/modules/properties/dto/update-property.dto.ts` | T4 | DTO fields |
| `client/src/components/editor/PropertyDetailsForm.tsx` | T5 | UI |
| `client/src/lib/slotIds.ts` | T6 | slot id |
| `client/src/lib/listingBindings.ts` | T6, T8 | binding, parsing, back-fill |
| `api/src/modules/ai-generation/services/infographic-prompt.builder.ts` | T7 | prompt + printed listing |

---

## Test Commands

```bash
npm run check
npm run test:unit
cd api && npx vitest run tests/ai-generation/locale-price-parser.spec.ts --reporter=verbose
cd api && npx vitest run tests/ai-generation/locale.spec.ts tests/ai-generation/printed-listing.spec.ts --reporter=verbose
```

> Playwright defaults to **staging** — set `PLAYWRIGHT_BASE_URL=http://localhost:5000` for local runs.

---

## Anti-patterns for this story

- **Creating `shared/priceParser.ts`.** The magnitude table already lives in `shared/locale.ts`; a second copy drifts.
- **Calling `pushToHistory` in the intent handler.** `writeFieldToCanvas` already records the entry; a second one breaks the one-Undo rule (AC3).
- **Removing `price: string`.** Saved designs carry it, and `applySavedListing` / `hydrateStoresFromCanvas` read it; `amount` is the new canonical number, `price` stays as the buffer.

---

*Tasks created: 2026-10-29*
