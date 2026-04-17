# Commit Template — US-DESIGN-002

> **GitHub PR body:** use [`PR_BODY.md`](./PR_BODY.md) with `gh pr create --body-file …` (see [`docs/agile/guides/STORY_PR_WORKFLOW.md`](../../../guides/STORY_PR_WORKFLOW.md)).  
> Edit the commit message and file list as needed before running.  
> Stage files individually per phase for clean history, or squash into one.

---

## Option A — Single Squash Commit (Recommended)

```
feat(design): full dark mode token adoption across editor, AI chat, and canvas

Replace all hardcoded bg-white / text-gray-* / bg-gray-* / border-gray-* 
with CSS design token classes across 49 component files. Fixes critical bugs:
textarea text invisible in dark mode, ChipTag invisible, selection ring white 
gap on canvas. Canvas outer area, all AI chat popups, chips, template cards,
message bubbles, and conversation panels now adapt to theme correctly.

Also fixes: DropdownMenuContent missing {...props} spread (empty menus).
Canvas selection ring: ring-offset-1 → outline-offset-1 (no bg leak).

npm run check: zero new TypeScript errors.
```

**Files to stage:**

```bash
# --- Phase A: Editor Toolbar & Sidebars ---
git add client/src/components/editor/EditorToolbar.tsx
git add client/src/components/editor/FloatingToolbar.tsx
git add client/src/components/editor/ZoomControls.tsx
git add client/src/components/editor/LayersPanel.tsx
git add client/src/components/editor/AdjustmentsPanel.tsx
git add client/src/components/editor/PropertyPanel.tsx
git add client/src/components/editor/toolbar/TextControls.tsx
git add client/src/components/editor/toolbar/ShapeToolbar.tsx

# --- Phase B: Editor Secondary Panels ---
git add client/src/components/editor/ContextualToolbar.tsx
git add client/src/components/editor/SelectionInfoPanel.tsx
git add client/src/components/editor/TransparencyPanel.tsx
git add client/src/components/editor/RightSidebar.tsx
git add client/src/components/editor/AgentInfoForm.tsx
git add client/src/components/editor/BrandPaletteDialog.tsx
git add client/src/components/editor/ColorPickerField.tsx
git add client/src/components/editor/sidebar/LayerItemWithThumbnail.tsx

# --- Phase C: AI Chat Popup Panels ---
git add client/src/components/ai-chat/QuickActionsPanel.tsx
git add client/src/components/ai-chat/AISuggestionsPanel.tsx
git add client/src/components/ai-chat/StylePresetsPanel.tsx
git add client/src/components/ai-chat/EnhancedSuggestionsPanel.tsx
git add client/src/components/ai-chat/ImageUploadPanel.tsx

# --- Phase D: Chat Container, Chips, Templates, Messages ---
git add client/src/components/editor/CenterCanvas.tsx
git add client/src/components/ai-chat/AIChatBox.tsx
git add client/src/components/ai-chat/CategoryChipList.tsx
git add client/src/components/ai-chat/CategoryChip.tsx
git add client/src/components/ai-chat/PromptSuggestionCard.tsx
git add client/src/components/ai-chat/TemplateCategoryView.tsx
git add client/src/components/ai-chat/TemplateDropdown.tsx
git add client/src/components/ai-chat/MessageBubble.tsx
git add client/src/components/ai-chat/ConversationHistoryView.tsx

# --- Phase E: Input Bug Fixes & Canvas Selection ---
git add client/src/components/ai-chat/AIChatInputField.tsx
git add client/src/components/ai-chat/ChipTag.tsx
git add client/src/components/ai-chat/AIChatIconBar.tsx
git add client/src/components/ai-chat/SmartSuggestionsRow.tsx
git add client/src/components/canvas/TextElement.tsx
git add client/src/components/canvas/ShapeElement.tsx
git add client/src/components/canvas/ImageElement.tsx

# --- Phase F: Remaining AI Chat Components ---
git add client/src/components/ai-chat/ConversationToolbar.tsx
git add client/src/components/ai-chat/ResultsVariations.tsx
git add client/src/components/ai-chat/AIFloatingButton.tsx
git add client/src/components/ai-chat/TemplateQuickActions.tsx
git add client/src/components/ai-chat/AIChatHeader.tsx
git add client/src/components/ai-chat/AIChatInput.tsx
git add client/src/components/ai-chat/TimestampDivider.tsx
git add client/src/components/ai-chat/ConversationHistoryPanel.tsx
git add client/src/components/ai-chat/AIPropertyChatInput.tsx

# --- Bug Fix ---
git add client/src/components/ai-chat/GenerationProgressBar.tsx
git add client/src/components/ai-chat/GenerationProgress.tsx
git add client/src/components/ui/dropdown-menu.tsx

# --- Agile Docs ---
git add docs/agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-002/STORY.md
git add docs/agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-002/TASKS.md
git add docs/agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-002/ISSUES.md
git add docs/agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-002/COMMIT_TEMPLATE.md
```

---

## Option B — Per-Phase Commits (Clean History)

### Commit 1 — Phase A

```
feat(editor): replace hardcoded gray tokens in toolbar and sidebars — US-DESIGN-002

EditorToolbar, FloatingToolbar, ZoomControls, LayersPanel, AdjustmentsPanel,
PropertyPanel, TextControls, ShapeToolbar: all bg-gray-*/text-gray-*/border-gray-*
replaced with bg-background/bg-muted/bg-sidebar/text-foreground/text-sidebar-foreground.
```

```bash
git add client/src/components/editor/EditorToolbar.tsx
git add client/src/components/editor/FloatingToolbar.tsx
git add client/src/components/editor/ZoomControls.tsx
git add client/src/components/editor/LayersPanel.tsx
git add client/src/components/editor/AdjustmentsPanel.tsx
git add client/src/components/editor/PropertyPanel.tsx
git add client/src/components/editor/toolbar/TextControls.tsx
git add client/src/components/editor/toolbar/ShapeToolbar.tsx
```

---

### Commit 2 — Phase B + Bug Fix

```
feat(editor): dark mode token replacement in secondary panels and ui fix — US-DESIGN-002

ContextualToolbar, SelectionInfoPanel, TransparencyPanel, RightSidebar,
AgentInfoForm, BrandPaletteDialog, ColorPickerField, LayerItemWithThumbnail:
all hardcoded gray/white tokens replaced with design system vars.

fix(ui): DropdownMenuContent missing {...props} spread — dropdown items now render.
```

```bash
git add client/src/components/editor/ContextualToolbar.tsx
git add client/src/components/editor/SelectionInfoPanel.tsx
git add client/src/components/editor/TransparencyPanel.tsx
git add client/src/components/editor/RightSidebar.tsx
git add client/src/components/editor/AgentInfoForm.tsx
git add client/src/components/editor/BrandPaletteDialog.tsx
git add client/src/components/editor/ColorPickerField.tsx
git add client/src/components/editor/sidebar/LayerItemWithThumbnail.tsx
git add client/src/components/ui/dropdown-menu.tsx
```

---

### Commit 3 — Phase C

```
feat(ai-chat): dark mode token replacement in popup panels — US-DESIGN-002

QuickActionsPanel, AISuggestionsPanel, StylePresetsPanel, EnhancedSuggestionsPanel,
ImageUploadPanel, GenerationProgressBar, GenerationProgress: all bg-white/bg-gray-*/
border-gray-* replaced. Icon backgrounds use opacity-based colors (bg-purple-500/15).
```

```bash
git add client/src/components/ai-chat/QuickActionsPanel.tsx
git add client/src/components/ai-chat/AISuggestionsPanel.tsx
git add client/src/components/ai-chat/StylePresetsPanel.tsx
git add client/src/components/ai-chat/EnhancedSuggestionsPanel.tsx
git add client/src/components/ai-chat/ImageUploadPanel.tsx
git add client/src/components/ai-chat/GenerationProgressBar.tsx
git add client/src/components/ai-chat/GenerationProgress.tsx
```

---

### Commit 4 — Phase D

```
feat(ai-chat): dark mode token replacement in chat container, chips, templates — US-DESIGN-002

AIChatBox extended, CategoryChipList (height reduced mb-6→mb-1), CategoryChip,
PromptSuggestionCard, TemplateCategoryView, TemplateDropdown, MessageBubble,
ConversationHistoryView, CenterCanvas outer bg-muted/50.
```

```bash
git add client/src/components/editor/CenterCanvas.tsx
git add client/src/components/ai-chat/AIChatBox.tsx
git add client/src/components/ai-chat/CategoryChipList.tsx
git add client/src/components/ai-chat/CategoryChip.tsx
git add client/src/components/ai-chat/PromptSuggestionCard.tsx
git add client/src/components/ai-chat/TemplateCategoryView.tsx
git add client/src/components/ai-chat/TemplateDropdown.tsx
git add client/src/components/ai-chat/MessageBubble.tsx
git add client/src/components/ai-chat/ConversationHistoryView.tsx
```

---

### Commit 5 — Phase E (Critical Bug Fixes)

```
fix(ai-chat): textarea text invisible + chip invisible in dark mode — US-DESIGN-002

AIChatInputField: textarea text-gray-900→text-foreground bg-transparent (text was
invisible in dark mode without selecting). ChipTag: bg-blue-50→bg-blue-500/15
text-blue-700→text-blue-500 (chip was invisible on dark background).

fix(canvas): selection ring ring-offset-1→outline-offset-1 (eliminates white gap
on colored canvas backgrounds in dark mode). AIChatIconBar, SmartSuggestionsRow
icon button tokens updated.
```

```bash
git add client/src/components/ai-chat/AIChatInputField.tsx
git add client/src/components/ai-chat/ChipTag.tsx
git add client/src/components/ai-chat/AIChatIconBar.tsx
git add client/src/components/ai-chat/SmartSuggestionsRow.tsx
git add client/src/components/canvas/TextElement.tsx
git add client/src/components/canvas/ShapeElement.tsx
git add client/src/components/canvas/ImageElement.tsx
```

---

### Commit 6 — Phase F

```
feat(ai-chat): dark mode token replacement in remaining components — US-DESIGN-002

ConversationToolbar, ResultsVariations, AIFloatingButton, TemplateQuickActions,
AIChatHeader, AIChatInput, TimestampDivider, ConversationHistoryPanel,
AIPropertyChatInput: all remaining bg-white/text-gray-*/border-gray-* replaced.
Zero hardcoded gray/white tokens remaining in ai-chat/ directory.
```

```bash
git add client/src/components/ai-chat/ConversationToolbar.tsx
git add client/src/components/ai-chat/ResultsVariations.tsx
git add client/src/components/ai-chat/AIFloatingButton.tsx
git add client/src/components/ai-chat/TemplateQuickActions.tsx
git add client/src/components/ai-chat/AIChatHeader.tsx
git add client/src/components/ai-chat/AIChatInput.tsx
git add client/src/components/ai-chat/TimestampDivider.tsx
git add client/src/components/ai-chat/ConversationHistoryPanel.tsx
git add client/src/components/ai-chat/AIPropertyChatInput.tsx
```

---

### Commit 7 — Agile Docs

```
docs(agile): update US-DESIGN-002 story, tasks, and issues for full dark mode scope
```

```bash
git add docs/agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-002/STORY.md
git add docs/agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-002/TASKS.md
git add docs/agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-002/ISSUES.md
git add docs/agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-002/COMMIT_TEMPLATE.md
```

---

## Files NOT in this commit (separate concerns)

These files are modified in the working tree but belong to other stories/sessions:

```
# Payments (separate story)
api/src/modules/payments/controllers/payments.controller.ts
api/src/modules/payments/services/payments.service.ts
api/tests/payments/payments.service.spec.ts
server/payments/providers/razorpay.provider.ts
server/payments/services/subscription.service.ts

# Infrastructure / config (separate concern)
server/index.ts
package.json
tsconfig.json

# Canvas store / types (separate story)
client/src/hooks/useCanvasStore.ts
client/src/lib/canvasTypes.ts
client/src/lib/panelState.tsx

# Editor layout / save / tools (separate story)
client/src/components/editor/EditorLayout.tsx
client/src/components/editor/SaveDialog.tsx
client/src/components/editor/sidebar/ToolsTab.tsx
client/src/components/ui/sidebar.tsx

# AI chat index (check if needed)
client/src/components/ai-chat/index.ts
```

---

## Deleted Files (cleanup — stage only if intentional)

```bash
# Old .md docs scattered in src/ — safe to stage if cleanup is intentional
git add -u   # stages all tracked deletions at once
# OR stage individually:
git add RUNNING_THE_APP.md
git add TASK_TRACKER.md
git add client/src/Attributions.md
git add client/src/components/ai-chat/ALL-FIXES-COMPLETE.md
# ... (all D-status files from git status)
```
