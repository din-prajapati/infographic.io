---
title: Story Card — US-PROP-002
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-30
---

# Story Card — US-PROP-002 — Structured price: parser, schema and generation

> **Status:** 🔲 Not Started — hardened 2026-10-29 by /new-story · split 2026-10-30 after the Opus review of PR #83
> **Epic:** [EPIC-PROP-01](../../EPIC.md)
> **Milestone:** [M-PROP-01-property-record](../../milestones/M-PROP-01-property-record.md)
> **Size:** M
> **Depends on:** [US-PROP-001](../US-PROP-001/STORY.md) (the `Property` table and its DTOs must exist)
> **Unblocks:** [US-PROP-007](../US-PROP-007/STORY.md) (the editor half: intent select, slots, validation, back-fill)
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md)

---

## Story

*As a* real-estate agent who lists both sales and rentals
*I want* the price I type to be understood as a number, and whether the listing is for sale or for rent to reach the generated poster
*So that* a rental poster reads "FOR RENT · ₹50,000 / month" and a sale "FOR SALE · ₹4.2 Cr", and no raw number is ever printed

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** A second migration (after US-PROP-001's), generated with `npx prisma migrate dev --name prop_price_fields`, adds nullable `amount DOUBLE PRECISION`, `currency TEXT` (default `'INR'`), `transaction TEXT` and `rentalPeriod TEXT` to `Property`. **Both** `create-property.dto.ts` and `update-property.dto.ts` accept them as optional: `amount` `@IsNumber() @Min(0)`, `currency` `@IsString() @MaxLength(8)`, `transaction` `@IsIn(['sale','rent'])`, `rentalPeriod` `@IsIn(['month','week','year','day'])` — the API runs `forbidNonWhitelisted: true`, so a field missing from either DTO makes that request 400. `PropertyInfo` in `client/src/hooks/usePropertyStore.ts` gains the same four as optional fields, `undefined` in `DEFAULT_PROPERTY`; `price: string` stays.
- [ ] **AC2 [currency-edge]:** A new `parseIndianPrice()` export in **`shared/locale.ts`** (next to `formatPriceForLocale`, `extractCurrencyToken`, `groupDigitsIndian`) returns: `"4.2 Cr"` → 42,000,000; `"50 Lakh"` → 5,000,000; `"₹50,000 / month"` → 50,000 with currency `"₹"` and period `"month"`; `"50,000"` → 50,000; `"1231231"` → 1,231,231; and `null` for `"abc"`, `""`, `"xyz123"`. Formatting those amounts with `formatPriceForLocale(amount, 'en-IN', null)` gives `"₹4.2 Cr"`, `"₹50 Lakh"`, `"₹50,000"`, `"₹50,000"`, `"₹12.3 Lakh"`. All asserted in `api/tests/ai-generation/locale-price-parser.spec.ts` (new).
- [ ] **AC3 [happy-path]:** `GenerateFromChatDto` (`api/src/modules/infographics/dto/generate-from-chat.dto.ts`) accepts optional `transaction` (`@IsIn(['sale','rent'])`) and `rentalPeriod` (`@IsIn(['month','week','year','day'])`). `GenerationsService` (`generations.service.ts`, where `propertyData` is built) copies them into `propertyData` and, when `transaction` is set, sets `listingType` to `'for_sale'` / `'for_rent'` from it instead of the extracted value. A request without them builds exactly the `propertyData` it builds today.
- [ ] **AC4 [happy-path]:** `buildImagePrompt()` in `infographic-prompt.builder.ts` adds "- Listing type: FOR SALE" or "- Listing type: FOR RENT" when `propertyData.transaction` is set, and the rent price line carries the period ("₹50,000 / month"). `buildPrintedListing()` returns `intent: 'FOR SALE' | 'FOR RENT' | undefined`. `ExpectedText['key']` gains `'listingIntent'` with its `REPAIR_LOCATORS` entry `/\bFOR\s+(SALE|RENT)\b/i`, and `buildExpectedTexts` emits it when `intent` is set. New cases in `infographic-prompt.builder.spec.ts` and `printed-listing.spec.ts`; every existing case stays green.
- [ ] **AC5 [happy-path]:** Both client generation senders — `RightSidebar.tsx` (the request built near the existing `currencyToken`, ~line 542) and `AIChatBox.tsx` (~line 803) — add `transaction` and `rentalPeriod` from `usePropertyStore` when they are set, and omit them when `undefined`; the request type in `client/src/lib/api.ts` (~line 114) gains both as optional.
- [ ] **AC6 [rollback]:** With none of the new fields set (every existing design and Property), `npm run test:unit` is green with no expectation changed, and a generation request body is byte-identical to today's.

---

## Out of Scope

- The editor UI — intent and period selects, price label, blur validation, `property.intent` slot, legacy-price warning and back-fill (all **US-PROP-007**)
- Markets other than India (EPIC-MKT-01)
- Deposit, maintenance or other secondary amounts
- A "SOLD" intent
- Tagging curated templates with `property.intent` (M-PROP-03)

---

## Engineering / PR

- **Branch:** `feat/prop/m-01-property-record`
- **PR:** #_____
- **Primary files touched:**
  - `shared/locale.ts` — `ParsedPrice` + `parseIndianPrice()` (new exports in the existing file)
  - `api/tests/ai-generation/locale-price-parser.spec.ts` — new
  - `api/prisma/schema.prisma` + `api/prisma/migrations/<ts>_prop_price_fields/` — four columns (generated)
  - `api/src/modules/properties/dto/create-property.dto.ts` — four optional validated fields (created by US-PROP-001)
  - `api/src/modules/properties/dto/update-property.dto.ts` — four optional validated fields (created by US-PROP-001)
  - `api/src/modules/infographics/dto/generate-from-chat.dto.ts` — `transaction`, `rentalPeriod`
  - `api/src/modules/infographics/services/generations.service.ts` — copy into `propertyData`; `listingType` from `transaction`
  - `api/src/modules/ai-generation/services/infographic-prompt.builder.ts` — listing-type line, rent period, `intent`, expected text + repair locator
  - `api/tests/ai-generation/infographic-prompt.builder.spec.ts` — new cases
  - `api/tests/ai-generation/printed-listing.spec.ts` — new cases
  - `client/src/hooks/usePropertyStore.ts` — four optional fields
  - `client/src/lib/api.ts` — two optional request fields
  - `client/src/components/editor/RightSidebar.tsx` — send them
  - `client/src/components/ai-chat/AIChatBox.tsx` — send them

---

## AI Implementation Prompt

> Paste this block into Claude Code to implement the story.

```
Context: Buildographic (code name InfographicAI) — NestJS API + React client; Prisma 6; see CLAUDE.md.
Depends on: US-PROP-001 merged (Property table + create/update DTOs exist).

Story: US-PROP-002 — Structured price: parser, schema and generation

CRITICAL — extend, never duplicate:
- shared/locale.ts already has formatPriceForLocale, extractCurrencyToken, groupDigitsIndian and the en-IN magnitudes (Cr = 10^7,
  Lakh = 10^5; the suffix is "Lakh", not "L"). Add parseIndianPrice() HERE — no new shared/priceParser.ts.
- infographic-prompt.builder.ts: REPAIR_LOCATORS is Record<ExpectedText['key'], RegExp> — adding 'listingIntent' to the union
  needs a REPAIR_LOCATORS entry or `npm run check` fails.
- The API runs forbidNonWhitelisted: true. Any field the client may send must be on BOTH properties DTOs.
- Migrations run via `migrate deploy` (Railway pre-deploy, BL-33). Generate with `prisma migrate dev`; never `db push`.

Acceptance Criteria:
AC1: Property gains amount/currency/transaction/rentalPeriod (nullable, generated migration); both properties DTOs accept them;
     PropertyInfo gains them (optional, undefined by default). Keep price: string.
AC2: parseIndianPrice: "4.2 Cr"→42e6 · "50 Lakh"→5e6 · "₹50,000 / month"→50000 + "₹" + "month" · "50,000"→50000 ·
     "1231231"→1231231 · "abc"/""/"xyz123"→null. formatPriceForLocale(1231231,'en-IN',null) === "₹12.3 Lakh".
AC3: GenerateFromChatDto accepts transaction/rentalPeriod; generations.service copies them into propertyData and derives
     listingType from transaction when set. No fields → propertyData unchanged.
AC4: buildImagePrompt "- Listing type: FOR SALE|FOR RENT"; rent price line with period; buildPrintedListing().intent;
     listingIntent expected text + REPAIR_LOCATORS entry. New spec cases; existing ones green.
AC5: RightSidebar.tsx and AIChatBox.tsx send transaction/rentalPeriod when set; api.ts request type gains both.
AC6: Without the new fields, every existing test and request body is unchanged.

Out of Scope: editor UI, slots, validation, back-fill (US-PROP-007) · non-India markets · deposits · SOLD · template tagging.

Primary files (do NOT touch others): see the list above.

Rules: touch only these files; run `npm run check` and `npm run test:unit`; report files changed, ACs checked, test output.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-PROP-002-01 | Unit | P0 | `parseIndianPrice` cases from AC2, including `null` for "abc" — `locale-price-parser.spec.ts` | 🔲 | |
| TC-PROP-002-02 | Unit | P0 | `formatPriceForLocale(1_231_231, 'en-IN', null) === '₹12.3 Lakh'` (regression guard — the draft wrongly said "₹12.3 L") | 🔲 | |
| TC-PROP-002-03 | Unit | P0 | `buildImagePrompt` with `transaction: 'rent'`, `rentalPeriod: 'month'`, amount 50,000 → contains "- Listing type: FOR RENT" and "₹50,000 / month"; `buildPrintedListing().intent === 'FOR RENT'` | 🔲 | |
| TC-PROP-002-04 | Unit | P1 | `buildImagePrompt` with no `transaction` → output identical to before (snapshot of an existing case) | 🔲 | |
| TC-PROP-002-05 | Manual | P1 | `PUT /api/v1/properties/:id` with `{ transaction: 'rent', rentalPeriod: 'month', amount: 50000 }` → 200 and the row has all three; with `transaction: 'lease'` → 400 | 🔲 | |
| TC-PROP-002-06 | Manual | P1 | With `transaction: 'rent'` set in the store, generating from the sidebar sends `transaction` and `rentalPeriod` in `POST /infographics/generations` (devtools) | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅ · all test cases run and recorded
- [ ] `npm run check` · `npm run test:unit` pass — new parser spec green; `locale.spec.ts`, `printed-listing.spec.ts`, `infographic-prompt.builder.spec.ts` green
- [ ] Gate 4 — migration applied on staging by the Railway pre-deploy `migrate deploy`; no drift
- [ ] PR merged (PR #_____)
- [ ] [TASKS.md](./TASKS.md) fully checked ✅ · STORY.md status `✅ Done`

---

## Implementation Update (log)

> Appended by code-agent during/after implementation. Newest entries on top.

### 2026-10-30 — split after the Opus review of PR #83
- The intent has to travel `GenerateFromChatDto` (whitelisted) → `generations.service.ts` → `buildImagePrompt`, sent by `RightSidebar.tsx` and `AIChatBox.tsx`. None of those were on the card, so AC4 could not have been met inside the scope lock.
- With them added the card was ~14 files across schema, parser, UI, bindings and prompt — over one session. Split: this story keeps parser + schema + DTOs + generation; the editor half moved to **US-PROP-007**.
- The four fields now go on `create-property.dto.ts` too: US-PROP-006 sends them on `POST`, and `forbidNonWhitelisted` would reject them.

### 2026-10-29 — hardened by /new-story
- Found against the code: the en-IN suffix in `shared/locale.ts` is "Lakh", so 1,231,231 formats as "₹12.3 Lakh" (the draft said "₹12.3 L"). Pinned in TC-PROP-002-02.
- `REPAIR_LOCATORS` is typed by `ExpectedText['key']`; adding `listingIntent` needs a matching entry.
- The parser belongs in the existing `shared/locale.ts`; a new file would duplicate the magnitude table.

---

*Story drafted: 2026-10-29 · hardened: 2026-10-29 · split: 2026-10-30*
