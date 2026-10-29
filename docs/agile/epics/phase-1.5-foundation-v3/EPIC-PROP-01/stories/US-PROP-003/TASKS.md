---
title: Tasks — US-PROP-003
type: tasks
tags: [orion, prop, auto-fill, extraction]
updated: 2026-10-29
---

# Tasks — US-PROP-003

> **Story:** [US-PROP-003](./STORY.md) — Auto-Fill from a listing message, with review
> **Branch:** `feat/prop/m-prop-01-property-record`
> **PR:** #_____
> **PR scope:** Add Auto-fill to the Property tab; extend the extractor with `rentalPeriod`; add the batch `applyExtractedFacts()` to `listingBindings.ts`; add `fieldOrigins` to `usePropertyStore`. No credit path touched. No other tabs, services or Prisma migrations modified.

---

## Four-Pillars Pre-flight

Fill before writing code. A story without this is not ready to implement.

- [ ] **Brain** — Re-read `listingBindings.ts` around `writeFieldToCanvas` and `lastWrite`. Be able to explain (1) why applying five fields one by one with `writeFieldToCanvas` would create five undo entries, and (2) why `applyExtractedFacts` must call `pushToHistory` once, collect all element changes, then `setState` once before resetting `lastWrite`. Confirm US-PROP-002's `transaction`, `rentalPeriod` and `amount` exist in `PropertyInfo` and `FIELD_TO_SLOTS` before writing any mapping code.
- [ ] **Muscle** — `npm run dev`; open the editor's Property tab with no console errors. From the browser console call `extractionsApi.extract({ prompt: '3BHK in Bandra West for ₹2.5 Cr' })` and confirm the response shape `{ id, extractedData: { listingType, price, beds }, confidence, missingFields, suggestions }`.
- [ ] **Map** — In `prompt-extractor.service.ts` confirm (a) `ExtractedPropertyData` has no `rentalPeriod` yet, (b) the system-prompt JSON schema does not list it; in `extractions.controller.ts` confirm there is no `assertCanGenerate` call; in `client/src/lib/api.ts` confirm `ExtractionResult.extractedData` has no `rentalPeriod`.
- [ ] **Env** — Baseline `npm run check` and `npm run test:unit` both pass; US-PROP-002 is ✅ Done (or its fields are confirmed present in `usePropertyStore.ts`).

---

## Tasks

### T1 — Extend the extractor with `rentalPeriod`

- [ ] `prompt-extractor.service.ts`: add `rentalPeriod?: 'month' | 'week' | 'year' | 'day'` to `ExtractedPropertyData`.
- [ ] Add `"rentalPeriod": "month" | "week" | "year" | "day" | null` to the system-prompt JSON schema.
- [ ] Map it in `extractPropertyData` and set it in the DEMO_MODE `generateDemoExtraction` literal.
- [ ] `client/src/lib/api.ts`: add `rentalPeriod?` to `ExtractionResult.extractedData`.
- [ ] `npm run check` — 0 new errors.

**Covers:** AC6 (server side), AC2 (response type) · **Effort:** XS

### T2 — `fieldOrigins` on `usePropertyStore`

- [ ] Add `fieldOrigins: Partial<Record<string, string>>` to `PropertyInfo` and `fieldOrigins: {}` to `DEFAULT_PROPERTY`.
- [ ] Confirm `resetProperty()` resets it through the `DEFAULT_PROPERTY` spread (no extra code).
- [ ] `npm run check` — 0 new errors.

**Covers:** AC8 · **Effort:** XS

### T3 — `applyExtractedFacts()` in `listingBindings.ts`

- [ ] Export an `ExtractedFact` type (`field`, `value`).
- [ ] Export `applyExtractedFacts(accepted, origins?) → boolean`: empty input → `false`, no store/canvas calls; otherwise `pushToHistory` once, collect every slot change (stats recomputed once, not per field), `setState({ elements })` once, one `setProperty` patch, merge `origins` into `fieldOrigins`, reset `lastWrite`, return `true`.
- [ ] Unit test `client/src/lib/__tests__/listingBindings.applyExtractedFacts.spec.ts`: `pushToHistory` ×1 and `setState` ×1 for a two-fact input; empty input calls neither; `fieldOrigins` merged when `origins` is passed.
- [ ] `npm run check` + `npm run test:unit` — no regressions.

**Covers:** AC4, AC5, AC8 (part), TC-PROP-003-05 · **Effort:** S

### T4 — "Auto-fill from listing" in `PropertyDetailsForm.tsx`

- [ ] Collapsible section above Property Type: textarea (`autofill-paste-input`), Extract & review button (`autofill-extract-btn`, "Extracting…" + disabled while in flight).
- [ ] Call `extractionsApi.extract({ prompt })` with a 15 s timeout; on error or timeout show "Could not extract…".
- [ ] Build review rows from `extractedData` (listingType → "Listing intent"; `sold` → suggestions); pre-check empty fields only.
- [ ] Apply selected → `applyExtractedFacts(checked, origins)` with `'accepted-source-text'` origins; close the panel; no-op when nothing is checked.
- [ ] `autofill-suggestions` block for suggestions and agent data — text only, no checkboxes, hidden when empty.
- [ ] `w-full` / `flex-col` layout; check 375 px for overflow; no console errors.

**Covers:** AC1–AC7, AC9 (nothing added), AC10, AC11 · **Effort:** M

### T5 — Verify and record

- [ ] Manual TC-PROP-003-01 to -04 in the browser; TC-PROP-003-07 with a FREE account at 3/3 (check no new UsageRecord).
- [ ] Unit TC-PROP-003-05 and -06 green.
- [ ] Record results in STORY.md's Test Cases table.

**Effort:** S

---

## File → Task Map

| File | Task | Change type |
|---|:--:|---|
| `api/src/modules/infographics/services/prompt-extractor.service.ts` | T1 | extend interface + LLM schema |
| `client/src/lib/api.ts` | T1 | extend `ExtractionResult.extractedData` type |
| `client/src/hooks/usePropertyStore.ts` | T2 | add `fieldOrigins` + default |
| `client/src/lib/listingBindings.ts` | T3 | new type + new function |
| `client/src/lib/__tests__/listingBindings.applyExtractedFacts.spec.ts` | T3 | new |
| `client/src/components/editor/PropertyDetailsForm.tsx` | T4 | new UI section |

---

## Test Commands

```bash
npm run check          # Gate 1 — types (after every task)
npm run test:unit      # Gate 1 — api + client vitest (after T3)
PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-prop-003-autofill.spec.ts   # if an E2E is added
```

> Playwright defaults to **staging** — always set `PLAYWRIGHT_BASE_URL` for local runs.

---

## Anti-patterns for this story

- **Calling `pushToHistory` once per field inside `applyExtractedFacts`.** That produces N undo steps — exactly what AC4 forbids. One `pushToHistory` before the loop, one `setState` after.
- **Writing `agent.*` (name, brokerage, brandColors, logoUrl) to any store.** The message is from the seller, not the agent (AC7). No checkbox for these, ever.
- **Adding a credit check to `ExtractionsController`.** Extraction is deliberately free; a check would lock FREE users out after 3 generations and fail TC-PROP-003-07.

---

*Tasks created: 2026-10-29*
