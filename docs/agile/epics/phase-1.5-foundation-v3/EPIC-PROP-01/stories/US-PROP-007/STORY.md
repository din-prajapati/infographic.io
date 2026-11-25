> **Scope reconciliation — 2026-11-13:** Superseded draft scope for this implementation slice; the historical task list was NOT implemented as written — V3 delivery verified 2026-11-25 (see **V3 acceptance**). Structured pricing transitions move to US-PROP-002; pricing form to US-EDIT-025; pending versus applied price rendering to US-PROP-004 and Template Fields US-EDIT-020. AI generation pricing changes remain deferred. Do not implement the historical task list below independently; use the reconciled owner cards and integration matrix.

---
title: Story Card — US-PROP-007
type: story
tags: [orion, story, phase-1.5]
updated: 2026-11-25
---

# Story Card — US-PROP-007 — Listing intent and price in the editor

> **Status:** 🟡 Delivered in V3 — acceptance verified 2026-11-25 on `feat/edit/m-v3-default-editor` (draft PR #91); closes when PR #91 merges
> **Epic:** [EPIC-PROP-01](../../EPIC.md)
> **Milestone:** [M-PROP-01-property-record](../../milestones/M-PROP-01-property-record.md)
> **Size:** M
> **Depends on:** [US-PROP-002](../US-PROP-002/STORY.md) must be merged first (`parseIndianPrice`, the four `PropertyInfo` fields).
> **Created:** 2026-10-30 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md)

---

## Story

*As a* real-estate agent who lists both sales and rentals
*I want* to pick For Sale or For Rent and type the price the way I say it
*So that* the canvas shows "FOR RENT" and "₹50,000 / month" (or "FOR SALE" and "₹4.2 Cr") and tells me when an old price can't be read

---

## V3 acceptance (2026-11-25)

> The historical ACs below target the legacy `PropertyDetailsForm` / `listingBindings.ts`. The 2026-11-13 reconciliation moved structured pricing to US-PROP-002, the pricing form to US-EDIT-025 and pending/applied rendering to US-PROP-004 / US-EDIT-020, and **deferred AI generation pricing**. On 2026-11-25 the product owner asked for the poster gap to be closed; V4 records that.

| # | Acceptance (V3 model) | Status | Evidence |
|---|---|---|---|
| V1 | Sale/rent intent, rental period (month / week / year / day) and price are edited in the Listing panel and the property form | ✅ | `shared/listingWorkflow.ts` (`pricingPatch`); `client/src/features/listings/PropertyForm.tsx`; `V3ListingPanel.tsx` |
| V2 | **Apply to design** writes `property.intent` as FOR SALE / FOR RENT and `property.price` with its period (e.g. "₹50,000 / month") | ✅ | `v3ListingWorkflow.ts` slot values; `formatListingPrice` in `shared/listingWorkflow.ts`; `api/tests/listing/listing-workflow.spec.ts`; `listingFormat.spec.ts` |
| V3 | An invalid price is rejected with a message and leaves the saved amount unchanged | ✅ | `pricingPatch` ("enter a valid price with currency"); listing-workflow tests |
| V4 | Generated posters print **FOR RENT** and the price with its period; the extractor returns `rentalPeriod`; sale and sold prompts stay byte-identical to the production-proven format | ✅ | `2e21da3`; `infographic-prompt.builder.spec.ts` (US-PROP-007 block; E3 golden test unchanged); `prompt-extractor.rental-period.spec.ts` |

**Not carried over:** AC4 "Review price format" legacy back-fill warning (legacy editor only); `listingBindings.price.spec.ts` (coverage lives in the listing-workflow and listing-format specs). **Not verified yet:** a real generated rental poster (paid AI call) — check it visually before release.

## Acceptance Criteria (historical — legacy-editor design, superseded 2026-11-13)

- [ ] **AC1 [happy-path]:** `PropertyDetailsForm.tsx` has a **Listing intent** select (For Sale / For Rent) above the price. The price label reads "Sale price" for sale (or unset) and "Rent per {period}" for rent, when a rental-period select (month / week / year / day) appears. Changing intent clears `amount`, `currency` and `price` and clears the canvas `property.price` slot as **one** undo step (`writeFieldToCanvas('price', '')` is the single history entry); one Undo restores the previous price on the canvas and `amount` in the store. Changing only the rental period keeps `amount` and adds no history entry.
- [ ] **AC6 [happy-path]:** Typing a valid price in the Property tab (e.g. "4.2 Cr", "₹50,000 / month") sets `amount` and `currency` from `parseIndianPrice` (and `rentalPeriod` from its period hint when the intent is rent) and writes the `property.price` slot with `formatListingPrice(property)` — one function, exported from `listingBindings.ts`, that returns `formatPriceForLocale(amount, locale, currencyToken)` for a sale and the same plus `" / " + rentalPeriod` for a rent. Every writer of the price slot (this form, the canvas binding, US-PROP-003's Auto-Fill) uses it; the input keeps the typed text as the buffer.
- [ ] **AC2 [happy-path]:** `'property.intent'` is added to `SLOT_IDS` (`client/src/lib/slotIds.ts`) and `listingIntent` to `BoundField` / `FIELD_TO_SLOTS` in `listingBindings.ts`, with `patchFor('listingIntent', 'FOR RENT')` → `{ transaction: 'rent' }` (and `'FOR SALE'` → `'sale'`). An element tagged `property.intent` shows "FOR SALE" or "FOR RENT". For a rental of 50,000 per month the `property.price` slot shows "₹50,000 / month". `PrintedListing` gains `intent`.
- [ ] **AC3 [error-path]:** Typing an unparseable price (e.g. `"abc"`) and leaving the field shows "Enter a valid price (e.g. ₹50 Lakh or 4.2 Cr)" under the input; `amount` and the canvas slot are unchanged. A canvas edit with an invalid price (`writeCanvasToField('property.price', 'abc')`) leaves `amount` unchanged too (`patchFor('price', …)` sets `amount` only when `parseIndianPrice` succeeds).
- [ ] **AC4 [rollback]:** A design saved earlier with only a `price` string opens without errors: `applySavedListing` parses it, and if `parseIndianPrice` succeeds, `amount` and `currency` are filled and no warning shows; if it fails, `amount` stays undefined, the raw text stays in the input, and a `data-testid="price-legacy-warning"` note "Review price format" shows under the field. No saved data is modified or discarded.
- [ ] **AC5 [happy-path]:** Unit tests in `client/src/lib/__tests__/listingBindings.price.spec.ts` (new) cover: `patchFor('listingIntent', …)` both ways; a valid canvas price sets `amount`; an invalid one leaves it; `applySavedListing` back-fill for "₹85,00,000" (→ 8,500,000) and "abc xyz" (→ `amount` undefined). The existing `listingBindings.spec.ts` stays green.

---

## Out of Scope

- The parser, schema, DTOs and the generation path (US-PROP-002)
- Adding `property.intent` to the TemplateSlotSection catalogue or tagging curated templates with it (M-PROP-03)
- An export warning for a missing `amount` — US-EDIT-021 reads the `price-legacy-warning` state
- Markets other than India · deposits · a "SOLD" intent

---

## Engineering / PR

- **Branch:** `feat/prop/m-01-property-record`
- **PR:** #_____
- **Primary files touched:**
  - `client/src/components/editor/PropertyDetailsForm.tsx` — intent and period selects, label, blur validation, legacy warning
  - `client/src/lib/slotIds.ts` — `property.intent`
  - `client/src/lib/listingBindings.ts` — `listingIntent` binding, price parsing in `patchFor`, `PrintedListing.intent`, `applySavedListing` back-fill
  - `client/src/lib/__tests__/listingBindings.price.spec.ts` — new

> **Shared file:** US-PROP-003 and US-PROP-004 also edit `listingBindings.ts`. Order in the milestone: US-PROP-007 → US-PROP-003; US-PROP-004 (M-PROP-03) rebases on whichever merged first.

---

## AI Implementation Prompt

> Paste this block into Claude Code to implement the story.

```
Context: Buildographic (code name InfographicAI) — React client; Zustand stores; canvas bindings in listingBindings.ts. See CLAUDE.md.
Depends on: US-PROP-002 merged — parseIndianPrice in shared/locale.ts; PropertyInfo has amount/currency/transaction/rentalPeriod.

Story: US-PROP-007 — Listing intent and price in the editor

Acceptance Criteria:
AC1: Intent select; label "Sale price" / "Rent per {period}"; period select for rent. Intent change clears price + canvas slot in
     ONE undo step (writeFieldToCanvas('price','') is the only history entry). Period change keeps amount, no history.
AC6: valid typed price → amount/currency (+ rentalPeriod hint) via parseIndianPrice; slot text from formatListingPrice(property) — the ONE
     formatter for sale and rent ("₹4.2 Cr" / "₹50,000 / month"), exported from listingBindings.ts and reused by US-PROP-003.
AC2: property.intent slot + listingIntent binding (patchFor → transaction); rent price slot "₹50,000 / month"; PrintedListing.intent.
AC3: Invalid price → inline error on blur; amount and canvas unchanged; canvas-edit path also leaves amount unchanged.
AC4: Old price strings on load: parseable → amount filled, no warning; unparseable → data-testid="price-legacy-warning".
AC5: listingBindings.price.spec.ts covers the binding, both canvas-price paths and both back-fill cases.

Constraints:
- Extend BoundField, FIELD_TO_SLOTS, patchFor, PrintedListing, applySavedListing — do not add parallel maps.
- Do not call pushToHistory in the intent handler; writeFieldToCanvas already records the entry.
- Keep price: string — saved designs carry it and applySavedListing/hydrateStoresFromCanvas read it.

Out of Scope: parser/schema/DTO/generation (US-PROP-002) · slot catalogue + template tagging · export warning · non-India · SOLD.

Primary files (do NOT touch others): client/src/components/editor/PropertyDetailsForm.tsx · client/src/lib/slotIds.ts ·
client/src/lib/listingBindings.ts · client/src/lib/__tests__/listingBindings.price.spec.ts (new)

Rules: touch only these files; run `npm run check` and `npm run test:unit`; report files changed, ACs checked, test output.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-PROP-007-01 | Manual | P0 | Given a sale at 42,000,000, when the Property tab is open, then the canvas `property.price` slot shows "₹4.2 Cr", never "42000000" | 🔲 | |
| TC-PROP-007-02 | Manual | P0 | Given the canvas shows "₹4.2 Cr", when intent changes to For Rent, then the slot clears; one Ctrl+Z restores "₹4.2 Cr" and `amount` = 42,000,000 | 🔲 | |
| TC-PROP-007-03 | Manual | P0 | Given rent, month, 50,000, then a `property.intent` element shows "FOR RENT" and the price slot "₹50,000 / month" | 🔲 | |
| TC-PROP-007-04 | Manual | P1 | Typing "abc" in price and tabbing out shows the AC3 error; the canvas price is unchanged | 🔲 | |
| TC-PROP-007-05 | Manual | P1 | A design saved with price "₹85,00,000" opens with `amount` 8,500,000 and no warning; one saved with "abc xyz" shows `price-legacy-warning` | 🔲 | |
| TC-PROP-007-06 | Unit | P1 | The AC5 cases — `listingBindings.price.spec.ts` | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅ · all test cases run and recorded
- [ ] `npm run check` · `npm run test:unit` pass
- [ ] Gate 2 — browser checks (local, then staging)
- [ ] PR merged (PR #_____)
- [ ] [TASKS.md](./TASKS.md) fully checked ✅ · STORY.md status `✅ Done`

---

## Implementation Update (log)

> Appended by code-agent during/after implementation. Newest entries on top.

### 2026-10-30 — created by splitting US-PROP-002
- The Opus review of PR #83 found US-PROP-002 needed ~14 files once the generation path was added. The editor half (old AC3, the slot part of AC4, AC5, AC6) moved here.

---

*Story created: 2026-10-30*
