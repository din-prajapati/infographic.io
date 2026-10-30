---
title: Tasks — US-EDIT-024
type: tasks
tags: [orion, edit, phase-1.5]
updated: 2026-10-30
---

# Tasks — US-EDIT-024

> **Story:** [US-EDIT-024](./STORY.md) — V3 top bar and canvas header, light and dark
> **Branch:** `feat/edit/m-09-v3-shell` (milestone branch)
> **PR:** #_____
> **PR scope:** V3 top bar in `EditorToolbar`; AI-chat open state lifted into `EditorLayout`; Undo/Redo moved off the rail; new `CanvasHeader` (format + Preview + mode bar) with pure helpers in `canvasFormat.ts`; scoped shell tokens if D1 is confirmed; one new E2E. No `RightSidebar.tsx`, no canvas renderer, no backend.

---

## Four-Pillars Pre-flight

- [ ] **Brain** — Decision D1 answered (scoped shell tokens vs global token change). Without it, AC7 cannot pass for secondary text or filled buttons.
- [ ] **Muscle** — In `EditorLayout.tsx` confirm the render order (`EditorToolbar` → `CenterCanvas` + `RightSidebar` + `FloatingToolbar` + panels) and that keyboard shortcuts live there; in `CenterCanvas.tsx` find `isAIChatExpanded` (~line 27), `handleAIButtonClick`, `handleAIChatClose` and the `setIsAIChatExpanded(false)` calls inside `handleTemplateLoad`.
- [ ] **Map** — `FloatingToolbar` receives `onUndo/onRedo/canUndo/canRedo` from `EditorLayout`; nothing else imports them. `LeftSidebar.tsx` / `ToolsTab.tsx` are unused — do not touch them.
- [ ] **Env** — `npm run dev` clean; `.env` has `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`; E2E runs with `PLAYWRIGHT_BASE_URL=http://localhost:5000` (the default is staging).

---

## Tasks

### T1 — Pure helpers (`canvasFormat.ts`)
- [ ] `formatLabel(width, height)` — the AC4 strings; uses `×` with spaces.
- [ ] `canvasMode(elements)` → `'generated' | 'linked' | 'free'` (AI import wins over slotted text).
- [ ] `client/src/lib/__tests__/canvasFormat.spec.ts` — TC-EDIT-024-05, -06.

**ACs:** AC4, AC5 · **Effort:** XS

### T2 — Lift AI-chat state (`CenterCanvas.tsx` + `EditorLayout.tsx`)
- [ ] `CenterCanvas` takes `isAIChatExpanded` + `onAIChatExpandedChange`; every `setIsAIChatExpanded(x)` becomes `onAIChatExpandedChange(x)`. Bubble markup and aria-labels unchanged.
- [ ] `EditorLayout` owns `const [isAIChatExpanded, setIsAIChatExpanded] = useState(false)`.

**ACs:** AC2 · **Effort:** S

### T3 — Top bar (`EditorToolbar.tsx` + `EditorLayout.tsx`)
- [ ] New props: `onUndo`, `onRedo`, `canUndo`, `canRedo`, `onAIAssistantClick`, `isAIAssistantOpen`, `saveStatus?: ReactNode`; drop `onPreviewClick`.
- [ ] Layout per AC1; Projects uses `useLocation()` from `wouter`. Keep the Ctrl/Cmd+S handler.
- [ ] Remove the `bg-yellow-500` logo square and the Maximize icon.
- [ ] `FloatingToolbar.tsx`: delete the Undo/Redo buttons, their divider and the four props; `EditorLayout` stops passing them.

**ACs:** AC1, AC3 · **Effort:** S

### T4 — Canvas header + mode bar (`CanvasHeader.tsx` + `EditorLayout.tsx`)
- [ ] Reads `canvasWidth`, `canvasHeight`, `elements` from `useCanvasStore`; calls the T1 helpers.
- [ ] Mounted in `EditorLayout` above the canvas row, only when `!isPreviewMode`; Preview button → `handlePreview`.
- [ ] Check the canvas fit still works (`scheduleFitCanvasZoomToViewport` measures the viewport — the header takes height from it).

**ACs:** AC4, AC5 · **Effort:** S

### T5 — Theme tokens (`globals.css` + `tailwind.config.ts`) — only if D1 = scoped tokens
- [ ] `--shell-muted-foreground` (`:root` 45 5% 40%, `.dark` 45 8% 55%) and `--shell-primary` (207 90% 40% in both) + `-foreground` (0 0% 100%).
- [ ] Map as `shell-muted-foreground` / `shell-primary` colours in `tailwind.config.ts`.
- [ ] Use them only in this story's components.

**ACs:** AC6, AC7 · **Effort:** XS

### T6 — Verify
- [ ] `e2e/us-edit-024-v3-shell.spec.ts` — TC-EDIT-024-01 to -04, -07 to -09 (contrast probe copied from `design-contrast.spec.ts`, scoped, `minRatio = 4.5`, disabled buttons skipped).
- [ ] `npm run check`, `npm run test:unit`.
- [ ] Existing specs from AC9 on localhost, unchanged.
- [ ] TC-EDIT-024-10 grep; browser pass in light and dark; record results in STORY.md.

---

## File → Task Map

| File | Task | Change type |
|---|:--:|---|
| `client/src/lib/canvasFormat.ts` | T1 | new — `formatLabel`, `canvasMode` |
| `client/src/lib/__tests__/canvasFormat.spec.ts` | T1 | new |
| `client/src/components/editor/CenterCanvas.tsx` | T2 | AI-chat state becomes controlled props |
| `client/src/components/editor/EditorLayout.tsx` | T2, T3, T4 | own AI-chat state; wire top bar; mount `CanvasHeader` |
| `client/src/components/editor/EditorToolbar.tsx` | T3 | V3 top bar |
| `client/src/components/editor/FloatingToolbar.tsx` | T3 | remove Undo/Redo only |
| `client/src/components/editor/CanvasHeader.tsx` | T4 | new |
| `client/src/styles/globals.css` | T5 | scoped shell tokens, both themes |
| `tailwind.config.ts` | T5 | token mapping |
| `e2e/us-edit-024-v3-shell.spec.ts` | T6 | new |

---

## Test Commands

```bash
npm run check
npm run test:unit
cd client && npx vitest run src/lib/__tests__/canvasFormat.spec.ts --reporter=verbose
PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-edit-024-v3-shell.spec.ts
PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/editor-ai-chatbox.spec.ts e2e/us-ai-036-canvas-orientation.spec.ts e2e/us-ai-037-save-as-template.spec.ts e2e/us-ai-032-editable-canvas.spec.ts e2e/us-ai-032-export-parity.spec.ts e2e/qa-canvas-editor.spec.ts
```

---

## Anti-patterns for this story

- **Editing `client/src/index.css`.** It is compiled Tailwind output; tokens go in `styles/globals.css`.
- **Darkening the global `--muted-foreground` / `--primary` to pass AC7.** That restyles every page; use scoped tokens (D1).
- **A second AI-chat state.** The top-bar button and the bubble must drive one state, or they drift apart.
- **Changing the bubble's aria-labels or `#ai-chat-panel`.** Three E2E suites depend on them.
- **Moving the "Edit elements" pill into the mode bar.** `CanvasEditToolbar.tsx` belongs to US-EDIT-026.

---

*Tasks created: 2026-10-30*
