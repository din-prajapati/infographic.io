# PR Task List — US-DESIGN-002

> **Story:** [STORY.md](./STORY.md)  
> **Branch:** `feat/design-us-design-002-editor-tokens`  
> **PR:** #_____ (fill when opened)  
> **Linear:** LIN-XXX  
> **Type:** feat (design token replacement — no logic changes)  
> **Phases:** A (original) + B + C + D + E + F (expanded dark mode coverage)

---

## Task Checklist

### Phase A — Editor Toolbar & Sidebars (Original Scope)

- [x] T1 — `EditorToolbar.tsx` (8 refs → `bg-background`/tokens)
- [x] T2 — `FloatingToolbar.tsx` (11 refs)
- [x] T3 — `ZoomControls.tsx` (7 refs)
- [x] T4 — `LayersPanel.tsx` (13 refs → sidebar tokens)
- [x] T5 — `AdjustmentsPanel.tsx` (23 refs — largest)
- [x] T6 — `PropertyPanel.tsx` (10 refs)
- [x] T7 — `TextControls.tsx` + `ShapeToolbar.tsx` (17 refs)
- [x] T8 — `AIChatBox.tsx` initial (`bg-white` → `bg-background`, 2 lines)
- [x] T9 — `AIChatInputField.tsx` input wrapper (1 line)
- [x] T10 — `GenerationProgressBar.tsx` + `GenerationProgress.tsx` (10 refs)
- [x] T11 — `npm run check` ✅ zero new TypeScript errors

### Phase B — Editor Secondary Panels

- [x] T12 — `ContextualToolbar.tsx` — toolbar class, multi-select text
- [x] T13 — `SelectionInfoPanel.tsx` — container, all text colors
- [x] T14 — `TransparencyPanel.tsx` — container, border, hover, input, divider
- [x] T15 — `RightSidebar.tsx` — Brand Styles: theme cards, palette buttons, Quick Style chips, Quick Tip box
- [x] T16 — `PropertyPanel.tsx` — Generate button `bg-black → bg-foreground`
- [x] T17 — `AgentInfoForm.tsx` — logo upload area, empty icon
- [x] T18 — `BrandPaletteDialog.tsx` — color input border, preview area, swatch border
- [x] T19 — `sidebar/LayerItemWithThumbnail.tsx` — selected gradient, hover, thumbnail borders, selected text, type label, action buttons
- [x] T20 — `ColorPickerField.tsx` — swatch border, pipette, hue slider thumb, RGB labels

### Phase C — AI Chat Popup Panels

- [x] T21 — `QuickActionsPanel.tsx` — panel, header, hover, icon bg, text
- [x] T22 — `AISuggestionsPanel.tsx` — panel, smart mode badge, quick actions, suggestion items, section headers
- [x] T23 — `StylePresetsPanel.tsx` — panel, item hover, swatch border, mood badge, description
- [x] T24 — `EnhancedSuggestionsPanel.tsx` — modal, header, section headers, `SuggestionCardItem`, tags
- [x] T25 — `ImageUploadPanel.tsx` — panel, drag area, upload icon, drag text, uploaded thumbnails, tip box

### Phase D — Chat Container, Chips, Templates, Messages

- [x] T26 — `CenterCanvas.tsx` — outer wrapper `bg-gray-100 → bg-muted/50`
- [x] T27 — `AIChatBox.tsx` extended — header, badge, toolbar, error state, conversation toolbar
- [x] T28 — `CategoryChipList.tsx` — height reduction (`mb-6 → mb-1`), arrow buttons, scroll area
- [x] T29 — `CategoryChip.tsx` — unselected uses `bg-background border-border text-muted-foreground`; selected uses `bg-blue-500/15 text-blue-500`
- [x] T30 — `PromptSuggestionCard.tsx` — card border, image bg, text
- [x] T31 — `TemplateCategoryView.tsx` — category rows, hover, badges, expanded list, template items, Popular badge
- [x] T32 — `TemplateDropdown.tsx` — dropdown, item hover, text, badges
- [x] T33 — `MessageBubble.tsx` — all bubble types, badges, preview images, timestamp
- [x] T34 — `ConversationHistoryView.tsx` — header, empty state, section headers, item hover, badges

### Phase E — Input Bug Fixes & Canvas Selection

- [x] T35 — `AIChatInputField.tsx` — textarea `text-gray-900 → text-foreground bg-transparent` (CRITICAL BUG FIX), property badge, suggestion pills, conversation summary, history scroll area, AI bubble
- [x] T36 — `ChipTag.tsx` — chip in input `bg-blue-50 border-blue-300 text-blue-700 → bg-blue-500/15 border-blue-500/40 text-blue-500` (CRITICAL BUG FIX)
- [x] T37 — `AIChatIconBar.tsx` — icon buttons, generate button disabled state
- [x] T38 — `SmartSuggestionsRow.tsx` — label, suggestion pills, three-dot button
- [x] T39 — `TextElement.tsx` — selection: `ring-2 ring-blue-500 ring-offset-1 → outline outline-2 outline-blue-500 outline-offset-1`
- [x] T40 — `ShapeElement.tsx` — same selection ring fix
- [x] T41 — `ImageElement.tsx` — same selection ring fix

### Phase F — Remaining AI Chat Components

- [x] T42 — `ConversationToolbar.tsx` — border, bg, regenerate button hover
- [x] T43 — `ResultsVariations.tsx` — variation cards, preview bg, text, border, action area
- [x] T44 — `AIFloatingButton.tsx` — active `bg-foreground text-background`; inactive `bg-background text-foreground border-border`
- [x] T45 — `TemplateQuickActions.tsx` — popular chips `bg-foreground text-background`; "All Templates" `bg-background border-border text-foreground`
- [x] T46 — `AIChatHeader.tsx` — border, title, badge
- [x] T47 — `AIChatInput.tsx` — input border, dropdown button, send button
- [x] T48 — `TimestampDivider.tsx` — date pill bg/text
- [x] T49 — `ConversationHistoryPanel.tsx` — header, items, icon colors, action buttons
- [x] T50 — `AIPropertyChatInput.tsx` — history panel, scroll area, AI bubbles, suggestion pills, textarea, hints
- [x] T51 — `ImageUploadPanel.tsx` additional — upload icon, drag text, thumbnail borders
- [x] T52 — `MessageBubble.tsx` additional — preview image borders, preview title, timestamp

### Final Checks

- [x] T53 — `npm run check` ✅ zero new TypeScript errors (confirmed after all phases)
- [ ] T54 — PR opened with STORY.md as description

---

## File-to-Task Mapping

| File | Task | Phase | Hardcoded refs |
|------|------|-------|----------------|
| `editor/EditorToolbar.tsx` | T1 | A | 8 |
| `editor/FloatingToolbar.tsx` | T2 | A | 11 |
| `editor/ZoomControls.tsx` | T3 | A | 7 |
| `editor/LayersPanel.tsx` | T4 | A | 13 |
| `editor/AdjustmentsPanel.tsx` | T5 | A | 23 |
| `editor/PropertyPanel.tsx` | T6 | A+B | 12 |
| `editor/toolbar/TextControls.tsx` | T7 | A | 9 |
| `editor/toolbar/ShapeToolbar.tsx` | T7 | A | 8 |
| `ai-chat/AIChatBox.tsx` | T8, T27 | A+D | 15+ |
| `ai-chat/AIChatInputField.tsx` | T9, T35 | A+E | 10 |
| `ai-chat/GenerationProgressBar.tsx` | T10 | A | 4 |
| `ai-chat/GenerationProgress.tsx` | T10 | A | 6 |
| `editor/ContextualToolbar.tsx` | T12 | B | 4 |
| `editor/SelectionInfoPanel.tsx` | T13 | B | 8 |
| `editor/TransparencyPanel.tsx` | T14 | B | 7 |
| `editor/RightSidebar.tsx` | T15 | B | 12 |
| `editor/AgentInfoForm.tsx` | T17 | B | 3 |
| `editor/BrandPaletteDialog.tsx` | T18 | B | 4 |
| `editor/sidebar/LayerItemWithThumbnail.tsx` | T19 | B | 10 |
| `editor/ColorPickerField.tsx` | T20 | B | 6 |
| `ai-chat/QuickActionsPanel.tsx` | T21 | C | 8 |
| `ai-chat/AISuggestionsPanel.tsx` | T22 | C | 12 |
| `ai-chat/StylePresetsPanel.tsx` | T23 | C | 5 |
| `ai-chat/EnhancedSuggestionsPanel.tsx` | T24 | C | 10 |
| `ai-chat/ImageUploadPanel.tsx` | T25, T51 | C+F | 9 |
| `editor/CenterCanvas.tsx` | T26 | D | 1 |
| `ai-chat/CategoryChipList.tsx` | T28 | D | 6 |
| `ai-chat/CategoryChip.tsx` | T29 | D | 5 |
| `ai-chat/PromptSuggestionCard.tsx` | T30 | D | 4 |
| `ai-chat/TemplateCategoryView.tsx` | T31 | D | 10 |
| `ai-chat/TemplateDropdown.tsx` | T32 | D | 6 |
| `ai-chat/MessageBubble.tsx` | T33, T52 | D+F | 18 |
| `ai-chat/ConversationHistoryView.tsx` | T34 | D | 9 |
| `ai-chat/ChipTag.tsx` | T36 | E | 5 |
| `ai-chat/AIChatIconBar.tsx` | T37 | E | 5 |
| `ai-chat/SmartSuggestionsRow.tsx` | T38 | E | 5 |
| `canvas/TextElement.tsx` | T39 | E | 1 |
| `canvas/ShapeElement.tsx` | T40 | E | 1 |
| `canvas/ImageElement.tsx` | T41 | E | 1 |
| `ai-chat/ConversationToolbar.tsx` | T42 | F | 3 |
| `ai-chat/ResultsVariations.tsx` | T43 | F | 6 |
| `ai-chat/AIFloatingButton.tsx` | T44 | F | 2 |
| `ai-chat/TemplateQuickActions.tsx` | T45 | F | 2 |
| `ai-chat/AIChatHeader.tsx` | T46 | F | 3 |
| `ai-chat/AIChatInput.tsx` | T47 | F | 3 |
| `ai-chat/TimestampDivider.tsx` | T48 | F | 2 |
| `ai-chat/ConversationHistoryPanel.tsx` | T49 | F | 10 |
| `ai-chat/AIPropertyChatInput.tsx` | T50 | F | 12 |
| `ui/dropdown-menu.tsx` | Bug Fix | — | `{...props}` spread |

**Total:** 49 files · ~280+ hardcoded references replaced

---

## Test Commands

```bash
# TypeScript check — must pass before PR
npm run check

# Unit tests — no regression
npm run test:unit

# Dev server — visual check
npm run dev
# Open localhost:5000/editor
# Switch Light → Dark → verify all panels match theme
# Open AI chat → verify no white-on-dark panels
# Click chips — verify chip text visible in dark mode
# Select canvas element — verify selection outline (no white gap)

# E2E (Playwright)
npx playwright test e2e/us-design-002-editor-tokens.spec.ts --headed
```

---

## Anti-Patterns Avoided

- Did NOT change canvas art board drawing area (`data-canvas-container`)
- Did NOT modify `text-yellow-500` (brand accent)
- Did NOT touch hex colors inside `BrandPalette` data arrays
- Did NOT change event handlers, prop types, or component logic
- Did NOT use `bg-blue-50 / bg-purple-100` (light color variants — don't adapt to dark)
- Used opacity-based system: `bg-blue-500/15`, `bg-purple-500/10` throughout
- Used `outline-offset` instead of `ring-offset` for canvas selection (ring-offset leaks bg color)

---

*Tasks created: 2026-04-15 · Expanded: 2026-04-16 · Phase A automated tests: 10/10 PASS*
