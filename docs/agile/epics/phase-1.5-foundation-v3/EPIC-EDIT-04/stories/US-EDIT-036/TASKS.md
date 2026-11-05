# PR Task List — US-EDIT-036

> **Story:** [STORY.md](./STORY.md)
> **Branch:** feat/edit/m-11-v3-editor-slice | **PR:** #_____ | **Linear:** Unassigned

## Four Pillars Pre-flight

- [x] **Brain** — user-approved COLOR_PAINT_PLAN and binary ACs recorded; official harden lock required before coding.
- [x] **Muscle** — exact scoped ownership and ordered tasks below; acceptance-derived tests precede runtime.
- [x] **Map** — EPIC ARCHITECTURE reviewed: opt-in V3 → session/store → shared renderers/export; existing endpoints remain.
- [x] **Env** — ENV.yaml reviewed; React/Vite/proxy5000/API3001 and isolated Playwright runner. Runtime availability is verified before live smoke; no secrets or paid-provider calls.

## Ordered tasks

- [x] **T1 (45m)** — Define acceptance-derived panel/controller preview, target eligibility, picker, keyboard and cancellation tests.
- [x] **T2 (120m)** — Build shared sidebar/picker and integrate all swatch entry points, existing Brand palette editing and root-owned transient target controller.
- [x] **T3 (60m)** — Verify light/dark reference screenshots, all targets, cancel/Undo/Redo and old/new save/reload/export browser flows; record gate evidence.

## Exact file scope

- `client/src/components/editor/v3/V3ColorPanel.tsx`
- `client/src/components/editor/v3/v3-color-panel.css`
- `client/src/components/editor/v3/__tests__/V3ColorPanel.spec.tsx`
- `client/src/hooks/useV3ColorPanel.ts`
- `client/src/hooks/__tests__/useV3ColorPanel.spec.ts`
- `client/src/hooks/useV3ElementPreview.ts`
- `client/src/hooks/__tests__/useV3ElementPreview.spec.ts`
- `client/src/components/editor/v3/V3Editor.tsx`
- `client/src/components/editor/v3/V3Panels.tsx`
- `client/src/components/editor/v3/__tests__/V3Panels.spec.tsx`
- `client/src/components/editor/v3/V3ImageEditor.tsx`
- `client/src/components/editor/v3/__tests__/V3ImageEditor.spec.tsx`
- `client/src/components/editor/v3/V3ElementToolbar.tsx`
- `client/src/components/editor/v3/__tests__/V3ElementToolbar.spec.tsx`
- `e2e/v3-color-paints.spec.ts`
- `e2e/v3-slice.config.ts`
- `e2e/v3-element-toolbars.spec.ts`
- `client/src/components/editor/v3/V3PaintPicker.tsx`
- `client/src/components/editor/v3/__tests__/V3PaintPicker.spec.tsx`
- `Mockups/approved-v3-editor/COLOR_PAINT_VERIFICATION.md`

UI agent owns new V3ColorPanel.tsx, V3PaintPicker.tsx, v3-color-panel.css and their component tests only. Root owns useV3ColorPanel controller, preview hook, V3Editor/V3Panels/V3ImageEditor integration and toolbar color entries. Coordinate shared toolbar with037; do not revert peer edits.

Card/TASKS/scaffold and official locks/replay are governance scope. No other paths without root reconciliation and lock refresh. Preserve peer edits. Implementation lines/changes are recorded only after actual work, not prefilled.

## Verification commands

```bash
npm run check
npm run test:unit
npm run test:unit:client
npx playwright test --config=e2e/v3-slice.config.ts
```

Gate1 mandatory. Gate2: both themes at1242x668 and1440 desktop. Gate3: color/stroke lifecycle, history, save/reload/PNG plus complete existing V3 regressions. Gate4 backend/DI/schema not triggered; preserve existing API and distinguish mocked browser tests from authenticated real-server smoke. No Done or delivery claim without actual evidence.

## Retained visual evidence scope

- `Mockups/approved-v3-editor/evidence/color-solid-light.png`
- `Mockups/approved-v3-editor/evidence/color-solid-dark.png`
- `Mockups/approved-v3-editor/evidence/color-gradient-light.png`
- `Mockups/approved-v3-editor/evidence/color-gradient-dark.png`
- `Mockups/approved-v3-editor/evidence/color-stroke-dark.png`
- `Mockups/approved-v3-editor/evidence/color-line-type-dark.png`

Local verification 2026-11-05: all ordered tasks completed; type checks, 1,425 unit tests and 89 browser cases passed. Evidence: Mockups/approved-v3-editor/COLOR_PAINT_VERIFICATION.md. Merge and formal Done remain pending.
