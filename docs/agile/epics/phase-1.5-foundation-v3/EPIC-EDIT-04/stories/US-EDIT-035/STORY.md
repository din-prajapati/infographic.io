# Story Card — US-EDIT-035

> **Status:** In Progress - implemented and verified locally; merge pending
> **Feature:** N/A — approved V3 color/stroke increment
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-11-v3-editor-slice](../../milestones/M-EDIT-11-v3-editor-slice.md)
> **Linear:** Unassigned
> **Size:** M
> **Created:** 2026-11-05 | **Closed:** —
> **Prerequisites:** US-EDIT-031–034 existing runtime. Supplies Paint interface consumed by036/037.

---

## Story

*As a* solo real estate agent editing a saved listing design
*I want* to apply transparent, solid and gradient paints with reliable saved output
*So that* my listing artwork looks the same while editing, after reload and in PNG downloads.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When a saved listing document contains any of the eight approved paint targets, `client/src/lib/paint.ts`, canvas element renderers, `canvasExport.ts`, `canvasUtils.ts`, `useCanvasStore.ts` and the V3 session adapter implement every applicable engine requirement in the Approved Contract below: solid/none/alpha/2–5-stop linear and radial paints render equivalently in DOM/SVG/PNG, survive save/reload, and enter Undo/Redo as one completed edit; background paint creates a dirty revision and old documents retain their former appearance.
- [x] **AC2 [error-path]:** When paint data contains invalid colors, non-finite opacity, invalid gradients or unsupported enums, shared validation prevents an invalid canonical paint and document loading shows the existing load error; when a preview is cancelled or PNG/save fails, no preview is serialized, existing retry/error behavior remains, and a failed save cannot claim the document saved.

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
- `client/src/lib/canvasTypes.ts`
- `client/src/lib/paint.ts`
- `client/src/lib/__tests__/paint.spec.ts`
- `client/src/lib/canvasUtils.ts`
- `client/src/lib/canvasState.ts`
- `client/src/lib/__tests__/canvasState.paints.spec.ts`
- `client/src/hooks/useCanvasStore.ts`
- `client/src/hooks/__tests__/useCanvasStore.paints.spec.ts`
- `client/src/hooks/__tests__/useV3DesignSession.paints.spec.ts`
- `client/src/components/canvas/PaintSvg.tsx`
- `client/src/hooks/useV3DesignSession.ts`
- `client/src/lib/v3DesignSession.ts`
- `client/src/lib/__tests__/v3DesignSession.spec.ts`
- `client/src/components/editor/v3/V3Canvas.tsx`
- `client/src/components/canvas/TextElement.tsx`
- `client/src/components/canvas/ShapeElement.tsx`
- `client/src/components/canvas/ImageElement.tsx`
- `client/src/components/canvas/LineElement.tsx`
- `client/src/components/canvas/__tests__/TextElement.spec.tsx`
- `client/src/components/canvas/__tests__/ImageElement.spec.tsx`
- `client/src/lib/canvasExport.ts`
- `client/src/lib/__tests__/canvasExport.spec.ts`
- `client/src/lib/elementStyles.ts`
- `client/src/lib/__tests__/elementStyles.spec.ts`
- `client/src/lib/lineGeometry.ts`
- `client/src/lib/__tests__/lineGeometry.spec.ts`
- `client/src/lib/v3ElementEditing.ts`
- `client/src/lib/__tests__/v3ElementEditing.spec.ts`

Ownership: Engine agent owns engine files. Root exclusively integrates V3Canvas background rendering and v3ElementEditing helper/reset seams after coordinating engine helpers. Root coordinates all shared types; no overwrite of peer work.

---

## AI Implementation Prompt

> Paste this block into Codex to implement the story.

```text
Context: InfographicAI SaaS — React18/Vite/Wouter/Zustand, Tailwind3/shadcn; NestJS11 API3001 via Express5000; Prisma6. Read AGENTS.md and PROJECT_CONTEXT.yaml.
Story: US-EDIT-035 — Shared paint model, rendering and document persistence

As a solo real estate agent editing a saved listing design, I want to apply transparent, solid and gradient paints with reliable saved output so that my listing artwork looks the same while editing, after reload and in PNG downloads.

Acceptance Criteria:
AC1: When a saved listing document contains any of the eight approved paint targets, `client/src/lib/paint.ts`, canvas element renderers, `canvasExport.ts`, `canvasUtils.ts`, `useCanvasStore.ts` and the V3 session adapter implement every applicable engine requirement in the Approved Contract below: solid/none/alpha/2–5-stop linear and radial paints render equivalently in DOM/SVG/PNG, survive save/reload, and enter Undo/Redo as one completed edit; background paint creates a dirty revision and old documents retain their former appearance.
AC2: When paint data contains invalid colors, non-finite opacity, invalid gradients or unsupported enums, shared validation prevents an invalid canonical paint and document loading shows the existing load error; when a preview is cancelled or PNG/save fails, no preview is serialized, existing retry/error behavior remains, and a failed save cannot claim the document saved.
Read and satisfy every applicable normative clause in Mockups/approved-v3-editor/COLOR_PAINT_PLAN.md.

Out of Scope: photo extraction, image recoloring, Change all, Crop, new shapes, collaboration, paid AI, SVG/PDF, shell/default route/auth/plan/backend/schema changes, unrelated optimizations or rebuilding completed features.

Primary files to touch (do NOT touch other files):
client/src/lib/canvasTypes.ts
client/src/lib/paint.ts
client/src/lib/__tests__/paint.spec.ts
client/src/lib/canvasUtils.ts
client/src/lib/canvasState.ts
client/src/lib/__tests__/canvasState.paints.spec.ts
client/src/hooks/useCanvasStore.ts
client/src/hooks/__tests__/useCanvasStore.paints.spec.ts
client/src/hooks/__tests__/useV3DesignSession.paints.spec.ts
client/src/components/canvas/PaintSvg.tsx
client/src/hooks/useV3DesignSession.ts
client/src/lib/v3DesignSession.ts
client/src/lib/__tests__/v3DesignSession.spec.ts
client/src/components/editor/v3/V3Canvas.tsx
client/src/components/canvas/TextElement.tsx
client/src/components/canvas/ShapeElement.tsx
client/src/components/canvas/ImageElement.tsx
client/src/components/canvas/LineElement.tsx
client/src/components/canvas/__tests__/TextElement.spec.tsx
client/src/components/canvas/__tests__/ImageElement.spec.tsx
client/src/lib/canvasExport.ts
client/src/lib/__tests__/canvasExport.spec.ts
client/src/lib/elementStyles.ts
client/src/lib/__tests__/elementStyles.spec.ts
client/src/lib/lineGeometry.ts
client/src/lib/__tests__/lineGeometry.spec.ts
client/src/lib/v3ElementEditing.ts
client/src/lib/__tests__/v3ElementEditing.spec.ts

Rules:
- Touch ONLY listed files; governance changes are limited to this card/TASKS/scaffold and official locks/replay.
- Do NOT implement Out of Scope; preserve all existing uncommitted edits and unrelated docs/reviews.
- Engine agent owns engine files. Root exclusively integrates V3Canvas background rendering and v3ElementEditing helper/reset seams after coordinating engine helpers. Root coordinates all shared types; no overwrite of peer work.
- Require the current official harden lock and acceptance-derived tests before implementation.
- Run npm run check, npm run test:unit, npm run test:unit:client and applicable V3 browser/visual gates.
- When done: list changed files, AC results and actual test output. Do not mark Done before approved PR merge.
- Do not commit/push/merge/deploy without user permission.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-EDIT-035-01 | Unit | P0 | happy-path: When a saved listing document contains any of the eight a… | ✅ | Complete unit/browser evidence in COLOR_PAINT_VERIFICATION.md |
| TC-EDIT-035-02 | Unit | P0 | error-path: When paint data contains invalid colors, non-finite opaci… | ✅ | Complete unit/browser evidence in COLOR_PAINT_VERIFICATION.md |

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

## Saved-document compatibility seam

- `client/src/components/editor/CenterCanvas.tsx` - root-owned display-only integration of backgroundPaint in the legacy artboard. No legacy color controls or editor route changes. Required so saved V3 backgrounds retain their paint when opened through the existing route.

## Local implementation evidence - 2026-11-05

Gate 1 passed: frontend/API type checks; 811 backend and 614 client unit tests (1,425 total, one pre-existing client skip). Client unit checks run within the root unit command. Gates 2/3 passed: six inspected light/dark reference captures and 89 isolated browser cases, including existing V3 regressions. See [verification record](../../../../../../../Mockups/approved-v3-editor/COLOR_PAINT_VERIFICATION.md). Gate 4 is not triggered by this frontend-only increment. No new real-database persistence smoke or production build is claimed. PR merge, formal Done and broad manual console certification remain unchecked; no commit/push/merge/deploy performed.
