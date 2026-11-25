# PR Task List — US-EDIT-040

> **Story:** [STORY.md](./STORY.md)
> **Branch:** codex/v3-editor-checkpoint-2026-11-05 | **PR:** #_____ | **Linear:** Unassigned

## Four Pillars Pre-flight

- [x] **Brain** — User approved preceding annotated plan on 2026-11-06; normative section 2, typed binary ACs and explicit exclusions recorded. Official harden required before code.
- [x] **Muscle** — Ordered acceptance-test/implementation/verification tasks below; root owns shared integration, dedicated workers own new catalog/component files. Preserve every peer edit.
- [x] **Map** — EPIC ARCHITECTURE reviewed: V3 shell → existing store/session/renderers/export; no new API or schema.
- [x] **Env** — ENV.yaml reviewed: proxy5000/API3001; isolated Playwright Vite runner. No secrets or paid calls. Live server readiness is checked before browser smoke.

## PR scope

Compact shape editing and existing-shape library. Every section 2 clause of the approved plan is normative.

## Ordered tasks

- [x] **T1 (45m)** — Write contract-derived failing command/catalog/UI tests and browser acceptance cases.
- [x] **T2 (120m)** — Implement the scoped commands/catalog/UI and coordinated integration, preserving document/history/rendering behavior.
- [x] **T3 (60m)** — Run mandatory gates, inspect both themes and retain verification evidence.

## Exact file scope

- `client/src/components/editor/v3/V3Editor.tsx`
- `client/src/components/editor/v3/V3Canvas.tsx`
- `client/src/components/editor/v3/V3ElementToolbar.tsx`
- `client/src/components/editor/v3/V3Tools.tsx`
- `client/src/components/editor/v3/V3Panels.tsx`
- `client/src/components/editor/v3/__tests__/V3ElementToolbar.spec.tsx`
- `client/src/components/editor/v3/__tests__/V3Panels.spec.tsx`
- `client/src/styles/v3-element-toolbar.css`
- `e2e/v3-elements-library.spec.ts`
- `e2e/v3-slice.config.ts`
- `e2e/v3-element-toolbars.spec.ts`
- `e2e/v3-color-paints.spec.ts`
- `e2e/v3-annotations.spec.ts`
- `Mockups/approved-v3-editor/ELEMENTS_LIBRARY_PLAN.md`
- `Mockups/approved-v3-editor/ELEMENTS_LIBRARY_VERIFICATION.md`
- `client/src/components/editor/v3/V3ElementsPanel.tsx`
- `client/src/components/editor/v3/__tests__/V3ElementsPanel.spec.tsx`
- `client/src/lib/shapeCatalog.ts`
- `client/src/lib/__tests__/shapeCatalog.spec.ts`
- `client/src/components/editor/v3/V3ShapeLibrary.tsx`
- `client/src/components/editor/v3/v3-shape-library.css`
- `client/src/components/editor/v3/__tests__/V3ShapeLibrary.spec.tsx`
- `Mockups/approved-v3-editor/evidence/elements-shapes-dark.png`

This card, TASKS.md, scaffold.json, parent tracker/counter updates and official locks/replay are governance scope. Root owns shared editor/model/store/action/shortcut integrations. Catalog workers own only their assigned new component/catalog/tests/styles; they are not alone and must not revert peer edits.

## File-to-task mapping

| Files | Task |
|-------|------|
| Scoped unit and browser tests | T1, T3 |
| Scoped runtime components/helpers/styles | T2 |
| Verification report and retained captures | T3 |

## Verification commands

```bash
npm run check
npm run test:unit
npx playwright test --config=e2e/v3-slice.config.ts
```

Gate1 mandatory; Gate2 light/dark desktop inspection at1242×668/1440px; Gate3 scoped flows, focus guards, history, persistence and PNG plus existing regressions. Gate4 backend/schema not triggered. Distinguish mocked save/reload from authenticated real database smoke. Do not weaken failures or mark formal Done before milestone merge.

## Verification evidence

Type checks and 1,476 unit tests pass (one existing skip). Final isolated V3 browser regression: 109 passed. Both-theme visual review and screenshots recorded in `Mockups/approved-v3-editor/ELEMENTS_LIBRARY_VERIFICATION.md`. Gate 4 is not applicable: frontend-only; no API/schema changes. Local implementation complete; no new commit or merge authorized by the approved delivery boundaries.
