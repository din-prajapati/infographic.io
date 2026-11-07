# PR Task List — US-EDIT-042

> **Story:** [STORY.md](./STORY.md)
> **Branch:** codex/v3-editor-checkpoint-2026-11-05 | **PR:** #_____ | **Linear:** Unassigned

## Four Pillars Pre-flight

- [x] **Brain** — User authorized Layers only on2026-11-07. Typed binary ACs and normative Foundation clauses specify exact outcomes; Arrange explicitly future. Official harden required before code.
- [x] **Muscle** — Acceptance-test, implementation and verification tasks below; shared root integration and independent module ownership coordinated. Preserve all uncommitted peer work.
- [x] **Map** — EPIC ARCHITECTURE reviewed: opt-in V3 shell/store/session to existing renderers/export. No backend/schema changes.
- [x] **Env** — ENV.yaml reviewed: proxy5000/API3001, isolated Playwright Vite runner; runtime health checked before live smoke. No secrets or paid calls.

## PR scope

Stable layer ordering, overlap geometry and row actions. All Foundation Contract clauses are normative. No Arrange UI or actions.

## Ordered tasks

- [x] **T1 (45m)** — Write acceptance-derived failing unit/browser tests, exact expected stack IDs/bounds/UI states and cancellation paths.
- [x] **T2 (130m)** — Implement scoped module/UI and coordinate root integration without altering existing document format or approved compact popup.
- [x] **T3 (60m)** — Run mandatory gates, verify history/persistence/PNG, inspect both themes and retain evidence.

## Exact file scope

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

## Local verification — 2026-11-07

Type checks pass; 1,506 unit tests pass, one existing skip; 122 regression + 1 live-overlap browser case pass. Desktop light/dark screenshots inspected and retained. Gate 4 not applicable: no backend/schema change. See `Mockups/approved-v3-editor/LAYERS_VERIFICATION.md`. No new commit/push/merge; formal milestone delivery pending.
