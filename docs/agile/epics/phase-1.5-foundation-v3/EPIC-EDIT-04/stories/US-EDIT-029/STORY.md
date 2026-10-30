---
title: Story Card — US-EDIT-029
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-30
---

# Story Card — US-EDIT-029 — V3 tool rail, with Quick Styles in the Text tool

> **Status:** 🔲 Not Started — created 2026-10-30 by /new-story (split from the US-EDIT-024 L draft; also takes over US-EDIT-022 AC5)
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-09-v3-shell](../../milestones/M-EDIT-09-v3-shell.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Depends on:** [US-EDIT-024](../US-EDIT-024/STORY.md) must be merged into the milestone branch first (it removes Undo/Redo from `FloatingToolbar.tsx`, the same file). Must reach `main` before [US-EDIT-022](../US-EDIT-022/STORY.md) changes the Design tab (same `RightSidebar.tsx` region).
> **Created:** 2026-10-30 | **Closed:** —
> **Source:** [US-EDIT-024](../US-EDIT-024/STORY.md) draft AC4; [US-EDIT-022](../US-EDIT-022/STORY.md) AC5; V3 canvas mockup (`Mockups/buildographic-canvas-simplification-v3/index.html` — `nav.tool-rail`; untracked)

---

## Story

*As* an agent editing a design
*I want* a labelled tool rail — Select, Templates, Text, Elements, Uploads, Layers — with my text styles inside the Text tool
*So that* I find each tool where I expect it, and adding styled text no longer lives in the Design tab

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** The left rail (`FloatingToolbar.tsx`, `nav` with `aria-label="Canvas tools"`) shows labelled buttons, top to bottom: **Select** · **Templates** · **Text** · **Elements** · **Uploads** · then a rule and **Layers**. Each button has a visible label under its icon and an `aria-label` equal to that label. **Hand** stays reachable as a second button in the Select group (`aria-label="Hand"`, H / Space shortcuts unchanged). Duplicate and Delete still appear while an element is selected.
- [ ] **AC2 [happy-path]:** **Text** opens a flyout (new `QuickStylesMenu.tsx`, `aria-label="Text styles"`) with **Add text** (same element as today's Add element → Text) and the eight **Quick Styles** (Headline Large … Price Tag). Clicking a style adds the same text element, with the same colour, as the Design tab's Quick Styles does today.
- [ ] **AC3 [happy-path]:** **Elements** opens a flyout with Square, Circle, Triangle and Star (today's Shapes); **Uploads** opens the image file picker (today's Add element → Image); **Templates** and **Layers** toggle their panels as today. Every tool reachable before this story is reachable after it — nothing is removed.
- [ ] **AC4 [happy-path]:** The Quick Styles section is removed from the Design tab in `RightSidebar.tsx`. `textStyles`, `getColorForStyle` and its ink-readability helpers move unchanged into new `client/src/lib/quickStyles.ts`; the colour source becomes the canvas store's `selectedThemeColors` (set by the Design tab when a palette is chosen, `null` for None) plus `backgroundColor`. Unit test: for three palettes × two backgrounds × eight styles, the moved function returns the same colour as the old one (expected values captured from the current code before the move). The "Quick Styles in the Design tab" toast copy (~line 592) is updated to "the Text tool".
- [ ] **AC5 [theme]:** Theme tokens only — the US-EDIT-024 AC6 grep finds no hex, `rgb()`/`rgba()` or Tailwind palette class in added lines, **except** inside the Quick Styles preview chip, which shows canvas ink on a canvas-like swatch on purpose (today's `bg-white` chip); that exception is commented in the code. Today's coloured menu icons (`text-blue-500`, `text-green-500`, …) and the `hover:bg-red-50` delete style are replaced with tokens. Contrast ≥ 4.5:1 for the rail labels and flyout text in light and dark: `e2e/us-edit-029-tool-rail.spec.ts` runs the scoped WCAG probe over `nav[aria-label="Canvas tools"]` and each open flyout (the preview chip excluded) → zero failures.
- [ ] **AC6 [regression]:** `npm run check` and `npm run test:unit` pass. The E2E steps that click `button[aria-label='Add element']` (`qa-canvas-editor.spec.ts` lines ~52/71/89/98, `us-design-002-editor-tokens.spec.ts` lines ~295/322) are re-pointed to the new Text / Elements / Uploads buttons **without removing or weakening any assertion**, and pass on localhost with `design-consistency` and `us-ai-010-photo-upload`.

---

## Out of Scope

- Deleting the dead `LeftSidebar.tsx` and `sidebar/ToolsTab.tsx` (unused today — a cleanup item for the backlog, not this story)
- Recent photos / an uploads library in the Uploads flyout (V3 has one; not asked for)
- Any other Design tab change — Look, Accent colour, Property photo, Format & logo (US-EDIT-022)
- New text styles, new shapes, or changes to `createTextElement` / `createShapeElement`
- Top bar, canvas header (US-EDIT-024), guide bar (US-EDIT-028)

---

## Engineering / PR

- **Branch:** `feat/edit/m-09-v3-shell` (milestone branch)
- **PR:** #_____
- **Primary files touched:**
  - `client/src/components/editor/FloatingToolbar.tsx` — labelled V3 rail + Text / Elements / Uploads flyouts
  - `client/src/components/editor/QuickStylesMenu.tsx` — new: Text flyout (Add text + Quick Styles)
  - `client/src/lib/quickStyles.ts` — new: `textStyles`, `getColorForStyle` and helpers, moved from `RightSidebar.tsx`
  - `client/src/lib/__tests__/quickStyles.spec.ts` — new: colour parity
  - `client/src/components/editor/RightSidebar.tsx` — remove the Quick Styles section and the moved helpers; toast copy
  - `e2e/qa-canvas-editor.spec.ts` — re-point "Add element" steps
  - `e2e/us-design-002-editor-tokens.spec.ts` — re-point "Add element" steps
  - `e2e/us-edit-029-tool-rail.spec.ts` — new

---

## AI Implementation Prompt

> Paste this block into Claude Code to implement the story.

```
Context: Buildographic (code name InfographicAI) — React 18 + Vite, Wouter, Zustand, Tailwind v3 + shadcn/ui
(DropdownMenu / Popover), lucide-react. The live left rail is FloatingToolbar.tsx; LeftSidebar.tsx and
sidebar/ToolsTab.tsx are dead code — do not use or edit them.
Prerequisite: US-EDIT-024 merged into feat/edit/m-09-v3-shell (Undo/Redo already gone from FloatingToolbar).

Story: US-EDIT-029 — V3 tool rail, with Quick Styles in the Text tool

Acceptance Criteria:
AC1: nav aria-label="Canvas tools": Select (+ Hand) · Templates · Text · Elements · Uploads · rule · Layers; visible labels,
     aria-label = label; Duplicate/Delete while selected; H / Space shortcuts unchanged.
AC2: Text → QuickStylesMenu (aria-label="Text styles"): Add text + 8 Quick Styles producing the same elements/colours as today.
AC3: Elements → Square/Circle/Triangle/Star; Uploads → image file picker; Templates/Layers toggle panels. Nothing removed.
AC4: Move textStyles, getColorForStyle and its helpers (RightSidebar ~83-125, ~168, ~605-680) to client/src/lib/quickStyles.ts
     as pure functions taking (themeColors: string[] | null, styleName, canvasBg). Capture expected colours from the CURRENT
     code first, then move, then assert parity in quickStyles.spec.ts. Remove the Design tab's Quick Styles section and the
     addStyledText helper; update the toast copy at ~line 592 to point at the Text tool.
AC5: Token classes only (the preview chip may keep its canvas-like background, commented). Scoped 4.5:1 contrast probe over
     the rail and open flyouts, light + dark → 0 failures.
AC6: npm run check · npm run test:unit · re-point the "Add element" E2E steps without dropping assertions; listed specs pass.

Architecture notes:
- getColorForStyle today reads the palette from RightSidebar's local selectedTheme; the canvas store's selectedThemeColors
  mirrors it (set at RightSidebar ~705, cleared ~683) — use that, do not lift selectedTheme.
- Keep the rail's slide-with-panel offset (toolbarOffset) working; flyouts open to the right, z-index above the canvas.
- Do not touch the Brand Styles / Template Brand sections of the Design tab — US-EDIT-022 rewrites them.

Out of Scope: deleting LeftSidebar/ToolsTab · uploads library · other Design tab changes · new styles or shapes.

Primary files (do NOT touch others): client/src/components/editor/FloatingToolbar.tsx · QuickStylesMenu.tsx (new) ·
client/src/lib/quickStyles.ts (new) · client/src/lib/__tests__/quickStyles.spec.ts (new) ·
client/src/components/editor/RightSidebar.tsx · e2e/qa-canvas-editor.spec.ts · e2e/us-design-002-editor-tokens.spec.ts ·
e2e/us-edit-029-tool-rail.spec.ts (new)

Rules: touch only these files; run `npm run check` and `npm run test:unit`; report files changed, ACs checked, test output.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-EDIT-029-01 | E2E | P0 | Given the editor is open, then `nav[aria-label="Canvas tools"]` has buttons Select, Hand, Templates, Text, Elements, Uploads, Layers, each with visible text | 🔲 | |
| TC-EDIT-029-02 | Unit | P0 | `getColorForStyle` in `quickStyles.ts` returns the captured pre-move colour for 3 palettes × 2 backgrounds × 8 styles, and the default colours for `null` — `quickStyles.spec.ts` | 🔲 | |
| TC-EDIT-029-03 | E2E | P0 | Given palette "Royal Purple" chosen in the Design tab, when Text → "Headline Large" is clicked, then a text element named "Headline Large" with fontSize 48 and the palette's mapped colour is on the canvas | 🔲 | |
| TC-EDIT-029-04 | E2E | P0 | Scoped contrast probe at 4.5:1 over the rail and the open Text and Elements flyouts, light and dark → 0 failures | 🔲 | |
| TC-EDIT-029-05 | E2E | P0 | The re-pointed steps in `qa-canvas-editor` and `us-design-002-editor-tokens` pass with the same assertion count as before (compare `grep -c expect(` before/after) | 🔲 | |
| TC-EDIT-029-06 | E2E | P1 | When Elements → Star is clicked, then a star shape is added; when Uploads is clicked and a PNG chosen, then an image element is added | 🔲 | |
| TC-EDIT-029-07 | E2E | P1 | Given the Design tab is open, then no "Quick Styles" heading is present | 🔲 | |
| TC-EDIT-029-08 | Manual | P1 | With the Layers panel open, the rail slides right and its flyouts still open beside it, not under the panel | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Notes

- Takes over **US-EDIT-022 AC5** ("Quick Styles moves to the left rail's Text tool") so one card owns the move; US-EDIT-022 should drop that AC and its `LeftSidebar.tsx` file entry when it is hardened.
- Re-pointing selectors in existing E2E specs is required because the "Add element" button is replaced by design (AC1); the assertions stay — that is the line between updating a test and weakening it.
- `RightSidebar.tsx` overlap: US-PROP-002 edits the generation request (~line 542) — different hunk; US-EDIT-022 rewrites the Design tab next to the removed section — 022 must come after this story.

---

## Definition of Done

- [ ] All ACs checked ✅ · all test cases run and recorded
- [ ] `npm run check` · `npm run test:unit` pass
- [ ] Gate 2 — browser checks in light **and** dark (local, then staging)
- [ ] Merged into the M-EDIT-09 milestone branch (PR #_____)
- [ ] [TASKS.md](./TASKS.md) fully checked ✅ · STORY.md status `✅ Done`

---

## Implementation Update (log)

> Appended by code-agent during/after implementation. Newest entries on top.

### 2026-10-30 — created by /new-story (split from US-EDIT-024)
- The draft named `LeftSidebar.tsx` and `sidebar/ToolsTab.tsx` as the rail. Both are unused; the rail is `FloatingToolbar.tsx`.
- Quick Styles is in `RightSidebar.tsx` and depends on that component's local `selectedTheme`; the canvas store's `selectedThemeColors` carries the same colours, so the move needs no state lift.
- The draft said existing E2E tests stay unchanged; six steps click the "Add element" button this story replaces, so they are re-pointed (AC6).

---

*Story created: 2026-10-30*
