# PR Task List — US-PANEL-01

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai/us-panel-01-brand-generation`
> **PR:** #27
> **Type:** feat

---

## Three Pillars Pre-flight (check before starting AI session)

- [x] **Brain** — STORY.md hardened 2026-08-05: 7 typed ACs, coverage complete, reality re-verified against `main` @ 45120fd
- [x] **Muscle** — file list + ordered tasks + exact test commands (below)
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists for this epic
- [x] **Env** — N/A (no new env vars)
- [x] **Dependency** — US-AI-002a ✅ Done (colour-name mapping + no-fallback rule already live server-side)

---

## PR Scope Summary

**One-liner:** Show which brand palette is actually driving generation, and stop silently applying one the agent never chose.

```
feat(editor): brand indicator + honest no-brand default — US-PANEL-01
```

> **Note on ordering:** T1 must land before T2. The indicator's empty state (AC2) is unreachable
> until the mount auto-select is removed, so building the component first gives a false green.

---

## Files In Scope (scope lock — touch nothing else)

| File | Why |
|------|-----|
| `client/src/components/editor/RightSidebar.tsx` | AC1–AC6: auto-select removal, indicator, palette sanitising, Quick Styles copy, nudge |
| `client/src/lib/brandPalette.ts` | **NEW** (deviation D3) — `resolveActivePalette` extracted here so the unit test exercises real code |
| `api/tests/ai-generation/infographic-prompt.builder.spec.ts` | AC3: pin the colour-omission and colour-name contracts (TC-05, TC-06) |
| `api/tests/canvas/panel-brand-indicator.spec.ts` | **NEW** — AC4: `resolveActivePalette` guard (TC-07) |
| `e2e/us-panel-01-brand-indicator.spec.ts` | **NEW** — AC1/AC2/AC4/AC5 (TC-01/02/03/04/08/09) |
| `docs/agile/**` (STORY/TASKS/EPIC/MILESTONE/TEAM_STATUS/PHASE_TRACKER/AGILE_INDEX) | Closeout cascade only |

### Deviations from the planned scope (recorded during implementation)

- **D3 — `resolveActivePalette` lives in `client/src/lib/brandPalette.ts`, not inline in
  `RightSidebar.tsx`.** The plan put it at module scope in the component file. `RightSidebar.tsx`
  imports React, Zustand, motion and sonner, so it cannot be imported into the Node vitest
  environment — the only precedent for testing a client helper here
  (`api/tests/canvas/canvasState.helpers.spec.ts`) works around this by *copying the logic into
  the test file*, which tests a duplicate rather than the shipped code. Extracting the guard into
  a dependency-free module keeps TC-PANEL-01-07 honest. One new file, no behaviour change.

- **D4 — `loadCustomPalettes()` now filters malformed entries (AC4 widened).** The plan guarded
  only the *selected* palette. Writing TC-PANEL-01-08 exposed that the palette **grid** indexes
  `palette.colors[0]` / `[1]` / `[length-1]` directly (`RightSidebar.tsx` theme cards), so a
  stored entry with `colors: null` throws during render and takes the whole right panel down —
  before any selection guard runs. Filtering at the localStorage boundary is the only fix that
  covers the render path; the selection guard stays as defence in depth. TC-PANEL-01-08 was
  updated to assert unusable palettes are never offered as cards, which is also better UX than
  showing a card that errors on click.

**Explicitly NOT touched:** `CenterCanvas.tsx`, `MessageBubble.tsx`, `ResultsVariations.tsx`
(D2 — chat path out of scope) · `client/src/lib/colorNames.ts` (R5 dead code — separate cleanup)
· `infographic-prompt.builder.ts` source (AC3 is verification only, no server change).

---

## Task Breakdown

### T1 — `resolveActivePalette` guard + remove the mount auto-select (AC2, AC4)
**File:** `client/src/components/editor/RightSidebar.tsx`
- Add module-scope pure `resolveActivePalette(p: BrandPalette | null): BrandPalette | null` —
  returns null unless `p.colors` is a non-empty array. Export it for unit testing.
- `useEffect` at :305-314 — keep `loadCustomPalettes()`, drop the `setSelectedTheme` /
  `setSelectedThemeColors` default-palette calls (D1)
- Route `handleGenerate`'s palette read and `getColorForStyle`'s theme argument through the guard
- **Effort:** 0.75h

### T2 — Brand indicator block (AC1, AC2)
**File:** `client/src/components/editor/RightSidebar.tsx`
- Render beneath the Generate sub-label, above the results-ready pill; hidden while `generating`
- Populated: "Brand:" + palette name + up to 5 dot swatches
- Empty: muted "Brand: None — select in Design tab", `onClick` → `setActiveTab("design")`
- `data-testid`: `brand-indicator`, `brand-indicator-name`, `brand-indicator-dot`
- **Effort:** 1.25h

### T3 — Quick Styles help text (AC5)
**File:** `client/src/components/editor/RightSidebar.tsx` (:1036-1038)
- Replace the description with "Add styled text to your canvas after loading a generated design."
- **Effort:** 0.25h

### T4 — Post-generation nudge (AC6)
**File:** `client/src/components/editor/RightSidebar.tsx` (:416)
- `handleUseDesign` success toast description → "Add text overlays with Quick Styles in the Design tab."
- **Effort:** 0.25h

### T5 — Unit tests (AC3, AC4 — TC-05, TC-06, TC-07)
**Files:** `api/tests/ai-generation/infographic-prompt.builder.spec.ts`, `api/tests/canvas/panel-brand-indicator.spec.ts`
- Pin: empty `brandColors` → no `- Color scheme:` line; populated → colour *names*, no raw hex
- Pin: `resolveActivePalette` null-returns for `null`, `{colors: null}`, `{colors: []}`, `{}` and passes a valid palette through
- **Effort:** 0.75h

### T6 — Playwright spec (AC1, AC2, AC4, AC5 — TC-01/02/03/04/08/09)
**File:** `e2e/us-panel-01-brand-indicator.spec.ts`
- Reuse the `ensureLoggedIn` fixture pattern from `us-ai-039-format-picker-reorg.spec.ts`
  (including the `redirect_to_auth` trap workaround)
- **Effort:** 1.25h

### T8 — "None Selected" tile (AC8 — TC-12) · added post-review
**Files:** `client/src/components/editor/RightSidebar.tsx`, `e2e/us-panel-01-brand-indicator.spec.ts`
- `clearBrandPalette()` resets `selectedTheme` + `selectedThemeColors`; deliberately does **not**
  repaint the canvas background or element colours a previous palette applied
- First tile in the Brand Styles grid, selected whenever no palette is active
- White chip + `#1F1F1F` "Aa" — an honest preview of the neutral Quick Styles default, using the
  same forced-light-chip trick as the Quick Styles swatches
- **Effort:** 0.5h

### T9 — Fix background derivation + restore-on-clear (AC9 — TC-13) · defect from owner review
**Files:** `client/src/lib/brandPalette.ts`, `client/src/components/editor/RightSidebar.tsx`,
`api/tests/canvas/panel-brand-indicator.spec.ts`, `e2e/us-panel-01-brand-indicator.spec.ts`
- `pickCanvasBackground()` derives the background from the lightest swatch by luminance; the old
  `colors[colors.length - 1]` rule painted Luxury Gold's canvas warm brown
- `preBrandBackgroundRef` captures the background on the no-brand → brand transition only, so
  switching between palettes does not overwrite the original; `clearBrandPalette()` restores it
- Luminance helpers moved into `brandPalette.ts` so they are unit-testable; `RightSidebar.tsx`
  imports them rather than keeping a second copy
- **Effort:** 1h

### T7 — Gate 1 + manual QA (TC-10, TC-11)
- `npm run check` · `cd api && npx vitest run --config vitest.config.ts`
- Manual: "Use This Design" toast copy; grep the diff for model/provider names
- **Effort:** 0.5h

---

## Verification Commands

```bash
# Gate 1 — mandatory
npm run check
cd api && npx vitest run --config vitest.config.ts

# Targeted unit tests
cd api && npx vitest run tests/ai-generation/infographic-prompt.builder.spec.ts --reporter=verbose
cd api && npx vitest run tests/canvas/panel-brand-indicator.spec.ts --reporter=verbose

# E2E (requires npm run dev in another shell)
npx playwright test e2e/us-panel-01-brand-indicator.spec.ts

# AC7 — model opacity check
git diff main --unified=0 | grep -iE '\+.*(ideogram|gemini|nano.?banana|gpt-4o|openai|dall-?e)'
```

---

## Definition of Done

- [x] AC1–AC9 all ✅ (grew from 7 to 9: AC8 from owner review, AC9 from the defect report)
- [x] TC-PANEL-01-01 … -13 all ✅ or ⚠️ with a recorded finding (F1, F2, F3)
- [x] Gate 1 green on the final commit — `tsc` clean, 164 unit tests, 8 E2E
- [x] PR opened and merged — [#26](https://github.com/din-prajapati/infographic.io/pull/26), squash-merged 2026-08-05
- [x] Closeout cascade: STORY → M-AI-06 → EPIC-AI-02 → PHASE_TRACKER → AGILE_INDEX → TEAM_STATUS

> **DoD exception — TC-PANEL-01-10 not exercised at runtime.** Reaching `handleUseDesign`
> requires a real generation, which spends a metered credit. Verified by inspection and deferred
> to Phase 0 HUMAN **Task 3, row P-27**, where it rides on P-16's generation at zero extra cost.
> The broader local E2E regression sweep is likewise deferred to **row P-28**. Both are tracked
> in [PHASE_0_HUMAN_QA_CHECKLIST.md](../../../../../testing/PHASE_0_HUMAN_QA_CHECKLIST.md),
> not dropped. Approved by: Dinesh, 2026-08-05.

---

*Tasks generated at harden: 2026-08-05*
