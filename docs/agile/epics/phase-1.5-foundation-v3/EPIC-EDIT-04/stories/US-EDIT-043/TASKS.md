# PR Task List — US-EDIT-043

> **Story:** [STORY.md](./STORY.md)
> **Branch:** codex/v3-editor-checkpoint-2026-11-05 | **PR:** #_____ | **Linear:** Unassigned

## Four Pillars Pre-flight

- [x] **Brain** — User authorized Layers only on2026-11-07. Typed binary ACs and normative Sidebar clauses specify exact outcomes; Arrange explicitly future. Official harden required before code.
- [x] **Muscle** — Acceptance-test, implementation and verification tasks below; shared root integration and independent module ownership coordinated. Preserve all uncommitted peer work.
- [x] **Map** — EPIC ARCHITECTURE reviewed: opt-in V3 shell/store/session to existing renderers/export. No backend/schema changes.
- [x] **Env** — ENV.yaml reviewed: proxy5000/API3001, isolated Playwright Vite runner; runtime health checked before live smoke. No secrets or paid calls.

## PR scope

Layers sidebar with actual previews, row menus and drag ordering. All Sidebar Contract clauses are normative. No Arrange UI or actions.

## Ordered tasks

- [x] **T1 (45m)** — Write acceptance-derived failing unit/browser tests, exact expected stack IDs/bounds/UI states and cancellation paths.
- [x] **T2 (130m)** — Implement scoped module/UI and coordinate root integration without altering the document format; replace the compact popup with footer sidebar entry per latest annotation.
- [x] **T3 (60m)** — Run mandatory gates, verify history/persistence/PNG, inspect both themes and retain evidence.

## Exact file scope

- `client/src/components/editor/v3/V3LayersPanel.tsx`
- `client/src/components/editor/v3/V3LayerPreview.tsx`
- `client/src/components/editor/v3/v3-layers-panel.css`
- `client/src/components/editor/v3/__tests__/V3LayersPanel.spec.tsx`
- `client/src/components/editor/v3/__tests__/V3LayerPreview.spec.tsx`
- `client/src/components/editor/v3/V3Editor.tsx`
- `client/src/components/editor/v3/V3Canvas.tsx`
- `client/src/components/editor/v3/V3ElementToolbar.tsx`
- `client/src/components/editor/v3/v3-editor.css`
- `client/src/styles/v3-element-toolbar.css`
- `client/src/components/editor/v3/__tests__/V3ElementToolbar.spec.tsx`
- `e2e/v3-element-toolbars.spec.ts`
- `e2e/v3-approved-shell.spec.ts`
- `e2e/v3-elements-library.spec.ts`
- `e2e/v3-layers-panel.spec.ts`
- `e2e/v3-slice.config.ts`
- `Mockups/approved-v3-editor/evidence/layers-all-dark.png`
- `Mockups/approved-v3-editor/evidence/layers-all-light.png`
- `Mockups/approved-v3-editor/evidence/layers-overlapping-dark.png`
- `Mockups/approved-v3-editor/evidence/layers-menu-dark.png`
- `Mockups/approved-v3-editor/evidence/layers-drag-dark.png`
- `client/src/lib/v3LayerGeometry.ts`
- `client/src/lib/v3LayerActions.ts`
- `client/src/lib/__tests__/v3LayerGeometry.spec.ts`
- `client/src/lib/__tests__/v3LayerActions.spec.ts`
- `client/src/lib/v3EditorActions.ts`
- `client/src/lib/__tests__/v3EditorActions.spec.ts`
- `client/src/lib/canvasUtils.ts`
- `client/src/lib/lineGeometry.ts`
- `client/src/lib/paint.ts`
- `client/src/hooks/useCanvasStore.ts`
- `client/src/lib/canvasTypes.ts`
- `Mockups/approved-v3-editor/LAYERS_VERIFICATION.md`

Card/TASKS/scaffold, parent trackers/counters and official locks/replay are governance scope. Root exclusively owns V3Editor.tsx/V3Canvas.tsx/V3ElementToolbar.tsx and shared integration tests. Dedicated workers own new layer geometry/actions and new preview/sidebar module paths. Shared canvasUtils/lineGeometry/paint helpers are allowed only as required. Do not revert peer changes.

## File-to-task mapping

| Files | Task |
|-------|------|
| Scoped unit/browser tests | T1, T3 |
| Scoped layer/helpers/components/styles and root integration | T2 |
| Verification report and retained screenshots | T3 |

## Verification commands

```bash
npm run check
npm run test:unit
npx playwright test --config=e2e/v3-slice.config.ts
```

Gate1 mandatory; Gate2 both themes at1242×668/1440px; Gate3 real stacking/preview/drag/menu/overlap/history/persistence/PNG and existing browser regressions. Gate4 backend/schema not triggered. Isolated API-mocked browser save/reload is not authenticated database evidence. Formal Done/merge stay unchecked until human-approved milestone delivery.

## Live presentation integration scope

- `client/src/components/canvas/RotationHandle.tsx` — optional preview callback, no legacy behavior change.
- `client/src/components/canvas/__tests__/RotationHandle.spec.tsx` — optional callback contract if needed.

## Local verification — 2026-11-07

Type checks pass; 1,506 unit tests pass, one existing skip; 122 regression + 1 live-overlap browser case pass. Desktop light/dark screenshots inspected and retained. Gate 4 not applicable: no backend/schema change. See `Mockups/approved-v3-editor/LAYERS_VERIFICATION.md`. No new commit/push/merge; formal milestone delivery pending.

## Annotation revision scope — 2026-11-07

- `client/src/components/editor/v3/V3ElementActionsMenu.tsx` — shared layer-row/toolbar menu.
- `client/src/components/editor/v3/__tests__/V3ElementActionsMenu.spec.tsx` — exact shared action contracts.
- `Mockups/approved-v3-editor/POSITION_LAYERS_PLAN.md` — record superseded entry.

Root owns V3Canvas/V3Editor, E2E tests and governance. Code agent owns shared actions menu, V3LayersPanel/V3ElementToolbar integration and their unit tests/CSS. No commits; preserve all peer edits.

## Annotation revision verification

T1/T2/T3 revision complete locally: footer acceptance test reproduced old popup; shared-menu tests caught pointer and accessible-name issues; final type/unit gates pass and all124 browser contracts are covered by full run + 28/28 affected rerun. Both-theme evidence refreshed; Arrange excluded. No new commit/push/merge.
