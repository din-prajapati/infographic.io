# Story Card — US-DESIGN-002

> **Status:** ✅ Done  
> **Feature:** F-DESIGN-02 — Full Dark Mode Token Adoption  
> **Epic:** [EPIC-DESIGN-01](../../EPIC.md)  
> **Milestone:** [M-DESIGN-02 — Editor Token Fix](../../milestones/M-DESIGN-02-editor-tokens.md)  
> **Linear:** LIN-XXX  
> **Created:** 2026-04-13 | **Closed:** 2026-04-16

---

## Story

*As a* user who prefers Dark mode  
*I want* the editor, AI chat, and all panels to render with correct dark-mode colors  
*So that* no element appears white-on-dark, invisible text, or jarring hardcoded-gray in dark theme

---

## Acceptance Criteria

### Phase A — Editor Toolbar & Sidebars (original scope)

- [x] **AC1:** `EditorToolbar.tsx` uses `bg-background border-b border-border` instead of `bg-gray-900` — no hardcoded backgrounds remain
- [x] **AC2:** In Light mode, the editor toolbar background matches `--background` (#FCFCFC), not a dark bar
- [x] **AC3:** In Dark mode, the editor renders with the same dark theme as the rest of the app (no double-dark mismatch)
- [x] **AC4:** `ZoomControls.tsx`, `FloatingToolbar.tsx` buttons use `text-foreground`, `hover:bg-muted` instead of hardcoded gray classes
- [x] **AC5:** `LayersPanel.tsx`, `AdjustmentsPanel.tsx`, `PropertyPanel.tsx` use `bg-sidebar`, `text-sidebar-foreground` token classes
- [x] **AC6:** `AIChatBox.tsx`, `AIChatInputField.tsx`, `GenerationProgressBar.tsx`, `GenerationProgress.tsx` use `bg-background border-border` instead of `bg-white border-gray-200`
- [x] **AC7:** No regressions — canvas editing (add text, shape, image, drag-resize) still functions after token replacement
- [x] **AC8:** `npm run check` passes — no NEW TypeScript errors from class changes

### Phase B — Editor Secondary Panels (expanded)

- [x] **AC9:** `ContextualToolbar.tsx`, `SelectionInfoPanel.tsx`, `TransparencyPanel.tsx` use design tokens — no hardcoded gray/white
- [x] **AC10:** `RightSidebar.tsx` Brand Styles panel, theme cards, palette actions, Quick Style chips all use opacity-based tokens
- [x] **AC11:** `AgentInfoForm.tsx`, `BrandPaletteDialog.tsx`, `ColorPickerField.tsx` use `bg-muted`, `border-border`, `text-foreground` throughout
- [x] **AC12:** `LayerItemWithThumbnail.tsx` selected/hover/icon states use design tokens — no `from-violet-50`, `bg-gray-50`, `border-white`

### Phase C — AI Chat Popup Panels (expanded)

- [x] **AC13:** `QuickActionsPanel.tsx`, `AISuggestionsPanel.tsx`, `StylePresetsPanel.tsx`, `EnhancedSuggestionsPanel.tsx` use `bg-background border-border` — no `bg-white border-gray-200`
- [x] **AC14:** `ImageUploadPanel.tsx` drag area, browse button, upload area, tip box all use design tokens
- [x] **AC15:** All popup icon backgrounds use opacity-based colors (`bg-purple-500/15`, `bg-blue-500/15`) — not `bg-purple-100`, `bg-blue-50`

### Phase D — Chat Container, Chips, Templates, Messages (expanded)

- [x] **AC16:** `CategoryChipList.tsx` and `CategoryChip.tsx` — chip strip height reduced (`mb-6 → mb-1`), unselected chips use `bg-background border-border text-muted-foreground`, selected chips use `bg-blue-500/15 text-blue-500`
- [x] **AC17:** `PromptSuggestionCard.tsx`, `TemplateCategoryView.tsx`, `TemplateDropdown.tsx` use design tokens — no white backgrounds
- [x] **AC18:** `MessageBubble.tsx` — user bubbles (`bg-muted`), AI bubbles (`bg-background border-border`), validation/error/generating states use semantic tokens (`bg-destructive/10`, `bg-amber-500/10`, `bg-purple-500/10`)
- [x] **AC19:** `ConversationHistoryView.tsx` history items, section headers, badges, empty state use design tokens

### Phase E — Input Bug Fix & Canvas Selection (expanded)

- [x] **AC20:** `AIChatInputField.tsx` — textarea `text-gray-900` fixed to `text-foreground bg-transparent` — text is now visible in dark mode without selecting
- [x] **AC21:** `ChipTag.tsx` — chip inside input box uses `bg-blue-500/15 text-blue-500` — was `bg-blue-50 text-blue-700` (invisible on dark bg)
- [x] **AC22:** `AIChatIconBar.tsx`, `SmartSuggestionsRow.tsx` — all icon buttons and suggestion pills use design tokens
- [x] **AC23:** Canvas element selection ring: `TextElement.tsx`, `ShapeElement.tsx`, `ImageElement.tsx` — changed from `ring-offset-1` (shows white gap) to `outline-offset-1` (no background leak on colored canvas)
- [x] **AC24:** `CenterCanvas.tsx` outer wrapper changed from `bg-gray-100` to `bg-muted/50` — canvas surroundings adapt to dark mode

### Phase F — Remaining AI Chat Components (expanded)

- [x] **AC25:** `ConversationToolbar.tsx`, `ConversationHistoryPanel.tsx` use `bg-muted/50 border-border`, action buttons use `hover:bg-muted`
- [x] **AC26:** `ResultsVariations.tsx` — variation cards use `bg-background border-border`, preview bg `bg-muted`, text `text-foreground`
- [x] **AC27:** `AIFloatingButton.tsx` — active state `bg-foreground text-background`, inactive state `bg-background text-foreground border-border`
- [x] **AC28:** `TemplateQuickActions.tsx` — popular chips `bg-foreground text-background`, "All Templates" button `bg-background border-border text-foreground`
- [x] **AC29:** `AIChatHeader.tsx`, `AIChatInput.tsx`, `TimestampDivider.tsx`, `AIPropertyChatInput.tsx` — all hardcoded gray/white tokens replaced

---

## Out of Scope

- Canvas art board drawing area (intentional user-defined background color)
- `text-yellow-500` logo accent (intentional brand color)
- Hex colors inside `BrandPalette` data arrays (content data, not UI)
- Logic, event handlers, or prop types — only class names changed
- Non-dark-mode functional changes

---

## Engineering / PR

- **Branch:** `feat/design-us-design-002-editor-tokens`
- **PR:** #_____ (fill when opened)
- **Total files modified:** 38 component files
- **Total hardcoded token references replaced:** ~280+

### Files Touched

**AI Chat (28 files):**
- `AIChatBox.tsx`, `AIChatHeader.tsx`, `AIChatIconBar.tsx`, `AIChatInput.tsx`, `AIChatInputField.tsx`
- `AIFloatingButton.tsx`, `AIPropertyChatInput.tsx`, `AISuggestionsPanel.tsx`
- `CategoryChip.tsx`, `CategoryChipList.tsx`, `ChipTag.tsx`
- `ConversationHistoryPanel.tsx`, `ConversationHistoryView.tsx`, `ConversationToolbar.tsx`
- `EnhancedSuggestionsPanel.tsx`, `GenerationProgress.tsx`, `GenerationProgressBar.tsx`
- `ImageUploadPanel.tsx`, `MessageBubble.tsx`, `PromptSuggestionCard.tsx`
- `QuickActionsPanel.tsx`, `ResultsVariations.tsx`, `SmartSuggestionsRow.tsx`
- `StylePresetsPanel.tsx`, `TemplateCategoryView.tsx`, `TemplateDropdown.tsx`
- `TemplateQuickActions.tsx`, `TimestampDivider.tsx`

**Canvas (3 files):**
- `ImageElement.tsx`, `ShapeElement.tsx`, `TextElement.tsx`

**Editor (10 files):**
- `AgentInfoForm.tsx`, `BrandPaletteDialog.tsx`, `CenterCanvas.tsx`, `ColorPickerField.tsx`
- `ContextualToolbar.tsx`, `PropertyPanel.tsx`, `RightSidebar.tsx`
- `SelectionInfoPanel.tsx`, `TransparencyPanel.tsx`
- `sidebar/LayerItemWithThumbnail.tsx`
- `toolbar/ShapeToolbar.tsx`, `toolbar/TextControls.tsx`

**UI (1 file):**
- `ui/dropdown-menu.tsx` (bug fix: missing `{...props}` spread on `DropdownMenuContent`)

---

## Token Replacement Guide

```
bg-gray-900        → bg-background        (toolbar/page background)
bg-gray-800        → bg-muted             (secondary bg, hover state)
bg-gray-700        → bg-accent            (active/selected state)
bg-gray-100        → bg-muted             (light secondary bg)
bg-gray-50         → bg-muted             (subtle bg)
bg-white           → bg-background        (all panels, chat boxes)
text-gray-100/200/300 → text-foreground
text-gray-400/500     → text-muted-foreground
text-gray-600/700     → text-muted-foreground
text-gray-900         → text-foreground
border-gray-700/800   → border-border
border-gray-200/300   → border-border
hover:bg-gray-100     → hover:bg-muted
hover:bg-gray-50      → hover:bg-muted
bg-blue-50            → bg-blue-500/15    (opacity-based, theme-adaptive)
bg-purple-100         → bg-purple-500/15
bg-amber-100          → bg-amber-500/10
bg-red-50             → bg-destructive/10
text-blue-700         → text-blue-500
text-purple-700       → text-purple-500
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DS-002-01 | Auto | P0 | Open editor in Light mode → toolbar is light | ✅ PASS | `rgb(252, 252, 252)` = `--background` |
| TC-DS-002-02 | Auto | P0 | Open editor in Dark mode → toolbar matches dark theme | ✅ PASS | See ISSUES.md NOTE-01 |
| TC-DS-002-03 | Auto | P0 | Left sidebar (Layers) in both modes — text visible | ✅ PASS | Heading visible after toggle |
| TC-DS-002-04 | Auto | P0 | Right sidebar (Properties) — all controls visible | ✅ PASS | "Generate Template" button visible |
| TC-DS-002-05 | Auto | P1 | Zoom controls visible in Light mode | ✅ PASS | `rgb(240, 240, 240)` = `--muted` |
| TC-DS-002-06 | Auto | P1 | FloatingToolbar readable icons in both modes | ✅ PASS | Panel bg `rgb(252, 252, 252)` |
| TC-DS-002-07 | Auto | P1 | Add text → drag → resize → text visible on canvas | ✅ PASS | Before: 0, After: 1 |
| TC-DS-002-08 | Auto | P1 | Add shape → change fill → visible in Light mode | ✅ PASS | Before: 0, After: 1 |
| TC-DS-002-09 | Auto | P1 | AI chat input NOT white in Dark mode | ✅ PASS | See ISSUES.md NOTE-01 |
| TC-DS-002-10 | Auto | P1 | AI chat input has top border in Light mode | ✅ PASS | `0.8px` border, `rgb(230, 230, 230)` |
| TC-DS-002-11 | Auto | P1 | `npm run check` — zero TypeScript errors | ✅ PASS | Zero new errors |
| TC-DS-002-12 | Manual | P0 | Chat input textarea text visible without selecting in dark mode | ✅ PASS | Fixed: `text-foreground bg-transparent` |
| TC-DS-002-13 | Manual | P0 | "Open House" chip inside input box — text visible in dark mode | ✅ PASS | Fixed: `bg-blue-500/15 text-blue-500` |
| TC-DS-002-14 | Manual | P1 | Canvas element selection ring — no white gap on dark canvas | ✅ PASS | Fixed: `outline` replaces `ring-offset` |
| TC-DS-002-15 | Manual | P1 | Canvas outer area dark in dark mode | ✅ PASS | Fixed: `bg-muted/50` |
| TC-DS-002-16 | Manual | P1 | All AI chat popups (QuickActions, AISuggestions, StylePresets, etc.) dark in dark mode | ✅ PASS | All panels use `bg-background border-border` |
| TC-DS-002-17 | Manual | P1 | Category chips strip height reduced — not oversized | ✅ PASS | `mb-6 → mb-1`, `py-1.5 → py-1` |

---

## Definition of Done

- [x] All ACs 1–29 checked ✅
- [x] All TCs run and recorded (11 automated Playwright + 6 manual)
- [x] `npm run check` passes (zero new TypeScript errors)
- [x] Manual canvas smoke: add text, shape — no regression
- [ ] PR merged (PR #{number})
- [x] STORY.md status updated to ✅ Done
- [x] TASKS.md task list fully checked
- [x] ISSUES.md findings documented
