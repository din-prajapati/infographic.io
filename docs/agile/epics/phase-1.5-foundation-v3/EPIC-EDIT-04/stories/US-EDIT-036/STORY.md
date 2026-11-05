# Story Card — US-EDIT-036

> **Status:** In Progress - implemented and verified locally; merge pending
> **Feature:** N/A — approved V3 color/stroke increment
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-11-v3-editor-slice](../../milestones/M-EDIT-11-v3-editor-slice.md)
> **Linear:** Unassigned
> **Size:** M
> **Created:** 2026-11-05 | **Closed:** —
> **Prerequisites:** US-EDIT-035 shared Paint interface and document/runtime semantics; existing031–034 shell/palettes.

---

## Story

*As a* solo real estate agent editing a saved listing design
*I want* to choose and preview colors in one consistent color panel
*So that* I can precisely style any listing element using the same familiar controls.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When a single eligible element color swatch or the canvas background swatch is clicked, `V3ColorPanel.tsx`, `useV3ColorPanel.ts` and the V3 editor integration open the target-aware sidebar and implement every color-panel interaction in the Approved Contract below, including eight targets, custom solid/gradient picker, No Color, grid/list search, document/Brand/default swatches, independent alpha and exactly one Undo revision per completed edit; the approved desktop shell at1242x668 and1440 width retains both themes.
- [x] **AC2 [error-path]:** When an input is invalid, a picker is dismissed with Escape, selection changes, Preview begins, or an eyedropper is unsupported/cancelled, `useV3ColorPanel.ts` and `useV3ElementPreview.ts` discard unfinished edits without changing canonical artwork/history; stale, locked, hidden and multiple element selections cannot receive a paint, panel close restores the prior sidebar, and existing save/load failures remain visibly retryable.

### Approved Contract

[Approved color/paint plan](../../../../../../../Mockups/approved-v3-editor/COLOR_PAINT_PLAN.md) is normative and supplies exact interaction, bounds, paint interface, rendering and failure requirements. Every applicable clause is required for AC1/AC2; this reference is not permission for adjacent features.

Approved user plan2026-11-05 explicitly supersedes historical gradient/paint exclusions in033/034 for this increment. This story is frontend-only and desktop-only as the approved V3 slice; it does not introduce a375px mobile editor shell. No paywall/API endpoint or Socket.io change is introduced. Existing save/load API behavior must remain intact.

---

## Out of Scope

- Does not implement photo-color extraction, image-pixel recoloring, Change all, Crop, new shape types, collaboration, paid AI or SVG/PDF export.
- Does not change the approved Navy/Teal shell, default editor route, authentication, existing plan limits or backend/database schema.
- Does not add unrelated optimizations or rebuild completed031–034 editor features.
- Does not commit, push, merge or deploy without explicit user permission.

---

## Engineering / PR

- **Branch:** `feat/edit/m-11-v3-editor-slice`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
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

Ownership: UI agent owns new V3ColorPanel.tsx, V3PaintPicker.tsx, v3-color-panel.css and their component tests only. Root owns useV3ColorPanel controller, preview hook, V3Editor/V3Panels/V3ImageEditor integration and toolbar color entries. Coordinate shared toolbar with037; do not revert peer edits.

---

## AI Implementation Prompt

> Paste this block into Codex to implement the story.

```text
Context: InfographicAI SaaS — React18/Vite/Wouter/Zustand, Tailwind3/shadcn; NestJS11 API3001 via Express5000; Prisma6. Read AGENTS.md and PROJECT_CONTEXT.yaml.
Story: US-EDIT-036 — Shared color sidebar, picker and transient paint editing

As a solo real estate agent editing a saved listing design, I want to choose and preview colors in one consistent color panel so that I can precisely style any listing element using the same familiar controls.

Acceptance Criteria:
AC1: When a single eligible element color swatch or the canvas background swatch is clicked, `V3ColorPanel.tsx`, `useV3ColorPanel.ts` and the V3 editor integration open the target-aware sidebar and implement every color-panel interaction in the Approved Contract below, including eight targets, custom solid/gradient picker, No Color, grid/list search, document/Brand/default swatches, independent alpha and exactly one Undo revision per completed edit; the approved desktop shell at1242x668 and1440 width retains both themes.
AC2: When an input is invalid, a picker is dismissed with Escape, selection changes, Preview begins, or an eyedropper is unsupported/cancelled, `useV3ColorPanel.ts` and `useV3ElementPreview.ts` discard unfinished edits without changing canonical artwork/history; stale, locked, hidden and multiple element selections cannot receive a paint, panel close restores the prior sidebar, and existing save/load failures remain visibly retryable.
Read and satisfy every applicable normative clause in Mockups/approved-v3-editor/COLOR_PAINT_PLAN.md.

Out of Scope: photo extraction, image recoloring, Change all, Crop, new shapes, collaboration, paid AI, SVG/PDF, shell/default route/auth/plan/backend/schema changes, unrelated optimizations or rebuilding completed features.

Primary files to touch (do NOT touch other files):
client/src/components/editor/v3/V3ColorPanel.tsx
client/src/components/editor/v3/v3-color-panel.css
client/src/components/editor/v3/__tests__/V3ColorPanel.spec.tsx
client/src/hooks/useV3ColorPanel.ts
client/src/hooks/__tests__/useV3ColorPanel.spec.ts
client/src/hooks/useV3ElementPreview.ts
client/src/hooks/__tests__/useV3ElementPreview.spec.ts
client/src/components/editor/v3/V3Editor.tsx
client/src/components/editor/v3/V3Panels.tsx
client/src/components/editor/v3/__tests__/V3Panels.spec.tsx
client/src/components/editor/v3/V3ImageEditor.tsx
client/src/components/editor/v3/__tests__/V3ImageEditor.spec.tsx
client/src/components/editor/v3/V3ElementToolbar.tsx
client/src/components/editor/v3/__tests__/V3ElementToolbar.spec.tsx
e2e/v3-color-paints.spec.ts
e2e/v3-slice.config.ts
e2e/v3-element-toolbars.spec.ts
client/src/components/editor/v3/V3PaintPicker.tsx
client/src/components/editor/v3/__tests__/V3PaintPicker.spec.tsx
Mockups/approved-v3-editor/COLOR_PAINT_VERIFICATION.md

Rules:
- Touch ONLY listed files; governance changes are limited to this card/TASKS/scaffold and official locks/replay.
- Do NOT implement Out of Scope; preserve all existing uncommitted edits and unrelated docs/reviews.
- UI agent owns new V3ColorPanel.tsx, V3PaintPicker.tsx, v3-color-panel.css and their component tests only. Root owns useV3ColorPanel controller, preview hook, V3Editor/V3Panels/V3ImageEditor integration and toolbar color entries. Coordinate shared toolbar with037; do not revert peer edits.
- Require the current official harden lock and acceptance-derived tests before implementation.
- Run npm run check, npm run test:unit, npm run test:unit:client and applicable V3 browser/visual gates.
- When done: list changed files, AC results and actual test output. Do not mark Done before approved PR merge.
- Do not commit/push/merge/deploy without user permission.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-EDIT-036-01 | Unit | P0 | happy-path: When a single eligible element color swatch or the canvas… | ✅ | Complete unit/browser evidence in COLOR_PAINT_VERIFICATION.md |
| TC-EDIT-036-02 | Unit | P0 | error-path: When an input is invalid, a picker is dismissed with Esca… | ✅ | Complete unit/browser evidence in COLOR_PAINT_VERIFICATION.md |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded above
- [x] `npm run check` passes (0 new TypeScript errors)
- [x] `npm run test:unit` passes (no regressions)
- [x] `npm run test:unit:client` passes
- [x] Scoped V3 browser and themed desktop visual gates pass
- [x] Manual flow verified on localhost:5000 or documented equivalent isolated port
- [ ] PR merged (PR #_____)
- [ ] No console errors in changed flow
- [x] [TASKS.md](./TASKS.md) fully checked ✅
- [ ] STORY.md status updated to ✅ Done

## Retained visual evidence scope

- `Mockups/approved-v3-editor/evidence/color-solid-light.png`
- `Mockups/approved-v3-editor/evidence/color-solid-dark.png`
- `Mockups/approved-v3-editor/evidence/color-gradient-light.png`
- `Mockups/approved-v3-editor/evidence/color-gradient-dark.png`
- `Mockups/approved-v3-editor/evidence/color-stroke-dark.png`
- `Mockups/approved-v3-editor/evidence/color-line-type-dark.png`

## Local implementation evidence - 2026-11-05

Gate 1 passed: frontend/API type checks; 811 backend and 614 client unit tests (1,425 total, one pre-existing client skip). Client unit checks run within the root unit command. Gates 2/3 passed: six inspected light/dark reference captures and 89 isolated browser cases, including existing V3 regressions. See [verification record](../../../../../../../Mockups/approved-v3-editor/COLOR_PAINT_VERIFICATION.md). Gate 4 is not triggered by this frontend-only increment. No new real-database persistence smoke or production build is claimed. PR merge, formal Done and broad manual console certification remain unchecked; no commit/push/merge/deploy performed.
