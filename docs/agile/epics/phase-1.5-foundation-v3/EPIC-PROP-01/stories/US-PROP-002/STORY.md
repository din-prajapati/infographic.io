---
title: Story Card — US-PROP-002
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-29
---

# Story Card — US-PROP-002 — Structured price and listing intent

> **Status:** 🔲 Not Started — hardened 2026-10-29 by /new-story
> **Epic:** [EPIC-PROP-01](../../EPIC.md)
> **Milestone:** [M-PROP-01-property-record](../../milestones/M-PROP-01-property-record.md)
> **Size:** M
> **Depends on:** [US-PROP-001](../US-PROP-001/STORY.md) (the `Property` table and its update DTO must exist)
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md)

---

## Story

*As a* real-estate agent who lists both sales and rentals
*I want* to say whether a listing is for sale or for rent, and enter the price the way I say it
*So that* a rental reads "FOR RENT · ₹50,000 / month" and a sale "FOR SALE · ₹4.2 Cr" everywhere — Property tab, canvas, generated poster — and no raw number is ever printed

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** A second migration (after US-PROP-001's) adds nullable `amount DOUBLE PRECISION`, `currency TEXT` (default `'INR'`), `transaction TEXT` (`'sale' | 'rent'`) and `rentalPeriod TEXT` (`'month' | 'week' | 'year' | 'day'`) to `Property`. `PropertyInfo` in `client/src/hooks/usePropertyStore.ts` gains optional `amount`, `currency`, `transaction` and `rentalPeriod`, all `undefined` in `DEFAULT_PROPERTY`; the existing `price: string` stays as the input buffer and backward-compat field.
- [ ] **AC2 [currency-edge]:** A new `parseIndianPrice()` export in **`shared/locale.ts`** (next to the existing `formatPriceForLocale`, `extractCurrencyToken`, `groupDigitsIndian`) returns: `"4.2 Cr"` → 42,000,000; `"50 Lakh"` → 5,000,000; `"₹50,000 / month"` → 50,000 with currency `"₹"` and period `"month"`; `"50,000"` → 50,000; `"1231231"` → 1,231,231; and `null` for `"abc"`, `""`, `"xyz123"`. Formatting those amounts with the existing `formatPriceForLocale(amount, 'en-IN', null)` gives `"₹4.2 Cr"`, `"₹50 Lakh"`, `"₹50,000"`, `"₹50,000"`, `"₹12.3 Lakh"` — the raw `1231231` never reaches the canvas. All asserted in `api/tests/ai-generation/locale-price-parser.spec.ts` (new).
- [ ] **AC3 [happy-path]:** `PropertyDetailsForm.tsx` has a **Listing intent** select (For Sale / For Rent) above the price. The price label reads "Sale price" for sale (or unset) and "Rent per {period}" for rent, when a rental-period select (month / week / year / day) appears. Changing intent clears `amount`, `currency` and `price` and clears the canvas `property.price` slot as **one** undo step (`writeFieldToCanvas('price', '')` is the single history entry); one Undo restores the previous price on the canvas and `amount` in the store. Changing only the rental period keeps `amount` and adds no history entry.
- [ ] **AC4 [happy-path]:** `'property.intent'` is added to `SLOT_IDS` (`client/src/lib/slotIds.ts`) and `listingIntent` to `BoundField` / `FIELD_TO_SLOTS` in `listingBindings.ts`; an element tagged `property.intent` shows "FOR SALE" or "FOR RENT". For a rental of 50,000 per month the `property.price` slot shows "₹50,000 / month". `buildImagePrompt()` in `infographic-prompt.builder.ts` adds "- Listing type: FOR SALE" or "- Listing type: FOR RENT" when `transaction` is set, the rent price line carries the period, and `buildPrintedListing()` returns `intent`. Adding `listingIntent` to `ExpectedText['key']` comes with its `REPAIR_LOCATORS` entry (the record is typed by that union).
- [ ] **AC5 [error-path]:** Typing an unparseable price (e.g. `"abc"`) and leaving the field shows "Enter a valid price (e.g. ₹50 Lakh or 4.2 Cr)" under the input; `amount` and the canvas slot are unchanged. A canvas edit with an invalid price (`writeCanvasToField('property.price', 'abc')`) leaves `amount` unchanged too.
- [ ] **AC6 [rollback]:** A design saved earlier with only a `price` string opens without errors: if `parseIndianPrice` succeeds, `amount` and `currency` are filled and no warning shows; if it fails, `amount` stays undefined, the raw text stays in the input, and a `data-testid="price-legacy-warning"` note "Review price format" shows under the field. No saved data is modified or discarded.

---

## Out of Scope

- Markets other than India (EPIC-MKT-01)
- Deposit, maintenance or other secondary amounts
- Tagging the curated templates with `property.intent` — template slot work belongs to M-PROP-03
- An export warning for a missing `amount` — US-EDIT-021 reads the `price-legacy-warning` state
- A "SOLD" intent

---

## Engineering / PR

- **Branch:** `feat/prop/m-prop-01-property-record`
- **PR:** #_____
- **Primary files touched:**
  - `shared/locale.ts` — `ParsedPrice` + `parseIndianPrice()` (new exports in the existing file)
  - `api/tests/ai-generation/locale-price-parser.spec.ts` — new
  - `client/src/hooks/usePropertyStore.ts` — four optional fields
  - `client/src/components/editor/PropertyDetailsForm.tsx` — intent and period selects, label, blur validation, legacy warning
  - `client/src/lib/slotIds.ts` — `property.intent`
  - `client/src/lib/listingBindings.ts` — `listingIntent` binding, price parsing in `patchFor`, `PrintedListing.intent`, `applySavedListing` back-fill
  - `api/src/modules/ai-generation/services/infographic-prompt.builder.ts` — intent in prompt, expected texts, repair locators, printed listing
  - `api/prisma/schema.prisma` + `api/prisma/migrations/<ts>_prop_price_fields/` — four columns (generated)
  - `api/src/modules/properties/dto/update-property.dto.ts` — four optional validated fields (created by US-PROP-001)

---

## AI Implementation Prompt

> Paste this block into Claude Code to implement the story.

```
Context: Buildographic (code name InfographicAI) — NestJS API + React client; Prisma 6; see CLAUDE.md.
Depends on: US-PROP-001 merged (Property table + properties DTOs exist).

Story: US-PROP-002 — Structured price and listing intent

CRITICAL — extend, never duplicate:
- shared/locale.ts already has formatPriceForLocale, extractCurrencyToken, groupDigitsIndian and the en-IN magnitudes (Cr = 10^7,
  Lakh = 10^5; the suffix is "Lakh", not "L"). Add parseIndianPrice() HERE — no new shared/priceParser.ts.
- listingBindings.ts: BoundField, FIELD_TO_SLOTS, patchFor, PrintedListing, applySavedListing — extend them.
- infographic-prompt.builder.ts: REPAIR_LOCATORS is Record<ExpectedText['key'], RegExp> — adding 'listingIntent' to the union
  needs a REPAIR_LOCATORS entry or `npm run check` fails.

Acceptance Criteria:
AC1: Property gains amount/currency/transaction/rentalPeriod (nullable, generated migration). PropertyInfo gains the same,
     optional, undefined by default. Keep price: string.
AC2: parseIndianPrice: "4.2 Cr"→42e6 · "50 Lakh"→5e6 · "₹50,000 / month"→50000 + "₹" + "month" · "50,000"→50000 ·
     "1231231"→1231231 · "abc"/""/"xyz123"→null. formatPriceForLocale(1231231,'en-IN',null) === "₹12.3 Lakh".
AC3: Listing intent select; label "Sale price" / "Rent per {period}"; period select for rent. Intent change clears price + canvas
     slot in ONE undo step (writeFieldToCanvas('price','') is the only history entry). Period change keeps amount, no history.
AC4: property.intent slot + listingIntent binding; rent price slot "₹50,000 / month"; prompt "- Listing type: FOR SALE|FOR RENT";
     buildPrintedListing().intent.
AC5: Invalid price → inline error on blur; amount and canvas unchanged; canvas-edit path also leaves amount unchanged.
AC6: Old price strings: parseable → amount filled, no warning; unparseable → data-testid="price-legacy-warning" "Review price format".

Out of Scope: non-India markets · deposits/maintenance · tagging curated templates · export warning (US-EDIT-021) · SOLD.

Primary files (do NOT touch others): shared/locale.ts · api/tests/ai-generation/locale-price-parser.spec.ts (new) ·
client/src/hooks/usePropertyStore.ts · client/src/components/editor/PropertyDetailsForm.tsx · client/src/lib/slotIds.ts ·
client/src/lib/listingBindings.ts · api/src/modules/ai-generation/services/infographic-prompt.builder.ts · api/prisma/schema.prisma
+ generated migration · api/src/modules/properties/dto/update-property.dto.ts

Rules: touch only these files; nothing from Out of Scope; run `npm run check` and `npm run test:unit`; report files changed,
ACs checked, test output.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-PROP-002-01 | Manual | P0 | Given a sale at 42,000,000, when the Property tab is open, then the hint and the canvas `property.price` slot show "₹4.2 Cr", never "42000000" | 🔲 | |
| TC-PROP-002-02 | Manual | P0 | Given the canvas shows "₹4.2 Cr", when intent changes to For Rent, then the slot clears; one Ctrl+Z restores "₹4.2 Cr" and `amount` = 42,000,000 | 🔲 | |
| TC-PROP-002-03 | Manual | P1 | Given rent, month, 50,000, when a design is generated, then the prompt has "- Listing type: FOR RENT" and "₹50,000 / month", and `buildPrintedListing().intent === 'FOR RENT'` | 🔲 | |
| TC-PROP-002-04 | Unit | P1 | `parseIndianPrice` cases from AC2, including `null` for "abc" — `locale-price-parser.spec.ts` | 🔲 | |
| TC-PROP-002-05 | Unit | P1 | `formatPriceForLocale(1_231_231, 'en-IN', null) === '₹12.3 Lakh'` (regression guard — the draft wrongly said "₹12.3 L") | 🔲 | |
| TC-PROP-002-06 | Manual | P1 | A design saved with price "₹85,00,000" opens with `amount` 8,500,000 and no warning; one saved with "abc xyz" shows `price-legacy-warning` | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅ · all test cases run and recorded
- [ ] `npm run check` · `npm run test:unit` pass — new parser spec green; `locale.spec.ts`, `printed-listing.spec.ts` and the prompt-builder spec still green
- [ ] Gate 2 — browser checks · Gate 4 — migration applied on staging
- [ ] PR merged (PR #_____)
- [ ] [TASKS.md](./TASKS.md) fully checked ✅ · STORY.md status `✅ Done`

---

## Implementation Update (log)

> Appended by code-agent during/after implementation. Newest entries on top.

### 2026-10-29 — hardened by /new-story
- Found against the code: the en-IN suffix in `shared/locale.ts` is "Lakh", so 1,231,231 formats as "₹12.3 Lakh" (the draft said "₹12.3 L"). Pinned in TC-PROP-002-05.
- `REPAIR_LOCATORS` is typed by `ExpectedText['key']`; adding `listingIntent` needs a matching entry.
- The parser belongs in the existing `shared/locale.ts`; a new file would duplicate the magnitude table.

---

*Story drafted: 2026-10-29 · hardened: 2026-10-29*
