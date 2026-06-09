# PR Task List — US-DESIGN-010

> **Story:** [STORY.md](./STORY.md)  
> **Branch:** `feat/design-us-design-010-editor-visual`  
> **PR:** #_____  
> **Linear:** LIN-XXX  
> **Type:** feat

---

## Three Pillars Pre-flight

- [ ] **Brain** — STORY.md ACs written, out-of-scope listed, AI prompt ready ✅
- [ ] **Muscle** — This TASKS.md has file list + ordered tasks + exact test commands ✅
- [ ] **Map** — `design-preview-canvas.html` (visual target) + `design-tokens.css` §Editor tokens
- [ ] **Env** — Read `client/src/components/editor/` first to identify exact component files

---

## PR Scope Summary

**One-liner:**
```
feat(design): editor visual polish — dark pill toolbar, white layer sidebar, canvas bg — US-DESIGN-010
```

---

## Pre-implementation Step

Before starting tasks, read `client/src/components/editor/` to identify:
- Which file is the floating toolbar
- Which file is the layer sidebar
- Which file is the canvas container/wrapper

Then fill in the file names in tasks T1–T3 below.

---

## Task Breakdown

### T1 — Apply dark pill style to floating toolbar
**File:** `client/src/components/editor/[TOOLBAR_FILE]` ← identify on read  
**AC(s) covered:** AC1, AC2  
**Changes:** Apply `--toolbar-floating-bg`, `--toolbar-floating-radius`, `--toolbar-floating-shadow` to toolbar container; icon buttons white/70.

```bash
git add client/src/components/editor/[TOOLBAR_FILE]
git commit -m "feat(design): T1 apply dark pill style to floating toolbar — US-DESIGN-010"
```

---

### T2 — Apply white panel style to layer sidebar
**File:** `client/src/components/editor/[SIDEBAR_FILE]` ← identify on read  
**AC(s) covered:** AC3, AC4  
**Changes:** Apply `--sidebar-panel-bg`, `--sidebar-panel-border` to sidebar container; `--sidebar-panel-item-bg-active` to active item.

```bash
git add client/src/components/editor/[SIDEBAR_FILE]
git commit -m "feat(design): T2 apply white panel style to layer sidebar — US-DESIGN-010"
```

---

### T3 — Verify/update canvas container and selection colors
**File:** `client/src/components/editor/[CANVAS_WRAPPER_FILE]`  
**AC(s) covered:** AC5, AC6  
**Changes:** Canvas outer bg → `--canvas-bg`; selection stroke → `--canvas-selection-stroke` (if hardcoded in canvasUtils.ts, update there).

```bash
git add client/src/components/editor/[CANVAS_WRAPPER_FILE]
git commit -m "feat(design): T3 update canvas bg and selection stroke to token values — US-DESIGN-010"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| Floating toolbar component | T1 | AC1, AC2 | Identify path before starting |
| Layer sidebar component | T2 | AC3, AC4 | Identify path before starting |
| Canvas container / canvasUtils | T3 | AC5, AC6 | May be split across 2 files |

---

## Exact Test Commands

```bash
# 1. TypeScript check — must pass before PR
npm run check

# 2. Unit tests — must pass before PR
npm run test:unit

# 3. Manual verification
# Open localhost:5000 → /editor
# Compare to design-preview-canvas.html in browser side-by-side
# → Floating toolbar: dark charcoal pill, centered, white icons
# → Layer sidebar: white background, subtle right border
# → Active layer: light blue tint background
# → Canvas area: light grey (#f5f5f5) background
# → Select an element: blue (#3b82f6) selection handles
# → Test edit: drag, resize, add shape — all still work
# → Toggle Dark mode: toolbar/sidebar tokens coherent
```

---

## Task Checklist

- [ ] Editor component files identified (toolbar, sidebar, canvas wrapper)
- [ ] T1 — Floating toolbar dark pill style applied
- [ ] T2 — Layer sidebar white panel style applied
- [ ] T3 — Canvas bg and selection stroke updated
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Manual smoke: Editor in Light + Dark ✅
- [ ] Canvas editing functional (drag, resize, select) ✅
- [ ] Visual match to `design-preview-canvas.html` confirmed ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs updated ✅

---

## Anti-Patterns to Avoid

- Do NOT touch `canvasUtils.ts` rendering math — only color/style constants
- Do NOT change layout split-pane ratios or panel widths
- Do NOT modify toolbar button click handlers or tool selection logic
- Do NOT change layer sidebar drag-to-reorder or visibility toggle logic

---

## PR Open Command

```bash
gh pr create \
  --title "[US-DESIGN-010] Editor visual refinement — dark toolbar, white sidebar, canvas tokens" \
  --label "epic:design,type:feat,priority:P2" \
  --body "$(cat docs/agile/epics/EPIC-DESIGN-02/stories/US-DESIGN-010/STORY.md)"
```

---

*Tasks created: 2026-04-17*
