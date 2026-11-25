# Story Card — US-EDIT-039

> **Status:** 🟡 In Progress — implementation verified locally; milestone merge pending
> **Feature:** N/A — approved M-EDIT-11 annotation extension
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-11-v3-editor-slice](../../milestones/M-EDIT-11-v3-editor-slice.md)
> **Linear:** Unassigned
> **Size:** M
> **Created:** 2026-11-06 | **Closed:** —

---

## Story

*As a* solo real estate agent designing a property listing
*I want* to use selected-element toolbar actions and keyboard shortcuts
*So that* I can edit listings quickly without accidental browser actions.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When a solo real estate agent selects text, shape, image or line elements, V3ElementToolbar.tsx and useV3EditorShortcuts.ts expose the ordered Lock/Duplicate/Delete/final-More controls and every shortcut in section 1 of ELEMENTS_LIBRARY_PLAN.md; shared v3EditorActions.ts commands preserve contents and produce exactly one Undo step per multi-element mutation.
- [x] **AC2 [error-path]:** When the selection is empty, locked, stale, hidden, in Preview or focus is inside a text field, contenteditable or menu, v3EditorActions.ts and useV3EditorShortcuts.ts follow section 1 eligibility/focus rules without modifying an unintended element or creating history; locked elements remain unlockable through Layers.

- [x] **AC3 [happy-path]:** When Layers is opened in V3, V3Canvas.tsx displays compact 36px layer rows with 24px visibility/lock controls and no fixed blank panel height; Underline, Strikethrough and the three-state Text case control are direct buttons in the text formatting toolbar before common actions, and their existing undoable formatting behavior is retained.
- [x] **AC4 [error-path]:** When a pointer is pressed outside the Layers panel and its trigger (including canvas artwork), V3Canvas.tsx dismisses Layers without consuming the underlying interaction; inside layer selection/visibility/lock interactions keep it open, trigger toggling and Escape still close it, and the final Element actions menu retains only common commands.

## Normative Contract and prerequisites

The approved normative requirements for this story are section 1 and Delivery boundaries of [ELEMENTS_LIBRARY_PLAN.md](../../../../../../../Mockups/approved-v3-editor/ELEMENTS_LIBRARY_PLAN.md). Every numbered clause in that section is part of AC1/AC2; sibling sections define integration seams, not permission to rebuild siblings. Explicitly desktop-only editor composition; preserve the existing 375px fallback. Both approved themes must remain usable at 1242×668 and 1440px.

Prerequisite: existing locally verified US-EDIT-031–038 checkpoint. Shared integration interfaces are coordinated by root; no dependency on unimplemented backend stories. This is one bounded frontend slice; sibling catalog data can be tested independently.

---

## Out of Scope

- Does not implement new polygon/star/flowchart geometry, Crop or a new drawing engine.
- Does not change backend, auth, plan tiers, Property schema, legacy default route or approved Navy/Teal shell.
- Does not add paid services, external icon/emoji downloads, arbitrary SVG uploads, persistent grouping or unrelated optimization.

---

## Engineering / PR

- **Branch:** `codex/v3-editor-checkpoint-2026-11-05` (explicitly requested existing checkpoint)
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
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
- `client/src/lib/canvasTypes.ts`
- `client/src/hooks/useCanvasStore.ts`
- `client/src/lib/canvasUtils.ts`
- `client/src/lib/canvasState.ts`
- `client/src/lib/v3ElementEditing.ts`
- `client/src/hooks/useV3ElementPreview.ts`
- `client/src/hooks/useV3ColorPanel.ts`
- `client/src/lib/__tests__/canvasState.safeGeometry.spec.ts`
- `client/src/lib/__tests__/v3ElementEditing.spec.ts`
- `client/src/hooks/__tests__/useV3ElementPreview.spec.ts`
- `client/src/hooks/__tests__/useV3ColorPanel.spec.ts`
- `client/src/components/editor/LayersPanel.tsx`
- `client/src/components/editor/sidebar/LayerItem.tsx`
- `client/src/components/editor/sidebar/LayerItemWithThumbnail.tsx`
- `client/src/components/editor/sidebar/LayersTab.tsx`
- `client/src/lib/v3EditorActions.ts`
- `client/src/lib/__tests__/v3EditorActions.spec.ts`
- `client/src/hooks/useV3EditorShortcuts.ts`
- `client/src/hooks/__tests__/useV3EditorShortcuts.spec.ts`
- `Mockups/approved-v3-editor/evidence/common-toolbar-dark.png`

---

## AI Implementation Prompt

> Paste this block into Codex to implement the story.

```text
Context: InfographicAI SaaS — React18/Vite/Wouter/Zustand frontend through Express5000, NestJS11 API3001, Prisma6. Read AGENTS.md and PROJECT_CONTEXT.yaml.
Story: US-EDIT-039 — Common element actions and V3 keyboard parity
As a solo real estate agent designing a property listing, I want to use selected-element toolbar actions and keyboard shortcuts so that I can edit listings quickly without accidental browser actions.
Acceptance Criteria:
AC1: When a solo real estate agent selects text, shape, image or line elements, V3ElementToolbar.tsx and useV3EditorShortcuts.ts expose the ordered Lock/Duplicate/Delete/final-More controls and every shortcut in section 1 of ELEMENTS_LIBRARY_PLAN.md; shared v3EditorActions.ts commands preserve contents and produce exactly one Undo step per multi-element mutation.
AC2: When the selection is empty, locked, stale, hidden, in Preview or focus is inside a text field, contenteditable or menu, v3EditorActions.ts and useV3EditorShortcuts.ts follow section 1 eligibility/focus rules without modifying an unintended element or creating history; locked elements remain unlockable through Layers.
Read section 1 and Delivery boundaries of Mockups/approved-v3-editor/ELEMENTS_LIBRARY_PLAN.md; all clauses are normative.
Out of Scope:
- Does not implement new polygon/star/flowchart geometry, Crop or a new drawing engine.
- Does not change backend, auth, plan tiers, Property schema, legacy default route or approved Navy/Teal shell.
- Does not add paid services, external icon/emoji downloads, arbitrary SVG uploads, persistent grouping or unrelated optimization.
Primary files to touch (do NOT touch other files):
client/src/components/editor/v3/V3Editor.tsx
client/src/components/editor/v3/V3Canvas.tsx
client/src/components/editor/v3/V3ElementToolbar.tsx
client/src/components/editor/v3/V3Tools.tsx
client/src/components/editor/v3/V3Panels.tsx
client/src/components/editor/v3/__tests__/V3ElementToolbar.spec.tsx
client/src/components/editor/v3/__tests__/V3Panels.spec.tsx
client/src/styles/v3-element-toolbar.css
e2e/v3-elements-library.spec.ts
e2e/v3-slice.config.ts
e2e/v3-element-toolbars.spec.ts
e2e/v3-color-paints.spec.ts
e2e/v3-annotations.spec.ts
Mockups/approved-v3-editor/ELEMENTS_LIBRARY_PLAN.md
Mockups/approved-v3-editor/ELEMENTS_LIBRARY_VERIFICATION.md
client/src/lib/canvasTypes.ts
client/src/hooks/useCanvasStore.ts
client/src/lib/canvasUtils.ts
client/src/lib/canvasState.ts
client/src/lib/v3ElementEditing.ts
client/src/hooks/useV3ElementPreview.ts
client/src/hooks/useV3ColorPanel.ts
client/src/lib/__tests__/canvasState.safeGeometry.spec.ts
client/src/lib/__tests__/v3ElementEditing.spec.ts
client/src/hooks/__tests__/useV3ElementPreview.spec.ts
client/src/hooks/__tests__/useV3ColorPanel.spec.ts
client/src/components/editor/LayersPanel.tsx
client/src/components/editor/sidebar/LayerItem.tsx
client/src/components/editor/sidebar/LayerItemWithThumbnail.tsx
client/src/components/editor/sidebar/LayersTab.tsx
client/src/lib/v3EditorActions.ts
client/src/lib/__tests__/v3EditorActions.spec.ts
client/src/hooks/useV3EditorShortcuts.ts
client/src/hooks/__tests__/useV3EditorShortcuts.spec.ts
Mockups/approved-v3-editor/evidence/common-toolbar-dark.png
Rules:
- Touch ONLY listed files plus this card/TASKS/scaffold and official locks/replay governance.
- Use existing .codex-worktrees/v3-slice checkout and checkpoint branch; preserve peer changes.
- Do NOT implement Out of Scope; obtain official harden lock before coding.
- Write acceptance-derived failing tests first; shared runtime files are root-owned.
- Run npm run check and npm run test:unit before declaring locally implemented.
- Run the complete scoped V3 browser suite and record mocked versus authenticated persistence honestly.
- When done: list files changed, ACs checked and actual test command output.
- No commit, push, merge, deploy or formal Done without applicable permission/gates.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-EDIT-039-01 | Unit | P0 | happy-path: When a solo real estate agent selects text, shape, image … | ✅ | Unit + isolated browser evidence; see verification report |
| TC-EDIT-039-02 | Unit | P0 | error-path: When the selection is empty, locked, stale, hidden, in Pr… | ✅ | Unit + isolated browser evidence; see verification report |
| TC-EDIT-039-03 | Unit | P0 | happy-path: When Layers is opened in V3, V3Canvas.tsx displays compac… | ✅ | 113-case browser regression + visual evidence |
| TC-EDIT-039-04 | Unit | P0 | error-path: When a pointer is pressed outside the Layers panel and it… | ✅ | 113-case browser regression + visual evidence |

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

## Integration scope clarification

- `client/src/components/editor/sidebar/LayerItem.tsx`

## Local verification — 2026-11-06

Gate 1: frontend/API type checks; 811 API + 665 client tests pass, one existing skip. Gate 2: desktop light/dark visual inspection and retained screenshots. Gate 3: 109 isolated browser tests pass, including all prior V3 regression cases. Gate 4: not applicable (no backend/schema change). API-mocked save/reload is not authenticated database certification. Evidence and keyboard comparison: `Mockups/approved-v3-editor/ELEMENTS_LIBRARY_VERIFICATION.md`. Formal Done/PR merge remains pending.

## Annotation follow-up — 2026-11-06

Latest user annotations supersede the earlier placement of text toggles in More. Add V3-scoped Layers density/outside dismissal and direct text toolbar controls. Preserve all uncommitted library work. No commit/push/merge for this follow-up.

Follow-up verification: type checks pass; 1,476 unit tests pass (one existing skip); all 113 isolated browser cases pass. Compact Layers light/dark and direct toolbar screenshots reviewed and retained. No new commit/push/merge.

## Superseding Layers annotation — 2026-11-07

US-EDIT-043 now replaces the compact-popup portions of AC3/AC4: footer Layers opens the full sidebar and canvas selection keeps it open. Text formatting remains direct. The common final More uses the shared layer action menu. See the revised US-EDIT-043 contract for current acceptance; earlier verification above is historical.
