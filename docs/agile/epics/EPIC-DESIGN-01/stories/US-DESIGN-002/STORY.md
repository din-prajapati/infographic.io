# Story Card — US-DESIGN-002

> **Status:** 🔲 Not Started  
> **Feature:** F-DESIGN-02 — Editor Design Token Adoption  
> **Epic:** [EPIC-DESIGN-01](../../EPIC.md)  
> **Milestone:** [M-DESIGN-02 — Editor Token Fix](../../milestones/M-DESIGN-02-editor-tokens.md)  
> **Linear:** LIN-XXX  
> **Created:** 2026-04-13 | **Closed:** —

---

## Story

*As a* user who prefers Light mode  
*I want* the editor toolbar, sidebars, and panels to match my chosen theme  
*So that* the editor doesn't look like a completely different product from the rest of the app

---

## Acceptance Criteria

- [ ] **AC1:** `EditorToolbar.tsx` uses `bg-background border-b border-border` instead of `bg-gray-900` — no hardcoded backgrounds remain
- [ ] **AC2:** In Light mode, the editor toolbar background matches `--background` (#FCFCFC), not a dark bar
- [ ] **AC3:** In Dark mode, the editor renders with the same dark theme as the rest of the app (no double-dark mismatch)
- [ ] **AC4:** `ZoomControls.tsx`, `FloatingToolbar.tsx` buttons use `text-foreground`, `hover:bg-muted` instead of hardcoded gray classes
- [ ] **AC5:** `LayersPanel.tsx`, `AdjustmentsPanel.tsx`, `PropertyPanel.tsx` use `bg-sidebar`, `text-sidebar-foreground` token classes
- [ ] **AC6:** `AIChatBox.tsx`, `AIChatInputField.tsx`, `GenerationProgressBar.tsx`, `GenerationProgress.tsx` use `bg-background border-border` instead of `bg-white border-gray-200`
- [ ] **AC7:** No regressions — canvas editing (add text, shape, image, drag-resize) still functions after token replacement
- [ ] **AC8:** `npm run check` passes — no TypeScript errors from class changes

---

## Out of Scope

- Canvas preview area (the art board itself — intentionally neutral/white)
- `text-yellow-500` logo accent (intentional brand color — keep as-is)
- Any hex colors inside `BrandPalette` data arrays (content, not UI)
- Logic, event handlers, or prop types — only class names change
- `ContextualToolbar` floating behavior changes
- AI chat panel layout/sizing changes

---

## Engineering / PR

- **Branch:** `feat/design-us-design-002-editor-tokens`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/components/editor/EditorToolbar.tsx`
  - `client/src/components/editor/ZoomControls.tsx`
  - `client/src/components/editor/FloatingToolbar.tsx`
  - `client/src/components/editor/LayersPanel.tsx`
  - `client/src/components/editor/sidebar/LayerItemWithThumbnail.tsx` (if exists)
  - `client/src/components/editor/AdjustmentsPanel.tsx`
  - `client/src/components/editor/PropertyPanel.tsx`
  - `client/src/components/editor/toolbar/TextControls.tsx`
  - `client/src/components/editor/toolbar/ShapeToolbar.tsx`
  - `client/src/components/ai-chat/AIChatBox.tsx`
  - `client/src/components/ai-chat/AIChatInputField.tsx`
  - `client/src/components/ai-chat/GenerationProgressBar.tsx`
  - `client/src/components/ai-chat/GenerationProgress.tsx`

---

## Token Replacement Guide

```
bg-gray-900        → bg-background        (toolbar/page background)
bg-gray-800        → bg-muted             (secondary bg, hover state)
bg-gray-700        → bg-accent            (active/selected state)
bg-gray-100        → bg-muted             (light secondary bg)
text-gray-100/200/300 → text-foreground
text-gray-400/500     → text-muted-foreground
text-gray-600         → text-muted-foreground
text-gray-900         → text-foreground   (AI chat inputs)
border-gray-700/800   → border-border
border-gray-200       → border-border     (AI chat wrappers)
hover:bg-gray-800     → hover:bg-muted
hover:bg-gray-700     → hover:bg-accent
bg-white              → bg-background     (AI chat input/progress wrappers)
bg-sidebar            (for left/right sidebars like LayersPanel, PropertyPanel)
text-sidebar-foreground (for sidebar text)
```

Token reference: `docs/design/DESIGN_GUIDELINES.md` (CSS Variables Template section)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI — React + Tailwind frontend. 
Design tokens are in client/src/index.css (:root and .dark blocks).
Token guide: docs/design/DESIGN_GUIDELINES.md

Story: US-DESIGN-002 — Replace hardcoded gray Tailwind classes in editor 
and AI chat components with CSS design token classes.

Scope — touch ONLY these files:
Editor:
  client/src/components/editor/EditorToolbar.tsx
  client/src/components/editor/ZoomControls.tsx
  client/src/components/editor/FloatingToolbar.tsx
  client/src/components/editor/LayersPanel.tsx
  client/src/components/editor/AdjustmentsPanel.tsx
  client/src/components/editor/PropertyPanel.tsx
  client/src/components/editor/toolbar/TextControls.tsx
  client/src/components/editor/toolbar/ShapeToolbar.tsx
AI Chat:
  client/src/components/ai-chat/AIChatBox.tsx        (lines 991, 1067)
  client/src/components/ai-chat/AIChatInputField.tsx  (line 224)
  client/src/components/ai-chat/GenerationProgressBar.tsx (lines 55,59,73,75)
  client/src/components/ai-chat/GenerationProgress.tsx    (lines 28,44,57,65,93,94)

Token replacement rules:
  bg-gray-900  → bg-background       (toolbar/page background)
  bg-gray-800  → bg-muted            (hover, secondary bg)
  bg-gray-700  → bg-accent           (active/selected bg)
  bg-gray-100  → bg-muted
  text-gray-100, text-gray-200, text-gray-300 → text-foreground
  text-gray-400, text-gray-500, text-gray-600 → text-muted-foreground
  text-gray-900 → text-foreground
  border-gray-700, border-gray-800 → border-border
  border-gray-200 → border-border
  hover:bg-gray-800 → hover:bg-muted
  hover:bg-gray-700 → hover:bg-accent
  bg-white → bg-background
  Use bg-sidebar / text-sidebar-foreground for LayersPanel, AdjustmentsPanel, PropertyPanel

Do NOT change:
  - Any canvas element colors (CenterCanvas drawing area)
  - text-yellow-500 (brand accent)
  - Hex colors inside BrandPalette data arrays
  - Logic, event handlers, or prop types

After changes: run `npm run check` and confirm zero TypeScript errors.
Output: list of files changed + which classes were replaced per file.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DS-002-01 | Manual | P0 | Open editor in Light mode → toolbar is light (matches AppHeader) | 🔲 | |
| TC-DS-002-02 | Manual | P0 | Open editor in Dark mode → toolbar matches dark theme | 🔲 | |
| TC-DS-002-03 | Manual | P0 | Left sidebar (Layers) in both modes — text visible, hover states work | 🔲 | |
| TC-DS-002-04 | Manual | P0 | Right sidebar (Properties) in both modes — all controls visible | 🔲 | |
| TC-DS-002-05 | Manual | P1 | Zoom controls visible and functional in Light mode | 🔲 | |
| TC-DS-002-06 | Manual | P1 | FloatingToolbar readable icons in both modes | 🔲 | |
| TC-DS-002-07 | Manual | P1 | Add text → drag → resize → text visible on canvas (no regression) | 🔲 | |
| TC-DS-002-08 | Manual | P1 | Add shape → change fill color → visible in Light mode canvas | 🔲 | |
| TC-DS-002-09 | Manual | P1 | AI chat input area no longer white box in Dark mode | 🔲 | |
| TC-DS-002-10 | Manual | P1 | AI chat input area visible (separator border) in Light mode | 🔲 | |
| TC-DS-002-11 | Auto | P1 | `npm run check` — zero TypeScript errors | 🔲 | |

---

## Definition of Done

- [ ] All ACs 1–8 checked ✅
- [ ] All TCs run and recorded
- [ ] `npm run check` passes (TC-DS-002-11 ✅)
- [ ] `npm run test:unit` passes (no regression)
- [ ] Manual canvas smoke: add text, shape, image — no visual regression
- [ ] PR merged (PR #{number})
- [ ] STORY.md status updated to ✅ Done
- [ ] [TASKS.md](./TASKS.md) task list fully checked
