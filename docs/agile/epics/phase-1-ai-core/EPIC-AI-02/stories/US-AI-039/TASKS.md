# PR Task List — US-AI-039

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai-us-ai-039-format-picker-reorg`
> **PR:** #_____ (fill when opened)
> **Type:** feat

---

## Three Pillars Pre-flight (check before starting AI session)

- [x] **Brain** — STORY.md filled: ACs written, out-of-scope listed
- [x] **Muscle** — file list + ordered tasks + exact test commands (below)
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists for this epic
- [x] **Env** — N/A (no new env vars)
- [x] **Dependency** — US-AI-038 (Format Picker) implementation complete pre-PR; this story rewrites its component

---

## PR Scope Summary

**One-liner:** Reorganize the Format Picker from a 3-step sequential dialog into a single persistent modal with a Canva-style category rail, per a live UI/UX audit.
```
feat(ai): Canva-style single-modal format picker reorg — US-AI-039
```

> **Note on size:** Core reorg (T1-T4) is a straight relocation of existing rendering logic behind a new layout shell — no new data fetching, no backend changes. T5 (new E2E spec) is additive scope closing a pre-existing test gap, not required to avoid regressions in the current suite.

---

## Task Breakdown

### T1 — Category rail component
**File:** `client/src/components/pages/FormatPickerDialog.tsx`
- Render one rail item per `FORMAT_TAXONOMY` platform group + a "Custom size" rail item
- Replace `step` state with `activeCategory: string | 'custom'`
- No "Continue" button gating this — clicking a rail item is the full interaction

### T2 — Format tile strip, relocated
**File:** same component
- Render the active category's format tiles inline next to/below the rail
- Reuse `FormatTile` / `ShapePreview` unchanged — no visual or copy changes to the tiles themselves

### T3 — Inline library merge
**File:** same component
- Move the existing Library-step rendering (Start Blank card, skeleton loading, error `Alert`, template grid, zero-templates empty state) to appear inline the moment a format tile is selected — same `canvasTemplatesApi.getByFormatTag` fetch, same trigger condition semantics (fires when `selectedFormatId` changes and category ≠ `'custom'`)
- Remove the back-chevron — no longer needed, nothing to navigate back from

### T4 — Custom size as rail destination + pre-selection on reopen
**File:** same component
- "Custom size" rail item swaps content area to the existing width/height form — reuse validation (100-10000px) unchanged
- On open, derive both the rail category AND the tile to pre-select from `getLastFormat()` + `getFormatById()` (walk `FORMAT_TAXONOMY` to find which group owns the last-used format id)

### T5 — First E2E coverage for this flow
**File:** `e2e/us-ai-039-format-picker-reorg.spec.ts` (new)
- Cover: open via "New Design" → switch rail category → select tile → inline library appears → Custom size submission opens editor at entered dimensions
- Reuse the auth/localStorage fixture pattern from `e2e/qa-canvas-editor.spec.ts`

---

## File-to-Task Mapping

| File | Tasks |
|------|-------|
| `client/src/components/pages/FormatPickerDialog.tsx` | T1, T2, T3, T4 |
| `e2e/us-ai-039-format-picker-reorg.spec.ts` | T5 |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
npm run test:e2e -- e2e/us-ai-039-format-picker-reorg.spec.ts
# Manual: New Design -> Instagram rail item -> Post tile -> Start Blank + library inline, no step transition
# Manual: Custom size rail item -> enter 900x1200 -> editor opens at that exact size
# Manual: pick Instagram Post, reopen picker -> Instagram rail AND Post tile both pre-selected
# Manual: keyboard-only tab through rail + tiles -> focus-visible ring + aria-pressed correct at every stop
```

---

## Task Checklist

- [x] T1 — Category rail component
- [x] T2 — Format tile strip, relocated
- [x] T3 — Inline library merge
- [x] T4 — Custom size as rail destination + pre-selection on reopen
- [x] T5 — First E2E coverage for this flow
- [x] `npm run check` passes
- [x] `npm run test:unit` passes
- [ ] `npm run test:e2e` passes (new spec) — requires fresh `npm run dev` with new code; reuseExistingServer:true will reuse a stale server instance if the app was already running
- [ ] Manual test recorded
- [ ] PR opened with story card as description
- [ ] STORY.md ACs updated

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT touch the separate `/templates` content-category gallery (search + category/style dropdowns) — different screen, out of scope
- Do NOT add a secondary pill-row sub-filter within a category — Buildographic's taxonomy has no second axis that needs one; resist copying that Canva detail speculatively
- Do NOT change `FORMAT_TAXONOMY`'s data shape or add backend calls — this is a presentation-layer refactor of an already-correct data flow

---

*Tasks created: 2026-07-31*
