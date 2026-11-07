# Story Card — US-EDIT-041

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
*I want* to insert property amenity icons and editable icon-label rows
*So that* I can produce clear consistent listing templates like the supplied German reference.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When a solo real estate agent opens Icons or Emoji, propertyIcons.ts, V3IconLibrary.tsx and V3ElementsPanel.tsx satisfy every section 3 requirement in ELEMENTS_LIBRARY_PLAN.md: the 26-entry bilingual categorized SVG catalog, icon-only or atomic editable-label insertion, solid color/stroke editing and replacement, existing-image save/reload/PNG preservation, and curated editable text emoji.
- [x] **AC2 [error-path]:** When icon search is empty, icon metadata or color/stroke input is invalid, a replacement target becomes stale/locked, or image decode/export fails, propertyIcons.ts and V3Editor.tsx follow section 3 validation/error behavior without arbitrary SVG execution, unintended edits or false success; keyboard names, theme contrast and desktop bounds remain valid.

## Normative Contract and prerequisites

The approved normative requirements for this story are section 3 and Delivery boundaries of [ELEMENTS_LIBRARY_PLAN.md](../../../../../../../Mockups/approved-v3-editor/ELEMENTS_LIBRARY_PLAN.md). Every numbered clause in that section is part of AC1/AC2; sibling sections define integration seams, not permission to rebuild siblings. Explicitly desktop-only editor composition; preserve the existing 375px fallback. Both approved themes must remain usable at 1242×668 and 1440px.

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
- `client/src/components/editor/v3/V3ElementsPanel.tsx`
- `client/src/components/editor/v3/__tests__/V3ElementsPanel.spec.tsx`
- `client/src/lib/propertyIcons.ts`
- `client/src/lib/__tests__/propertyIcons.spec.ts`
- `client/src/components/editor/v3/V3IconLibrary.tsx`
- `client/src/components/editor/v3/v3-icon-library.css`
- `client/src/components/editor/v3/__tests__/V3IconLibrary.spec.tsx`
- `client/src/components/canvas/ImageElement.tsx`
- `client/src/components/canvas/__tests__/ImageElement.spec.tsx`
- `client/src/lib/canvasExport.ts`
- `client/src/lib/__tests__/canvasExport.spec.ts`
- `Mockups/approved-v3-editor/evidence/elements-icons-light.png`
- `Mockups/approved-v3-editor/evidence/elements-icons-dark.png`
- `Mockups/approved-v3-editor/evidence/elements-emoji-dark.png`

---

## AI Implementation Prompt

> Paste this block into Codex to implement the story.

```text
Context: InfographicAI SaaS — React18/Vite/Wouter/Zustand frontend through Express5000, NestJS11 API3001, Prisma6. Read AGENTS.md and PROJECT_CONTEXT.yaml.
Story: US-EDIT-041 — Property SVG icon and emoji library
As a solo real estate agent designing a property listing, I want to insert property amenity icons and editable icon-label rows so that I can produce clear consistent listing templates like the supplied German reference.
Acceptance Criteria:
AC1: When a solo real estate agent opens Icons or Emoji, propertyIcons.ts, V3IconLibrary.tsx and V3ElementsPanel.tsx satisfy every section 3 requirement in ELEMENTS_LIBRARY_PLAN.md: the 26-entry bilingual categorized SVG catalog, icon-only or atomic editable-label insertion, solid color/stroke editing and replacement, existing-image save/reload/PNG preservation, and curated editable text emoji.
AC2: When icon search is empty, icon metadata or color/stroke input is invalid, a replacement target becomes stale/locked, or image decode/export fails, propertyIcons.ts and V3Editor.tsx follow section 3 validation/error behavior without arbitrary SVG execution, unintended edits or false success; keyboard names, theme contrast and desktop bounds remain valid.
Read section 3 and Delivery boundaries of Mockups/approved-v3-editor/ELEMENTS_LIBRARY_PLAN.md; all clauses are normative.
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
client/src/components/editor/v3/V3ElementsPanel.tsx
client/src/components/editor/v3/__tests__/V3ElementsPanel.spec.tsx
client/src/lib/propertyIcons.ts
client/src/lib/__tests__/propertyIcons.spec.ts
client/src/components/editor/v3/V3IconLibrary.tsx
client/src/components/editor/v3/v3-icon-library.css
client/src/components/editor/v3/__tests__/V3IconLibrary.spec.tsx
client/src/components/canvas/ImageElement.tsx
client/src/components/canvas/__tests__/ImageElement.spec.tsx
client/src/lib/canvasExport.ts
client/src/lib/__tests__/canvasExport.spec.ts
Mockups/approved-v3-editor/evidence/elements-icons-light.png
Mockups/approved-v3-editor/evidence/elements-icons-dark.png
Mockups/approved-v3-editor/evidence/elements-emoji-dark.png
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
| TC-EDIT-041-01 | Unit | P0 | happy-path: When a solo real estate agent opens Icons or Emoji, prope… | ✅ | Unit + isolated browser evidence; see verification report |
| TC-EDIT-041-02 | Unit | P0 | error-path: When icon search is empty, icon metadata or color/stroke … | ✅ | Unit + isolated browser evidence; see verification report |

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

- `client/src/lib/paint.ts`
- `client/src/lib/__tests__/paint.spec.ts`

## Local verification — 2026-11-06

Gate 1: frontend/API type checks; 811 API + 665 client tests pass, one existing skip. Gate 2: desktop light/dark visual inspection and retained screenshots. Gate 3: 109 isolated browser tests pass, including all prior V3 regression cases. Gate 4: not applicable (no backend/schema change). API-mocked save/reload is not authenticated database certification. Evidence and keyboard comparison: `Mockups/approved-v3-editor/ELEMENTS_LIBRARY_VERIFICATION.md`. Formal Done/PR merge remains pending.
