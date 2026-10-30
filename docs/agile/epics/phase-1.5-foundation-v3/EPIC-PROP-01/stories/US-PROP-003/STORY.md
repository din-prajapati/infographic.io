---
title: Story Card — US-PROP-003
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-29
---

# Story Card — US-PROP-003 — Auto-Fill from a listing message, with review

> **Status:** 🔲 Not Started — hardened 2026-10-29 by /new-story
> **Feature:** EPIC-PROP-01 — Property & Brand Foundation
> **Epic:** [EPIC-PROP-01](../../EPIC.md)
> **Milestone:** [M-PROP-01-property-record](../../milestones/M-PROP-01-property-record.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Depends on:** [US-PROP-002](../US-PROP-002/STORY.md) (`PropertyInfo` has `amount`, `currency`, `transaction`, `rentalPeriod`; `parseIndianPrice` exists) and [US-PROP-007](../US-PROP-007/STORY.md) (`FIELD_TO_SLOTS` has `listingIntent`; `patchFor('price')` sets `amount`). Both must be merged first. `transaction`, `rentalPeriod` and `amount` are **store fields**, not `BoundField`s — only `listingIntent` and `price` have canvas slots.
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md); V3 canvas mockup (`Mockups/buildographic-canvas-simplification-v3/`, untracked)

---

## Story

*As* an agent who receives listings as WhatsApp messages
*I want* to paste the message and review what was found before it fills my Property
*So that* I stop retyping listings, and nothing in my listing changes without my say-so

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** When the Property tab is open, a collapsible "Auto-fill from listing" section is visible at the top of the form; it contains a `<textarea>` with `data-testid="autofill-paste-input"` (placeholder: "Paste a listing or seller message…") and a button with `data-testid="autofill-extract-btn"` and label "Extract & review".

- [ ] **AC2 [happy-path]:** When the user clicks "Extract & review" with non-empty text in the paste input, the frontend calls `POST /api/v1/infographics/generations/extractions` with body `{ "prompt": "<pasted text>" }`; while the request is in flight the button shows "Extracting…" and is `disabled`; when the response arrives the review list replaces the loading state.

- [ ] **AC3 [happy-path]:** The review list shows one checkable row for each mappable detected fact present in `extractedData`: address, price (displayed as a formatted string), beds, baths, sqft, propertyType, transaction (derived from `listingType`), rentalPeriod and features. Each row shows the fact label, the detected value, the current store value (or the literal string "Empty"), and a checkbox. Fields whose current store value is empty-string / 0 / empty-array are pre-checked; fields with a non-empty current value are pre-unchecked. `listingType: 'sold'` does NOT produce a checkable row (it appears in suggestions only, per AC6).

- [ ] **AC4 [happy-path]:** When the user clicks "Apply selected", all currently checked facts are written to the property store AND to canvas slots via a new `applyExtractedFacts()` function in `listingBindings.ts`; that function calls `useCanvasStore.pushToHistory` exactly once before all element mutations, then issues a single `useCanvasStore.setState({ elements })` for the canvas batch; a single Ctrl+Z from the state after Apply reverts all applied field values together; after Apply the review panel closes. A ticked **price** writes `amount` (the extracted number), `currency`, and `price` = `formatPriceForLocale(amount, locale, currencyToken)` — the same string the `property.price` slot shows. A ticked **Listing intent** writes `transaction` and the `property.intent` slot; a ticked **rentalPeriod** writes the store field only (it changes the price slot's "/ month" suffix, no slot of its own).

- [ ] **AC5 [edge-case]:** A field whose checkbox is not ticked when Apply is clicked is never written to the property store or the canvas. When Apply is clicked with zero checkboxes ticked, the store and canvas are unchanged and the review panel stays open.

- [ ] **AC6 [happy-path]:** `PromptExtractorService.extractPropertyData` in `api/src/modules/infographics/services/prompt-extractor.service.ts` returns a `rentalPeriod` field of type `'month' | 'week' | 'year' | 'day' | null` (added to the `ExtractedPropertyData` interface and to the LLM system-prompt JSON schema); the review panel maps `listingType: 'for_sale'` to a checkable row labelled "Listing intent" with value "sale", maps `listingType: 'for_rent'` to "Listing intent" with value "rent", and shows `listingType: 'sold'` as a non-checkable suggestion only.

- [ ] **AC7 [security]:** The `agent` sub-object from the extraction response (`name`, `brokerage`, `brandColors`, `logoUrl`) is never written to `useAgentStore` or `usePropertyStore` by any Apply code path; those detected values appear below the checkable fact rows as non-interactive text inside an element with `data-testid="autofill-suggestions"`; that element is not rendered when there are no suggestions and no agent data.

- [ ] **AC8 [happy-path]:** Each field accepted through Apply sets `fieldOrigins[fieldName] = 'accepted-source-text'` in a new **top-level** store key `fieldOrigins: Partial<Record<string, string>>` on `usePropertyStore` — a sibling of `property`, **not** a field of `PropertyInfo` — with a `setFieldOrigins` action; `resetProperty()` also resets it to `{}`. Because it is outside `PropertyInfo`, `captureListing()` (which spreads `property` into the saved design) does not save it, and US-PROP-006's `toPropertyPayload()` never sends it.

- [ ] **AC9 [rate-limit]:** `POST /api/v1/infographics/generations/extractions` does not consume a monthly generation credit: `ExtractionsController` has no call to `assertCanGenerate`, `assertCanGenerateForUser` or any `UsageRecord` increment, and a FREE-tier user with 3/3 credits used can run Extract & review and receive a 200 response with extracted data.

- [ ] **AC10 [error-path]:** If `POST /api/v1/infographics/generations/extractions` returns a non-2xx status, or no response has arrived after 15 seconds, the review area shows a message whose text begins with "Could not extract"; the Property form fields are unchanged; the "Extract & review" button is enabled again.

- [ ] **AC11 [mobile]:** The Auto-fill section renders without horizontal overflow at 375 px and 1440 px viewport widths; the textarea, "Extract & review" button, review rows and "Apply selected" button are fully visible and usable (not clipped, not overflowing the sidebar) at 375 px.

---

## Out of Scope

- Listing URL ingestion (ADR-002 delta 1 — a separate story)
- Reading facts from listing photos
- Changes to the AI chat (retired by US-EDIT-023, a later wave)
- Auto-apply without review — the agent must tick checkboxes and click Apply every time
- Persisting `fieldOrigins` — to the database or to the saved design. It lives in Zustand only, as a top-level key outside `PropertyInfo` (AC8)
- Applying `sold` as a `transaction` value — `sold` is a suggestion per AC6
- Retry logic after a timeout — after "Could not extract" the agent clicks Extract & review again
- Any change to credit / usage behaviour on `ExtractionsController` — extraction stays free

---

## Engineering / PR

- **Branch:** `feat/prop/m-01-property-record`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/modules/infographics/services/prompt-extractor.service.ts` — add `rentalPeriod` to the `ExtractedPropertyData` interface and the LLM system-prompt JSON schema
  - `client/src/lib/api.ts` — add `rentalPeriod` to the `ExtractionResult.extractedData` type
  - `client/src/hooks/usePropertyStore.ts` — add a top-level `fieldOrigins` key (outside `PropertyInfo`) + `setFieldOrigins`; `resetProperty()` clears it
  - `client/src/lib/listingBindings.ts` — add the `ExtractedFact` type and the `applyExtractedFacts()` export
  - `client/src/components/editor/PropertyDetailsForm.tsx` — add the "Auto-fill from listing" collapsible section
  - `client/src/lib/__tests__/listingBindings.applyExtractedFacts.spec.ts` — unit test for `applyExtractedFacts` (new)

---

## AI Implementation Prompt

> Paste this block into Claude Code to implement the story.

```
Context: Buildographic (code name InfographicAI) — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
Stack: React 18 + Vite, NestJS 11, Prisma 6, Tailwind v3 + shadcn/ui, Wouter router, Zustand + React Query.
See CLAUDE.md for the full architecture.

Story: US-PROP-003 — Auto-Fill from a listing message, with review

As an agent who receives listings as WhatsApp messages, I want to paste the message and review what was found
before it fills my Property, so that I stop retyping listings and nothing changes without my say-so.

Pre-condition: US-PROP-002 added amount/currency/transaction/rentalPeriod to PropertyInfo (store fields, NOT
BoundFields) and parseIndianPrice; US-PROP-007 added listingIntent to FIELD_TO_SLOTS and made patchFor('price') set
amount. This story uses them and must NOT re-add them.

Acceptance Criteria:
AC1: The Property tab renders a collapsible "Auto-fill from listing" section at the top of the form, containing a
     textarea (data-testid="autofill-paste-input", placeholder "Paste a listing or seller message…") and a button
     (data-testid="autofill-extract-btn", label "Extract & review").
AC2: Clicking "Extract & review" with non-empty text calls POST /api/v1/infographics/generations/extractions with
     { "prompt": "<text>" }; while in flight the button shows "Extracting…" and is disabled; on success the review
     list appears.
AC3: The review list shows one checkable row per mappable fact present in extractedData (address, price as a
     formatted string, beds, baths, sqft, propertyType, transaction derived from listingType, rentalPeriod,
     features); each row shows the label, detected value, current store value or "Empty", and a checkbox;
     empty/0/[] fields are pre-checked, filled fields are pre-unchecked; listingType 'sold' produces no row.
AC4: "Apply selected" calls applyExtractedFacts(checkedFacts) from listingBindings.ts, which calls
     useCanvasStore.pushToHistory exactly once before all element mutations, then useCanvasStore.setState({elements})
     once for the batch; one Ctrl+Z reverts all applied facts; the review panel closes after Apply.
     Ticked price → amount + currency + price = formatPriceForLocale(amount, locale, currencyToken). Ticked intent →
     transaction + property.intent slot. Ticked rentalPeriod → store only.
AC5: Unchecked fields are never written to store or canvas; Apply with zero ticked checkboxes is a no-op.
AC6: prompt-extractor.service.ts ExtractedPropertyData gains rentalPeriod ('month'|'week'|'year'|'day'|null) in the
     interface and the LLM schema; listingType 'for_sale' → transaction 'sale', 'for_rent' → 'rent'; 'sold' is a
     suggestion only.
AC7: The agent sub-object (name, brokerage, brandColors, logoUrl) is never written to useAgentStore or
     usePropertyStore; it appears as non-interactive text in data-testid="autofill-suggestions".
AC8: Each accepted field sets fieldOrigins[fieldName]='accepted-source-text' in a new TOP-LEVEL store key
     fieldOrigins (sibling of `property`, NOT inside PropertyInfo) + setFieldOrigins; resetProperty() clears it.
     Keeping it out of PropertyInfo keeps it out of the saved design and out of Property API requests.
AC9: ExtractionsController has no assertCanGenerate or UsageRecord increment — do NOT add one. Extraction stays free.
AC10: Non-2xx or > 15 s timeout shows a message starting "Could not extract"; form fields unchanged; button re-enabled.
AC11: The Auto-fill section renders without horizontal overflow at 375 px and 1440 px widths.

Out of Scope:
- Listing URL ingestion · reading facts from photos · changes to AI chat · auto-apply without review
- Persisting fieldOrigins to the database · applying 'sold' as a transaction value · retry after timeout
- Any change to credit/usage behaviour on ExtractionsController

Primary files to touch (do NOT touch other files):
- api/src/modules/infographics/services/prompt-extractor.service.ts
- client/src/lib/api.ts (ExtractionResult.extractedData type only)
- client/src/hooks/usePropertyStore.ts
- client/src/lib/listingBindings.ts
- client/src/components/editor/PropertyDetailsForm.tsx
- client/src/lib/__tests__/listingBindings.applyExtractedFacts.spec.ts (new)

Rules:
- Touch ONLY the files listed above
- Do NOT implement anything in Out of Scope
- Run `npm run check` and `npm run test:unit` before declaring done
- When done: list files changed, ACs checked ✅, test command output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-PROP-003-01 | Manual | P0 | Given a pasted WhatsApp listing with address, price and beds, when Extract & review is clicked, then the review list appears within 10 s showing at least those three facts as checkable rows | 🔲 | |
| TC-PROP-003-02 | Manual | P0 | Given the review list has address checked and price unchecked, when Apply selected is clicked, then the address field changes to the detected value, price does not change, and a single Ctrl+Z reverts the address | 🔲 | |
| TC-PROP-003-03 | Manual | P1 | Given a pasted message with the seller's phone number and name, when Apply is clicked with all rows selected, then useAgentStore name and phone are unchanged and those values appear only inside `autofill-suggestions` | 🔲 | |
| TC-PROP-003-04 | Manual | P1 | Given the network is offline (or the server returns 500) when Extract & review is clicked, then a message starting "Could not extract" appears and no Property field changes | 🔲 | |
| TC-PROP-003-05 | Unit | P1 | `applyExtractedFacts([{field:'address',value:'123 Test St'},{field:'price',value:'50000'}])` calls `pushToHistory` exactly once, `setState` exactly once, and returns `true` | 🔲 | |
| TC-PROP-003-06 | Unit | P1 | When `extractedData.listingType` is `'for_rent'` and `rentalPeriod` is `'month'`, the review rows include "Listing intent" = "rent" and "Rental period" = "month" | 🔲 | |
| TC-PROP-003-07 | Manual | P1 | Given a FREE-tier user whose 3 monthly credits are used, when Extract & review is clicked, then the response is 200 with extractedData and no new UsageRecord row is created | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded in the table above
- [ ] `npm run check` passes (0 new TypeScript errors)
- [ ] `npm run test:unit` passes (no regressions; TC-PROP-003-05 and TC-PROP-003-06 green)
- [ ] Gate 2 — manual flow verified in the browser (local or staging)
- [ ] PR merged (PR #_____)
- [ ] No console errors in the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked ✅
- [ ] STORY.md status updated to `✅ Done`

---

## Implementation Update (log)

> Appended by code-agent during/after implementation. Newest entries on top.

### 2026-10-30 — Opus review of PR #83
- `fieldOrigins` moved out of `PropertyInfo` to a top-level store key: `captureListing()` spreads `property` into the saved design, and the Property API rejects unknown keys (`forbidNonWhitelisted`).
- The precondition was wrong: `transaction`, `rentalPeriod` and `amount` are store fields, not `BoundField`s; only `listingIntent` is (added by the new US-PROP-007). AC4 now says what a ticked price writes.
- Now depends on US-PROP-007 as well as US-PROP-002.

### 2026-10-29 — hardened by /new-story
- Found against the code: BL-06 is already fixed — the extractor routes through `resolvePlanTier` + `openAiService.extractStructuredData`, not a hard-coded GPT-4o call. No change needed here.
- Added AC9: extraction is free today (no credit check in `ExtractionsController`); the AC stops an implementer adding one.
- `origin: accepted-source-text` had no home in the code; AC8 defines it as `fieldOrigins` on `PropertyInfo`.

---

*Story drafted: 2026-10-29 · hardened: 2026-10-29*
