# Story Card — US-EDIT-043

> **Status:** 🟡 In Progress — locally implemented and verified; milestone merge pending
> **Feature:** N/A — approved Layers-only M-EDIT-11 extension
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-11-v3-editor-slice](../../milestones/M-EDIT-11-v3-editor-slice.md)
> **Linear:** Unassigned
> **Size:** M
> **Created:** 2026-11-07 | **Closed:** —

---

## Story

*As a* solo real estate agent refining a property listing
*I want* to browse and operate layers in a preview sidebar with overlap filtering
*So that* I can find and adjust the correct listing element quickly.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When a solo real estate agent opens the footer Layers button, V3LayersPanel.tsx and V3LayerPreview.tsx satisfy Sidebar clauses 1–7 and the approved Layers plan, with All/Overlapping, real previews, clicked-row menus, keyboard/drag ordering, fixed background and footer-only sidebar entry and shared element action menus; committed ordering survives Undo/Redo, save/reload and PNG.
- [x] **AC2 [error-path]:** When selection is empty/stale/hidden/locked, an image is loading/broken, a menu or drag is cancelled, or Overlapping is active, V3LayersPanel.tsx and V3LayerPreview.tsx enforce Sidebar clauses 1–7 fallback/disabled/no-history behavior, preserve previous-sidebar restoration and remain accessible in both desktop themes without showing any Arrange controls.

## Approved scope and prerequisites

User authorization on 2026-11-07 is **Layers only**. The full Layers ASCII, Actual previews, Reordering, Overlapping and Layers-relevant Delivery acceptance sections of [POSITION_LAYERS_PLAN.md](../../../../../../../Mockups/approved-v3-editor/POSITION_LAYERS_PLAN.md) are normative. The proposal's combined Position/Arrange entry is superseded: title Layers, entry accessible name `Layers` in the footer, All/Overlapping only; Arrange is future work explicitly excluded. Every clause below belongs to AC1/AC2 and is individually testable.

Prerequisites: Existing locally verified US-EDIT-031–041 checkpoint; pure APIs can be verified independently. UI consumes the helpers in US-EDIT-042.

### Sidebar Contract

1. The footer `Layers` button opens/toggles the full Layers sidebar, including without a selected element; it never opens the old compact popup. No element toolbar contains an Open Layers sidebar shortcut. The sidebar is titled Layers, exposes All and Overlapping, and has NO Arrange tab, numeric position controls, future placeholders or page-alignment actions. Closing restores the previous sidebar. Canvas clicks/selecting layers keep the full sidebar open; its close button, footer toggle or Escape dismisses it. This supersedes the earlier compact-popup and toolbar-entry contract.
2. Full rows are approximately 52–56px, front/top to back/bottom, scrollable, with an aspect-preserving clipped appearance preview, selected styling, drag handle and row menu. A fixed page-background row remains last, cannot be dragged/deleted/duplicated/selected as an element, and opens the existing background color flow. Hidden rows remain in All, dimmed with Show action. Locked rows can be selected/unlocked through the sidebar. Hover/focus reveals controls; keyboard access does not require hover.
3. `V3LayerPreview.tsx` renders actual text/font/color/case (including emoji), shape geometry/fill/border/gradient, source image/fit/corners/flips (including property SVG icons), and shared line path/color/weight/dashes/endings. Reuse pure paint/geometry helpers, never interactive draggable canvas elements. Clip previews, retain element aspect ratio, avoid repeated expensive source-image work and invalidate when appearance changes. Broken/loading images show a stable named fallback with no effect on selection/export.
4. Row menu entries are Copy, Paste, Duplicate, Delete, Bring forward, Send backward, Bring to front, Send to back, Hide/Show and Lock/Unlock. It targets/selects its clicked row before acting, reuses US-EDIT-042 and existing atomic helpers, disables stack-boundary and locked mutations, and supports keyboard focus, Escape and outside dismissal. Do not expose unsupported Copy style, comments, links or other reference-only features.
5. Handle-only single-row drag in All shows an insertion line, auto-scrolls near top/bottom edges and commits exactly once on drop. Escape, cancelled/stale/locked targets and same-place drops leave history unchanged. Keyboard row actions provide the same four global stack operations. Keep geometry/style and selected IDs. Do not silently drag whole multi-selections or add fake grouping.
6. Overlapping uses the current US-EDIT-042 geometry output live. With no selection show `Select an element to see overlapping layers.` With only selected items show an explicit selected-only message. Disable dragging within filtered results, explain this and offer `Switch to All to drag`; four global stack commands remain available. Hidden selected elements cannot leak into this view.
7. All four element types, icons and emoji remain usable in both Navy/Teal themes at 1242×668 and 1440px desktop widths; no panel/row menu/toolbar control is clipped off-screen. Sidebar names, tabs, controls and statuses are accessible by keyboard and screen reader. This editor composition is explicitly desktop-only; preserve the current 375px fallback. No new network requests or backend changes are required. Existing V3 flows remain intact except the explicitly replaced compact Layers entry. All common toolbar More menus use the same compact icon rows/separators/disabled styling as layer-row menus: Copy, Paste, Duplicate, Delete, the four stack actions, Hide/Show and Lock/Unlock. Preserve direct Lock/Duplicate/Delete and final More placement, existing type-specific property controls and atomic multi-selection safeguards. List those type-specific controls in the verification report.

---

## Out of Scope

- Does not implement any Arrange tab, page-alignment action, dimension/ratio/X/Y/rotation fields, distribute/tidy-up or future placeholder.
- Does not change approved Navy/Teal shell, old default route, backend/schema/auth, plan tiers or paid services.
- Does not add pixel-alpha collision, persistent grouping, multi-layer block dragging, new export formats or unrelated optimization.

---

## Engineering / PR

- **Branch:** `codex/v3-editor-checkpoint-2026-11-05`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
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

Shared helper paths are allowed only when needed for these clauses; no opportunistic refactors. Catalog and existing uncommitted editor changes must be preserved.

---

## AI Implementation Prompt

> Paste this block into Codex to implement the story.

```text
Context: InfographicAI SaaS — React18/Vite/Wouter/Zustand frontend through Express5000, NestJS11 API3001, Prisma6. Read AGENTS.md and PROJECT_CONTEXT.yaml.
Story: US-EDIT-043 — Layers sidebar with actual previews, row menus and drag ordering
As a solo real estate agent refining a property listing, I want to browse and operate layers in a preview sidebar with overlap filtering so that I can find and adjust the correct listing element quickly.
Acceptance Criteria:
AC1: When a solo real estate agent opens the footer Layers button, V3LayersPanel.tsx and V3LayerPreview.tsx satisfy Sidebar clauses 1–7 and the approved Layers plan, with All/Overlapping, real previews, clicked-row menus, keyboard/drag ordering, fixed background and footer-only sidebar entry and shared element action menus; committed ordering survives Undo/Redo, save/reload and PNG.
AC2: When selection is empty/stale/hidden/locked, an image is loading/broken, a menu or drag is cancelled, or Overlapping is active, V3LayersPanel.tsx and V3LayerPreview.tsx enforce Sidebar clauses 1–7 fallback/disabled/no-history behavior, preserve previous-sidebar restoration and remain accessible in both desktop themes without showing any Arrange controls.
Read every Sidebar Contract clause in STORY.md and approved Layers-only scope. POSITION_LAYERS_PLAN.md Arrange sections are expressly excluded by the user's later authorization.
Out of Scope:
- Does not implement any Arrange tab, page-alignment action, dimension/ratio/X/Y/rotation fields, distribute/tidy-up or future placeholder.
- Does not change approved Navy/Teal shell, old default route, backend/schema/auth, plan tiers or paid services.
- Does not add pixel-alpha collision, persistent grouping, multi-layer block dragging, new export formats or unrelated optimization.
Primary files to touch (do NOT touch other files):
client/src/components/editor/v3/V3LayersPanel.tsx
client/src/components/editor/v3/V3LayerPreview.tsx
client/src/components/editor/v3/v3-layers-panel.css
client/src/components/editor/v3/__tests__/V3LayersPanel.spec.tsx
client/src/components/editor/v3/__tests__/V3LayerPreview.spec.tsx
client/src/components/editor/v3/V3Editor.tsx
client/src/components/editor/v3/V3Canvas.tsx
client/src/components/editor/v3/V3ElementToolbar.tsx
client/src/components/editor/v3/v3-editor.css
client/src/styles/v3-element-toolbar.css
client/src/components/editor/v3/__tests__/V3ElementToolbar.spec.tsx
e2e/v3-element-toolbars.spec.ts
e2e/v3-approved-shell.spec.ts
e2e/v3-elements-library.spec.ts
e2e/v3-layers-panel.spec.ts
e2e/v3-slice.config.ts
Mockups/approved-v3-editor/evidence/layers-all-dark.png
Mockups/approved-v3-editor/evidence/layers-all-light.png
Mockups/approved-v3-editor/evidence/layers-overlapping-dark.png
Mockups/approved-v3-editor/evidence/layers-menu-dark.png
Mockups/approved-v3-editor/evidence/layers-drag-dark.png
client/src/lib/v3LayerGeometry.ts
client/src/lib/v3LayerActions.ts
client/src/lib/__tests__/v3LayerGeometry.spec.ts
client/src/lib/__tests__/v3LayerActions.spec.ts
client/src/lib/v3EditorActions.ts
client/src/lib/__tests__/v3EditorActions.spec.ts
client/src/lib/canvasUtils.ts
client/src/lib/lineGeometry.ts
client/src/lib/paint.ts
client/src/hooks/useCanvasStore.ts
client/src/lib/canvasTypes.ts
Mockups/approved-v3-editor/LAYERS_VERIFICATION.md
Rules:
- Touch ONLY listed files plus this card/TASKS/scaffold and official locks/replay governance.
- Read exact helper/runtime interfaces first; root owns V3Editor/V3Canvas/toolbar integration.
- Obtain official harden lock and acceptance-derived failing tests before runtime code.
- Other agents are working in the same checkout; preserve peer changes and coordinate shared files.
- Run npm run check and npm run test:unit; run scoped V3 browser suite for integration.
- Record changed files, ACs and actual outputs; distinguish mocked persistence from real authenticated save/reload.
- No commit, push, merge, deploy or formal Done without applicable permission and gates.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-EDIT-043-01 | Unit | P0 | happy-path: When a solo real estate agent opens the footer Layers but… | ✅ | Unit + browser evidence in LAYERS_VERIFICATION.md |
| TC-EDIT-043-02 | Unit | P0 | error-path: When selection is empty/stale/hidden/locked, an image is … | ✅ | Unit + browser evidence in LAYERS_VERIFICATION.md |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded in table above
- [x] `npm run check` passes (0 new TypeScript errors)
- [x] `npm run test:unit` passes (no regressions)
- [x] Manual flow verified on `localhost:5000` or documented isolated equivalent
- [x] Scoped browser and light/dark desktop visual gates pass
- [ ] PR merged (PR #_____)
- [ ] No console errors in changed flow
- [x] [TASKS.md](./TASKS.md) task list fully checked ✅
- [ ] STORY.md status updated to `✅ Done`

## Live presentation integration scope

- `client/src/components/canvas/RotationHandle.tsx` — optional preview callback, no legacy behavior change.
- `client/src/components/canvas/__tests__/RotationHandle.spec.tsx` — optional callback contract if needed.

## Local gate results — 2026-11-07

Gate 1: type checks; 811 API + 695 client unit tests pass, one existing skip. Gate 2: desktop light/dark visual inspection with retained screenshots. Gate 3: 122 regression browser cases + 1 live-overlap case pass. Gate 4: not applicable (frontend-only). API-mocked save/reload does not certify authenticated database persistence. Formal merge remains pending; no new commit/push/merge. Full evidence: `Mockups/approved-v3-editor/LAYERS_VERIFICATION.md`.

## Annotation revision — 2026-11-07

Latest user annotations supersede the previous compact footer and toolbar Layers shortcut. Revision verified: type checks and 1,515 unit tests pass; 124 distinct browser cases covered by full run plus final affected rerun (28/28). No Arrange work or commit requested.

## Shared action component scope

- `client/src/components/editor/v3/V3ElementActionsMenu.tsx`
- `client/src/components/editor/v3/__tests__/V3ElementActionsMenu.spec.tsx`

The component replaces the duplicated row/toolbar common-menu implementations. It does not change the specialized property controls.

## Annotation revision final gate results

Frontend/API types pass; 811 API + 704 client unit tests pass, one existing skip. Full browser run 116/124 then final affected rerun 28/28 includes every failure and all Layers/library cases, covering124 distinct contracts. Both theme screenshots inspected and refreshed. See LAYERS_VERIFICATION.md for run-level details. Formal merge/Done pending; no new commit/push/merge.
