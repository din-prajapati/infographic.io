# PR Task List — US-DESIGN-002

> **Story:** [STORY.md](./STORY.md)  
> **Branch:** `feat/design-us-design-002-editor-tokens`  
> **PR:** #_____ (fill when opened)  
> **Linear:** LIN-XXX  
> **Type:** feat (design token replacement — no logic changes)

---

## Three Pillars Pre-flight

- [x] **Brain** — [STORY.md](./STORY.md): 8 ACs, out-of-scope listed, AI prompt ready
- [x] **Muscle** — This file: 10 tasks, file-to-task table, exact commands
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd): token flow diagram shows which components bypass CSS variables
- [x] **Env** — [ENV.yaml](../../ENV.yaml): `EPIC_SCOPE.editor` lists the 8 editor files; `NEVER_TOUCH_IN_THIS_EPIC` blocks CenterCanvas

> All four pillars are ready. Paste the "AI Implementation Prompt" from STORY.md into Claude Code to start.

---

## PR Scope Summary

**Squash commit message:**
```
feat(editor): replace hardcoded gray tokens with design system vars — US-DESIGN-002
```

---

## Task Breakdown

### T1 — EditorToolbar.tsx — toolbar background + text
**File:** `client/src/components/editor/EditorToolbar.tsx`  
**AC(s):** AC1, AC2, AC3  
**Key replacements:**
- `bg-gray-900` → `bg-background` (main toolbar container, line ~49)
- `bg-gray-800` → `bg-muted` (button hover bg)
- `text-gray-300` / `text-gray-400` → `text-foreground` / `text-muted-foreground`
- `border-gray-700` → `border-border`

```bash
git add client/src/components/editor/EditorToolbar.tsx
git commit -m "feat(editor): EditorToolbar bg-gray-900→bg-background, token cleanup — US-DESIGN-002"
```

---

### T2 — FloatingToolbar.tsx — floating button tokens
**File:** `client/src/components/editor/FloatingToolbar.tsx`  
**AC(s):** AC4  
**Key replacements (11 hardcoded refs):**
- `bg-gray-800` / `bg-gray-900` → `bg-background` / `bg-muted`
- `text-gray-300` → `text-foreground`
- `hover:bg-gray-700` → `hover:bg-accent`
- `border-gray-700` → `border-border`

```bash
git add client/src/components/editor/FloatingToolbar.tsx
git commit -m "feat(editor): FloatingToolbar design token replacement — US-DESIGN-002"
```

---

### T3 — ZoomControls.tsx — zoom button tokens
**File:** `client/src/components/editor/ZoomControls.tsx`  
**AC(s):** AC4  
**Key replacements (7 hardcoded refs):**
- `bg-gray-800` → `bg-muted`
- `text-gray-400` → `text-muted-foreground`
- `hover:bg-gray-700` → `hover:bg-accent`
- `border-gray-600` → `border-border`

```bash
git add client/src/components/editor/ZoomControls.tsx
git commit -m "feat(editor): ZoomControls design token replacement — US-DESIGN-002"
```

---

### T4 — LayersPanel.tsx — sidebar tokens
**File:** `client/src/components/editor/LayersPanel.tsx`  
**AC(s):** AC5  
**Key replacements (13 hardcoded refs):**
- `bg-gray-900` / `bg-gray-800` → `bg-sidebar`
- `text-gray-100` / `text-gray-300` → `text-sidebar-foreground`
- `text-gray-500` → `text-muted-foreground`
- `hover:bg-gray-700` → `hover:bg-sidebar-accent`
- `border-gray-700` → `border-border`

```bash
git add client/src/components/editor/LayersPanel.tsx
git commit -m "feat(editor): LayersPanel sidebar token replacement — US-DESIGN-002"
```

---

### T5 — AdjustmentsPanel.tsx — sidebar tokens
**File:** `client/src/components/editor/AdjustmentsPanel.tsx`  
**AC(s):** AC5  
**Key replacements (23 hardcoded refs — largest file):**
- Same pattern as T4 (bg-sidebar, text-sidebar-foreground, border-border)
- Watch for section header `text-gray-400` → `text-muted-foreground`
- Input backgrounds `bg-gray-800` → `bg-input`

```bash
git add client/src/components/editor/AdjustmentsPanel.tsx
git commit -m "feat(editor): AdjustmentsPanel sidebar token replacement — US-DESIGN-002"
```

---

### T6 — PropertyPanel.tsx — sidebar tokens
**File:** `client/src/components/editor/PropertyPanel.tsx`  
**AC(s):** AC5  
**Key replacements (10 hardcoded refs):**
- `bg-gray-900` → `bg-sidebar`
- `text-gray-200` → `text-sidebar-foreground`
- `text-gray-400` → `text-muted-foreground`
- `border-gray-700` → `border-border`

```bash
git add client/src/components/editor/PropertyPanel.tsx
git commit -m "feat(editor): PropertyPanel sidebar token replacement — US-DESIGN-002"
```

---

### T7 — TextControls.tsx + ShapeToolbar.tsx — toolbar tokens
**Files:** `client/src/components/editor/toolbar/TextControls.tsx`, `ShapeToolbar.tsx`  
**AC(s):** AC4  
**Key replacements (9 + 8 refs):**
- `bg-gray-800` → `bg-muted`
- `text-gray-300` → `text-foreground`
- `hover:bg-gray-700` → `hover:bg-accent`
- `border-gray-700` → `border-border`

```bash
git add client/src/components/editor/toolbar/TextControls.tsx \
        client/src/components/editor/toolbar/ShapeToolbar.tsx
git commit -m "feat(editor): TextControls + ShapeToolbar token replacement — US-DESIGN-002"
```

---

### T8 — AIChatBox.tsx — remove white box in AI chat
**File:** `client/src/components/ai-chat/AIChatBox.tsx`  
**AC(s):** AC6  
**Specific lines found in Phase A QA:**
- Line 991: `bg-white border-gray-200` → `bg-background border-border`
- Line 1067: `bg-white border-gray-200` → `bg-background border-border`

```bash
git add client/src/components/ai-chat/AIChatBox.tsx
git commit -m "feat(ai-chat): AIChatBox bg-white→bg-background (dark mode fix) — US-DESIGN-002"
```

---

### T9 — AIChatInputField.tsx — input wrapper tokens
**File:** `client/src/components/ai-chat/AIChatInputField.tsx`  
**AC(s):** AC6  
**Specific line found in Phase A QA:**
- Line 224: `bg-white border-gray-200 text-gray-900` → `bg-background border-border text-foreground`

```bash
git add client/src/components/ai-chat/AIChatInputField.tsx
git commit -m "feat(ai-chat): AIChatInputField input wrapper token fix — US-DESIGN-002"
```

---

### T10 — GenerationProgressBar.tsx + GenerationProgress.tsx — progress tokens
**Files:** `client/src/components/ai-chat/GenerationProgressBar.tsx`, `GenerationProgress.tsx`  
**AC(s):** AC6  
**Specific lines found in Phase A QA:**  
GenerationProgressBar: Lines 55, 59, 73, 75 — `bg-white border-gray-200 bg-gray-100 text-gray-700 text-gray-500`  
GenerationProgress: Lines 28, 44, 57, 65, 93, 94 — `bg-gray-200 text-gray-400 text-gray-500 text-gray-600`

Replace with: `bg-background border-border bg-muted text-foreground text-muted-foreground`

```bash
git add client/src/components/ai-chat/GenerationProgressBar.tsx \
        client/src/components/ai-chat/GenerationProgress.tsx
git commit -m "feat(ai-chat): GenerationProgress + ProgressBar token fix — US-DESIGN-002"
```

---

### T11 — TypeScript check
```bash
npm run check
# Must pass with zero errors before PR
```

---

## File-to-Task Mapping

| File | Task | AC(s) | Hardcoded refs |
|------|------|-------|----------------|
| `editor/EditorToolbar.tsx` | T1 | AC1, AC2, AC3 | 8 |
| `editor/FloatingToolbar.tsx` | T2 | AC4 | 11 |
| `editor/ZoomControls.tsx` | T3 | AC4 | 7 |
| `editor/LayersPanel.tsx` | T4 | AC5 | 13 |
| `editor/AdjustmentsPanel.tsx` | T5 | AC5 | 23 |
| `editor/PropertyPanel.tsx` | T6 | AC5 | 10 |
| `editor/toolbar/TextControls.tsx` | T7 | AC4 | 9 |
| `editor/toolbar/ShapeToolbar.tsx` | T7 | AC4 | 8 |
| `ai-chat/AIChatBox.tsx` | T8 | AC6 | 2 (lines 991, 1067) |
| `ai-chat/AIChatInputField.tsx` | T9 | AC6 | 1 (line 224) |
| `ai-chat/GenerationProgressBar.tsx` | T10 | AC6 | 4 (lines 55,59,73,75) |
| `ai-chat/GenerationProgress.tsx` | T10 | AC6 | 6 (lines 28,44,57,65,93,94) |

**Total:** 12 files · ~102 hardcoded references replaced

---

## Exact Test Commands

```bash
# Step 1: TypeScript check — must pass before PR (T11)
npm run check

# Step 2: Unit tests — must still pass (no regression)
npm run test:unit

# Step 3: Dev server — visual check
npm run dev
# Open localhost:5000/editor
# Switch to Light → verify toolbar is light, not dark bar
# Switch to Dark → verify editor matches rest of app
# Add a text element, drag, resize → confirm no regression

# Step 4: AI chat verification
# Open editor → open AI chat panel
# In Light mode: input area should NOT be white box (verify has border separator)
# In Dark mode: input area should NOT be jarring white box in dark panel

# Step 5: E2E (optional but recommended)
npm run test:e2e -- --grep "design-consistency"
```

---

## Task Checklist

- [ ] T1 — EditorToolbar.tsx (8 refs → `bg-background`/tokens)
- [ ] T2 — FloatingToolbar.tsx (11 refs)
- [ ] T3 — ZoomControls.tsx (7 refs)
- [ ] T4 — LayersPanel.tsx (13 refs → sidebar tokens)
- [ ] T5 — AdjustmentsPanel.tsx (23 refs — largest)
- [ ] T6 — PropertyPanel.tsx (10 refs)
- [ ] T7 — TextControls.tsx + ShapeToolbar.tsx (17 refs)
- [ ] T8 — AIChatBox.tsx lines 991+1067 (`bg-white` → `bg-background`)
- [ ] T9 — AIChatInputField.tsx line 224
- [ ] T10 — GenerationProgressBar.tsx + GenerationProgress.tsx (10 refs)
- [ ] T11 — `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Manual: editor Light mode toolbar is light ✅
- [ ] Manual: editor Dark mode matches app theme ✅
- [ ] Manual: AI chat input not white-on-dark ✅
- [ ] Manual: add text/shape/drag — no regression ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs updated ✅

---

## Test Is Truth

> **Rule (non-negotiable):** Do not weaken or skip a failing check to make it pass. Fix the code.  
> - `npm run check` fails → fix the TypeScript error in the changed file  
> - `npm run test:unit` fails → a token replacement broke an import or class — revert that change and retry  
> - Manual TC fails → record the finding in STORY.md with what was observed; do NOT close the AC

---

## Anti-Patterns to Avoid in This Story

- Do NOT change `CenterCanvas.tsx` — the art board drawing area is intentionally neutral
- Do NOT modify `text-yellow-500` — it's the brand accent color
- Do NOT touch hex colors inside `BrandPalette` data arrays (those are content data)
- Do NOT change event handlers, prop types, or component logic — class names only
- Do NOT refactor component structure while doing token replacement (separate concern)
- Do NOT run `git add -A` — stage each file individually per task

---

## PR Open Command

```bash
gh pr create \
  --title "[US-DESIGN-002] Editor design token replacement" \
  --label "epic:design,type:feat,priority:P1" \
  --body "$(cat docs/agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-002/STORY.md)"
```

---

*Tasks created: 2026-04-15 · Based on Phase A QA findings from 2026-04-13*
