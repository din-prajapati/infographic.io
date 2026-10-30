---
title: Tasks — US-PROP-002
type: tasks
tags: [orion, prop, price, intent]
updated: 2026-10-30
---

# Tasks — US-PROP-002

> **Story:** [US-PROP-002](./STORY.md) — Structured price: parser, schema and generation
> **Branch:** `feat/prop/m-01-property-record`
> **PR:** #_____
> **PR scope:** `parseIndianPrice` in `shared/locale.ts`; four `Property` columns + both properties DTOs + `PropertyInfo`; `transaction`/`rentalPeriod` through the generation DTO, service, prompt builder and the two client senders. No editor UI (US-PROP-007).

---

## Four-Pillars Pre-flight

- [ ] **Brain** — Read `shared/locale.ts`. `parseIndianPrice` is the inverse of `formatPriceForLocale`: strip the symbol with `extractCurrencyToken`, strip a period hint, strip commas, multiply by the magnitude. Reuse the tables.
- [ ] **Muscle** — Find where `generations.service.ts` builds `propertyData` (it sets `listingType` from the extraction) and where `ai-orchestrator.service.ts` calls `buildImagePrompt(propertyData, headline)`.
- [ ] **Map** — Trace store → `RightSidebar.tsx` / `AIChatBox.tsx` request → `GenerateFromChatDto` → `propertyData` → `buildImagePrompt` / `buildPrintedListing`.
- [ ] **Env** — US-PROP-001 merged and its migration applied (`Property` visible in Prisma Studio); `npm run test:unit` green at baseline.

---

## Tasks

### T1 — `parseIndianPrice()` in `shared/locale.ts`
- [ ] Export `ParsedPrice { amount; currency: string | null; periodHint: 'month'|'week'|'year'|'day'|null }` and `parseIndianPrice(raw): ParsedPrice | null`.
- [ ] Symbol via `extractCurrencyToken`; period from `/`, `per` or `a` + month/week/year/day (incl. monthly/annual forms, canonicalised); commas stripped; `Cr|Crore` 10⁷, `Lakh|Lac|L` 10⁵, `K` 10³ as whole words.
- [ ] `null` for no number or 0; never throws.

**ACs:** AC2 · **Effort:** S

### T2 — Parser tests
- [ ] `api/tests/ai-generation/locale-price-parser.spec.ts`: the AC2 parses, two format round-trips (incl. `"₹12.3 Lakh"`), three `null` cases. Pure functions, no mocks.

**ACs:** AC2 · **Effort:** XS

### T3 — Schema, migration, DTOs, store type
- [ ] `schema.prisma`: four `Property` columns; `npx prisma migrate dev --name prop_price_fields` (after US-PROP-001's migration). Never `db push`.
- [ ] `create-property.dto.ts` **and** `update-property.dto.ts`: the four optional validated fields (AC1 decorators).
- [ ] `PropertyInfo`: `amount?`, `currency?`, `transaction?`, `rentalPeriod?`; `undefined` in `DEFAULT_PROPERTY`. `npm run check`.

**ACs:** AC1 · **Effort:** S

### T4 — Generation path
- [ ] `GenerateFromChatDto`: optional `transaction`, `rentalPeriod` with `@IsIn`.
- [ ] `generations.service.ts`: copy both into `propertyData`; when `transaction` is set, `listingType = transaction === 'rent' ? 'for_rent' : 'for_sale'`. Otherwise unchanged.

**ACs:** AC3, AC6 · **Effort:** XS

### T5 — Prompt builder
- [ ] `intent` in `PromptParts`; "- Listing type: …" line; rent price line with period.
- [ ] `listingIntent` in `ExpectedText['key']` + `REPAIR_LOCATORS` (`/\bFOR\s+(SALE|RENT)\b/i`); `buildExpectedTexts` and `buildPrintedListing` carry it.
- [ ] New cases in `infographic-prompt.builder.spec.ts` (TC-03, TC-04) and `printed-listing.spec.ts`; existing cases unchanged.

**ACs:** AC4, AC6 · **Effort:** S

### T6 — Client senders
- [ ] `api.ts` request type: `transaction?`, `rentalPeriod?`.
- [ ] `RightSidebar.tsx` and `AIChatBox.tsx`: add both from `usePropertyStore.getState().property` when set — beside the existing `currencyToken` line; omit when `undefined`.

**ACs:** AC5, AC6 · **Effort:** XS

### T7 — Verify
- [ ] `npm run check`, `npm run test:unit`; TC-PROP-002-05 and -06 by hand; record in STORY.md.

---

## File → Task Map

| File | Task(s) | Change type |
|---|:--:|---|
| `shared/locale.ts` | T1 | new exports |
| `api/tests/ai-generation/locale-price-parser.spec.ts` | T2 | new |
| `api/prisma/schema.prisma` | T3 | 4 columns (+ generated migration) |
| `api/src/modules/properties/dto/create-property.dto.ts` | T3 | DTO fields |
| `api/src/modules/properties/dto/update-property.dto.ts` | T3 | DTO fields |
| `client/src/hooks/usePropertyStore.ts` | T3 | type fields |
| `api/src/modules/infographics/dto/generate-from-chat.dto.ts` | T4 | 2 fields |
| `api/src/modules/infographics/services/generations.service.ts` | T4 | copy + listingType |
| `api/src/modules/ai-generation/services/infographic-prompt.builder.ts` | T5 | prompt + printed listing |
| `api/tests/ai-generation/infographic-prompt.builder.spec.ts` | T5 | new cases |
| `api/tests/ai-generation/printed-listing.spec.ts` | T5 | new cases |
| `client/src/lib/api.ts` | T6 | request type |
| `client/src/components/editor/RightSidebar.tsx` | T6 | send fields |
| `client/src/components/ai-chat/AIChatBox.tsx` | T6 | send fields |

---

## Test Commands

```bash
npm run check
npm run test:unit
cd api && npx vitest run tests/ai-generation/locale-price-parser.spec.ts tests/ai-generation/locale.spec.ts tests/ai-generation/printed-listing.spec.ts tests/ai-generation/infographic-prompt.builder.spec.ts --reporter=verbose
```

---

## Anti-patterns for this story

- **Creating `shared/priceParser.ts`.** The magnitude table already lives in `shared/locale.ts`; a second copy drifts.
- **Adding the fields to only one properties DTO.** `forbidNonWhitelisted` rejects the whole request; US-PROP-006 sends them on both POST and PUT.
- **`prisma db push`.** Migrations deploy through `migrate deploy` (BL-33); a pushed column is drift the next deploy trips over.

---

*Tasks created: 2026-10-29 · rewritten for the split: 2026-10-30*
