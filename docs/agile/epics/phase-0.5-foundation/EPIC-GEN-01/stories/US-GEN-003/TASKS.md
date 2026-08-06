# PR Task List — US-GEN-003

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/gen/us-gen-003-locale-aware-output`
> **PR:** TBD
> **Type:** feat

---

## Three Pillars Pre-flight

- [x] **Brain** — STORY.md hardened 2026-08-06: 8 typed ACs, coverage complete, premise corrected
- [x] **Muscle** — file list + ordered tasks + test commands (below)
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd)
- [x] **Env** — N/A (no new env vars)
- [x] **Dependency** — none

---

## PR Scope Summary

**One-liner:** Stop printing `$` on every infographic; format price, area and rooms per the listing's market.

```
feat(gen): locale-aware output formatting — US-GEN-003
```

> **Ordering note:** T1 before everything. The locale table is the contract the other tasks read.
> T3 (passthrough) is the AC4 no-blocker guarantee and must land with T2, not after — without it,
> an unresolved locale silently falls back to `$` again.

---

## Files In Scope (scope lock)

| File | Why |
|------|-----|
| `shared/locale.ts` | **NEW** — locale table + pure formatters. `shared/` because both `api/` (`@shared`) and Vite client resolve it |
| `api/src/modules/ai-generation/services/infographic-prompt.builder.ts` | `derivePromptParts` reads `propertyData.locale` |
| `api/src/modules/infographics/dto/generate-from-chat.dto.ts` | `locale?: string` |
| `api/src/modules/infographics/services/generations.service.ts` | Carry `dto.locale` into `propertyData` |
| `client/src/lib/api.ts` | `locale` on the generate request type |
| `client/src/hooks/usePropertyStore.ts` | `locale` field (per-property override, AC6) |
| `client/src/components/editor/RightSidebar.tsx` | Resolve + send locale |
| `client/src/components/ai-chat/AIChatBox.tsx` | Resolve + send locale (chat surface) |
| `client/src/components/editor/PropertyDetailsForm.tsx` | Locale chip (AC6) + placeholders (AC7) |
| `api/tests/ai-generation/locale.spec.ts` | **NEW** — AC1–AC5, AC8 |
| `api/tests/ai-generation/infographic-prompt.builder.spec.ts` | AC3 regression pin (unmodified assertions) |

**Explicitly NOT touched:** `prompt-extractor.service.ts` (the corrected design leaves the LLM
contract alone — see Harden findings) · any payment/subscription module (D2) · app i18n.

---

## Task Breakdown

### T1 — `shared/locale.ts`: table + pure formatters (AC1, AC2, AC4)
- `LOCALES` map: `en-US`, `en-IN`. Facets: symbol, position, abbreviations, grouping, area unit, room format
- `parseCurrencySymbol(raw)` → locale id or null
- `resolveLocale({ override, rawPriceText, orgDefault, timezone })` — first match wins
- `formatPrice` / `formatArea` / `formatRooms`, each with **per-facet** fallback
- **Effort:** 2h

### T2 — Wire the builder (AC2, AC3)
**File:** `infographic-prompt.builder.ts`
- `derivePromptParts` resolves conventions from `propertyData.locale`
- `formatPriceShort` / `formatSqft` keep their signatures (tests + back-compat) and delegate
- **Effort:** 1.5h

### T3 — Passthrough (AC4, AC5)
- No locale + typed symbol → echo the symbol; no locale + no symbol → digits, **no invented `$`**
- Unknown locale id or missing facet → per-facet fallback, never throw, never block
- **Effort:** 1h

### T4 — Transport (AC1)
- `locale?: string` on `GenerateFromChatDto`; `generations.service` merges into `propertyData`
- `client/src/lib/api.ts` request type
- **Effort:** 1h

### T5 — Client resolution + override (AC1, AC6)
- `usePropertyStore.locale`; resolve in `RightSidebar.handleGenerate` and `AIChatBox`
- Locale chip near the price field, click to override — reuse the US-PANEL-01 indicator pattern
- **Effort:** 2h

### T6 — Locale-derived placeholders (AC7)
- `PropertyDetailsForm` price placeholder follows resolved locale
- **Effort:** 0.5h

### T7 — Unit tests (TC-01…09)
- Includes the AC8 guard: nothing under `ai-generation/` reads payment fields
- **Effort:** 1.5h

### T8 — E2E (TC-10/11/12) + Gate 1
- **Effort:** 1.5h

---

## Verification Commands

```bash
npm run check
npm run test:unit
cd api && npx vitest run tests/ai-generation/locale.spec.ts --reporter=verbose

# E2E — standalone Vite (see US-PANEL-01 runtime note; do NOT reuse a stale dev server)
BROWSER=none npx vite --port 5200 --strictPort
PLAYWRIGHT_BASE_URL=http://localhost:5200 npx playwright test e2e/us-gen-003-locale.spec.ts --project=chrome-headed
```

---

## Definition of Done

- [ ] AC1–AC8 ✅
- [ ] TC-GEN-003-01 … -12 ✅ (or ⚠️ with a recorded finding)
- [ ] Gate 1 green on the final commit
- [ ] PR opened and merged
- [ ] Closeout cascade

---

*Tasks generated at harden: 2026-08-06*
