---
title: Tasks — US-EDIT-029
type: tasks
tags: [orion, edit, phase-1.5]
updated: 2026-10-30
---

# Tasks — US-EDIT-029

> **Story:** [US-EDIT-029](./STORY.md) — V3 tool rail, with Quick Styles in the Text tool
> **Branch:** `feat/edit/m-09-v3-shell` (milestone branch)
> **PR:** #_____
> **PR scope:** labelled rail in `FloatingToolbar`; Text / Elements / Uploads flyouts; Quick Styles moved out of `RightSidebar` into `quickStyles.ts` + `QuickStylesMenu`; two E2E specs re-pointed; one new E2E. No `EditorLayout.tsx`, no canvas renderer, no backend.

---

## Four-Pillars Pre-flight

- [ ] **Brain** — Read `getColorForStyle` (RightSidebar ~605–680) and the helpers it calls (~83–125); note it reads `theme.colors` only.
- [ ] **Muscle** — Before moving anything, record `getColorForStyle` output for 3 palettes (`defaultBrandPalettes`) × backgrounds `#FFFFFF` and `#111111` × 8 styles — these are the parity fixtures.
- [ ] **Map** — `selectedThemeColors` is set at RightSidebar ~705 and cleared at ~683; `FloatingToolbar` is mounted once, in `EditorLayout`.
- [ ] **Env** — `npm run dev` clean; `grep -c "expect(" e2e/qa-canvas-editor.spec.ts e2e/us-design-002-editor-tokens.spec.ts` recorded before T4.

---

## Tasks

### T1 — Move Quick Styles logic (`quickStyles.ts`)
- [ ] Move `textStyles`, `getColorForStyle` (signature `(themeColors: string[] | null, styleName, canvasBg)`) and the five ink helpers.
- [ ] `client/src/lib/__tests__/quickStyles.spec.ts` — TC-EDIT-029-02 against the pre-flight fixtures.

**ACs:** AC4 · **Effort:** S

### T2 — Remove from the Design tab (`RightSidebar.tsx`)
- [ ] Delete the Quick Styles section (~1312–1360), `addStyledText`, the local `getColorForStyle`, `textStyles` and the moved helpers; keep any import still used elsewhere.
- [ ] Toast copy ~line 592: "Quick Styles in the Design tab" → "the Text tool".

**ACs:** AC4 · **Effort:** XS

### T3 — Rail + flyouts (`FloatingToolbar.tsx` + `QuickStylesMenu.tsx`)
- [ ] `nav aria-label="Canvas tools"`; labelled buttons per AC1; Hand beside Select; Duplicate/Delete when selected.
- [ ] `QuickStylesMenu`: Add text + 8 styles; colour from `quickStyles.getColorForStyle(selectedThemeColors, name, backgroundColor)`; element creation as `addStyledText` did.
- [ ] Elements flyout (4 shapes), Uploads → existing hidden file input; Templates / Layers unchanged.
- [ ] Replace palette classes with tokens; keep and comment the preview-chip exception.

**ACs:** AC1, AC2, AC3, AC5 · **Effort:** M

### T4 — Tests
- [ ] Re-point the "Add element" steps in `qa-canvas-editor.spec.ts` and `us-design-002-editor-tokens.spec.ts`; the `expect(` count must not drop.
- [ ] `e2e/us-edit-029-tool-rail.spec.ts` — TC-EDIT-029-01, -03, -04, -06, -07.
- [ ] `npm run check`, `npm run test:unit`; AC6 specs on localhost; TC-EDIT-029-08 by hand; record in STORY.md.

**ACs:** AC5, AC6

---

## File → Task Map

| File | Task | Change type |
|---|:--:|---|
| `client/src/lib/quickStyles.ts` | T1 | new — moved logic |
| `client/src/lib/__tests__/quickStyles.spec.ts` | T1 | new — parity |
| `client/src/components/editor/RightSidebar.tsx` | T2 | remove Quick Styles section + helpers; toast copy |
| `client/src/components/editor/FloatingToolbar.tsx` | T3 | V3 labelled rail + flyouts |
| `client/src/components/editor/QuickStylesMenu.tsx` | T3 | new |
| `e2e/qa-canvas-editor.spec.ts` | T4 | re-point selectors only |
| `e2e/us-design-002-editor-tokens.spec.ts` | T4 | re-point selectors only |
| `e2e/us-edit-029-tool-rail.spec.ts` | T4 | new |

---

## Test Commands

```bash
npm run check
npm run test:unit
cd client && npx vitest run src/lib/__tests__/quickStyles.spec.ts --reporter=verbose
PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-edit-029-tool-rail.spec.ts e2e/qa-canvas-editor.spec.ts e2e/us-design-002-editor-tokens.spec.ts e2e/design-consistency.spec.ts e2e/us-ai-010-photo-upload.spec.ts
```

---

## Anti-patterns for this story

- **Rewriting the colour mapping while moving it.** Move first, prove parity, change nothing else.
- **Lifting `selectedTheme` out of `RightSidebar`.** `selectedThemeColors` already carries it; a lift drags the Brand Styles code US-EDIT-022 is about to replace.
- **Deleting E2E assertions to get green.** Only the click targets change.
- **Reviving `LeftSidebar.tsx` / `ToolsTab.tsx`.** They are dead; build on `FloatingToolbar`.

---

*Tasks created: 2026-10-30*
