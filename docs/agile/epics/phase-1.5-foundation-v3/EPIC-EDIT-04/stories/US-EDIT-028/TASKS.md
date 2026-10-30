---
title: Tasks — US-EDIT-028
type: tasks
tags: [orion, edit, phase-1.5]
updated: 2026-10-30
---

# Tasks — US-EDIT-028

> **Story:** [US-EDIT-028](./STORY.md) — Guide bar: the four steps, light and dark
> **Branch:** `feat/edit/m-09-v3-shell` (milestone branch)
> **PR:** #_____
> **PR scope:** new `EditorGuideBar` + pure `editorGuide.ts`; right-panel tab state moved into `PanelStateProvider`; guide bar mounted and wired in `EditorLayout`; one new E2E. No canvas, no backend.

---

## Four-Pillars Pre-flight

- [ ] **Brain** — Decisions D3 (current-step rule) and D4 (step targets) answered.
- [ ] **Muscle** — US-EDIT-024 is in the milestone branch: `EditorLayout` owns `isAIChatExpanded`; the top bar has `data-testid="editor-topbar"`.
- [ ] **Map** — `RightSidebar.tsx` ~line 57 `type TabType`, ~line 277 `useState<TabType>("design")`; `panelState.tsx` exports `PanelStateProvider` / `usePanelState`, already wrapping the editor.
- [ ] **Env** — `npm run dev` clean; two test users available for TC-EDIT-028-04; E2E with `PLAYWRIGHT_BASE_URL=http://localhost:5000`.

---

## Tasks

### T1 — Pure logic (`editorGuide.ts`)
- [ ] `currentGuideStep({ elementCount, property }): 1 | 2 | 3` per AC3.
- [ ] `guideCollapsedKey(userId)` → `editor.guideBar.collapsed:${userId}`.
- [ ] `client/src/lib/__tests__/editorGuide.spec.ts` — TC-EDIT-028-01, -07.

**ACs:** AC3, AC4 · **Effort:** XS

### T2 — Right-panel tab in panel state (`panelState.tsx` + `RightSidebar.tsx`)
- [ ] `export type RightPanelTab = 'design' | 'property-details' | 'agent-info'`; `rightTab` (default `'design'`) + `setRightTab` in the context.
- [ ] `RightSidebar`: replace the local `useState<TabType>` with `const { rightTab: activeTab, setRightTab: setActiveTab } = usePanelState()`; `TabType` aliases `RightPanelTab`. Nothing else in the file changes.

**ACs:** AC2 · **Effort:** XS

### T3 — Guide bar (`EditorGuideBar.tsx` + `EditorLayout.tsx`)
- [ ] Props: `onChooseLook`, `onAddDetails`, `onRefine`, `onReviewExport`; reads element count and property from the stores.
- [ ] Collapse state from `localStorage` (try/catch) keyed by `useAuth().user?.id`; no user → expanded, nothing stored.
- [ ] `EditorLayout`: mount under the top bar when `!isPreviewMode`; wire the four actions (AC2); call `scheduleFitCanvasZoomToViewport()` on collapse/expand.

**ACs:** AC1, AC2, AC3, AC4, AC5 · **Effort:** S

### T4 — Verify
- [ ] `e2e/us-edit-028-guide-bar.spec.ts` — TC-EDIT-028-02 to -06.
- [ ] `npm run check`, `npm run test:unit`; AC6 specs on localhost.
- [ ] TC-EDIT-028-08 by hand; record all results in STORY.md.

---

## File → Task Map

| File | Task | Change type |
|---|:--:|---|
| `client/src/lib/editorGuide.ts` | T1 | new |
| `client/src/lib/__tests__/editorGuide.spec.ts` | T1 | new |
| `client/src/lib/panelState.tsx` | T2 | `rightTab` / `setRightTab` |
| `client/src/components/editor/RightSidebar.tsx` | T2 | `activeTab` from panel state (one hook swap) |
| `client/src/components/editor/EditorGuideBar.tsx` | T3 | new |
| `client/src/components/editor/EditorLayout.tsx` | T3 | mount + wire steps |
| `e2e/us-edit-028-guide-bar.spec.ts` | T4 | new |

---

## Test Commands

```bash
npm run check
npm run test:unit
cd client && npx vitest run src/lib/__tests__/editorGuide.spec.ts --reporter=verbose
PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-edit-028-guide-bar.spec.ts e2e/qa-canvas-editor.spec.ts e2e/design-consistency.spec.ts e2e/us-ai-036-canvas-orientation.spec.ts
```

---

## Anti-patterns for this story

- **Touching more of `RightSidebar.tsx` than the tab hook.** Five other cards edit it; keep the diff to one hunk.
- **Storing the collapse flag without the user id.** A shared browser would carry one agent's choice to the next (the PT-07 class of bug).
- **Computing the current step inside the component.** Keep it in `editorGuide.ts` so the rule (D3) is unit-tested and easy to change.
- **Waiting for the Look picker / AI Assistant / export review.** Point at today's equivalents (D4); the owning stories retarget them.

---

*Tasks created: 2026-10-30*
