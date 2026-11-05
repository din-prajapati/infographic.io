# Story Card — US-EDIT-037

> **Status:** In Progress - implemented and verified locally; merge pending
> **Feature:** N/A — approved V3 color/stroke increment
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-11-v3-editor-slice](../../milestones/M-EDIT-11-v3-editor-slice.md)
> **Linear:** Unassigned
> **Size:** M
> **Created:** 2026-11-05 | **Closed:** —
> **Prerequisites:** US-EDIT-035 new short-dashed model/render support; US-EDIT-036 separate color entries; existing031–034 toolbars.

---

## Story

*As a* solo real estate agent editing a saved listing design
*I want* to adjust element strokes and line types in compact visual menus
*So that* I can recognize and apply border and line formatting without oversized panels.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When a selected shape/image/line opens Stroke style or a line opens Type, `V3ElementToolbar.tsx` and `v3-element-toolbar.css` display and operate the compact menus specified by the Approved Contract below: visual patterns, width controls, shape/image zero-width restoration, line rounded ends, and three compact icon/check type rows; completed changes update live artwork with one Undo step and line-type selection closes its menu.
- [x] **AC2 [error-path]:** When a stroke preview is cancelled, the selected element becomes ineligible, or a numeric weight is invalid/outside the target range, `V3ElementToolbar.tsx` preserves the previous canonical style/history and cannot apply stale edits; existing border color, corners, caps/endings, geometry and text/image formatting remain available without nested color controls or oversized Type panels.

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
- `client/src/components/editor/v3/V3ElementToolbar.tsx`
- `client/src/styles/v3-element-toolbar.css`
- `client/src/components/editor/v3/__tests__/V3ElementToolbar.spec.tsx`
- `e2e/v3-element-toolbars.spec.ts`
- `Mockups/approved-v3-editor/COLOR_PAINT_VERIFICATION.md`

Ownership: Root owns toolbar stroke/type sections, corresponding CSS and tests. Coordinate toolbar color entries with036 and consume035 engine enum/helper contract without editing engine files.

---

## AI Implementation Prompt

> Paste this block into Codex to implement the story.

```text
Context: InfographicAI SaaS — React18/Vite/Wouter/Zustand, Tailwind3/shadcn; NestJS11 API3001 via Express5000; Prisma6. Read AGENTS.md and PROJECT_CONTEXT.yaml.
Story: US-EDIT-037 — Compact stroke styling and line-type menus

As a solo real estate agent editing a saved listing design, I want to adjust element strokes and line types in compact visual menus so that I can recognize and apply border and line formatting without oversized panels.

Acceptance Criteria:
AC1: When a selected shape/image/line opens Stroke style or a line opens Type, `V3ElementToolbar.tsx` and `v3-element-toolbar.css` display and operate the compact menus specified by the Approved Contract below: visual patterns, width controls, shape/image zero-width restoration, line rounded ends, and three compact icon/check type rows; completed changes update live artwork with one Undo step and line-type selection closes its menu.
AC2: When a stroke preview is cancelled, the selected element becomes ineligible, or a numeric weight is invalid/outside the target range, `V3ElementToolbar.tsx` preserves the previous canonical style/history and cannot apply stale edits; existing border color, corners, caps/endings, geometry and text/image formatting remain available without nested color controls or oversized Type panels.
Read and satisfy every applicable normative clause in Mockups/approved-v3-editor/COLOR_PAINT_PLAN.md.

Out of Scope: photo extraction, image recoloring, Change all, Crop, new shapes, collaboration, paid AI, SVG/PDF, shell/default route/auth/plan/backend/schema changes, unrelated optimizations or rebuilding completed features.

Primary files to touch (do NOT touch other files):
client/src/components/editor/v3/V3ElementToolbar.tsx
client/src/styles/v3-element-toolbar.css
client/src/components/editor/v3/__tests__/V3ElementToolbar.spec.tsx
e2e/v3-element-toolbars.spec.ts
Mockups/approved-v3-editor/COLOR_PAINT_VERIFICATION.md

Rules:
- Touch ONLY listed files; governance changes are limited to this card/TASKS/scaffold and official locks/replay.
- Do NOT implement Out of Scope; preserve all existing uncommitted edits and unrelated docs/reviews.
- Root owns toolbar stroke/type sections, corresponding CSS and tests. Coordinate toolbar color entries with036 and consume035 engine enum/helper contract without editing engine files.
- Require the current official harden lock and acceptance-derived tests before implementation.
- Run npm run check, npm run test:unit, npm run test:unit:client and applicable V3 browser/visual gates.
- When done: list changed files, AC results and actual test output. Do not mark Done before approved PR merge.
- Do not commit/push/merge/deploy without user permission.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-EDIT-037-01 | Unit | P0 | happy-path: When a selected shape/image/line opens Stroke style or a … | ✅ | Complete unit/browser evidence in COLOR_PAINT_VERIFICATION.md |
| TC-EDIT-037-02 | Unit | P0 | error-path: When a stroke preview is cancelled, the selected element … | ✅ | Complete unit/browser evidence in COLOR_PAINT_VERIFICATION.md |

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


## Local implementation evidence - 2026-11-05

Gate 1 passed: frontend/API type checks; 811 backend and 614 client unit tests (1,425 total, one pre-existing client skip). Client unit checks run within the root unit command. Gates 2/3 passed: six inspected light/dark reference captures and 89 isolated browser cases, including existing V3 regressions. See [verification record](../../../../../../../Mockups/approved-v3-editor/COLOR_PAINT_VERIFICATION.md). Gate 4 is not triggered by this frontend-only increment. No new real-database persistence smoke or production build is claimed. PR merge, formal Done and broad manual console certification remain unchecked; no commit/push/merge/deploy performed.
