# Migration Guide: Phase 1.1 → Phase 2.0

## Overview

Phase 2.0 is a **major redesign** that changes the AI Chat Box from a template dropdown system to a Lovart-style prompt interface with visual suggestions.

## Breaking Changes

### 1. AIChatBox Interface (No Changes)
The public API remains the same:
```tsx
<AIChatBox
  isExpanded={boolean}
  onClose={() => void}
  onTemplateLoad={(template) => void}
/>
```

✅ **No code changes needed in parent components**

### 2. Visual Changes

| Phase 1.1 | Phase 2.0 |
|-----------|-----------|
| 400px width | 600px width |
| 48px input | 56px input |
| 1 generate button | 5 icons + generate |
| Filled black chips | Outlined chips |
| Template dropdown | Prompt suggestion grid |
| No preview images | 36 Unsplash images |

### 3. Behavior Changes

**Phase 1.1**: Click chip → Load template instantly
**Phase 2.0**: Click chip → Show suggestions → Click suggestion → Generate

### 4. Internal State Changes

Added to `AIChatState`:
```tsx
selectedChips: CategoryChip[];
showPromptGrid: boolean;
activeChipId: CategoryChipType | null;
```

## What's Removed (Still Available as Legacy)

These components are no longer used but kept for reference:
- `TemplateQuickActions.tsx`
- `TemplateCategoryView.tsx`
- `TemplateDropdown.tsx`
- `AIChatHeader.tsx` (replaced with inline header)
- `AIChatInput.tsx` (replaced with `AIChatInputField.tsx`)

## New Components

- `AIButtonIcon.tsx` - Gradient sparkle icon
- `AIChatInputField.tsx` - New input with tags
- `AIChatIconBar.tsx` - 5 right icons
- `CategoryChip.tsx` - Outlined chip
- `CategoryChipList.tsx` - Chip container
- `ChipTag.tsx` - Blue tag in input
- `PromptSuggestionCard.tsx` - Card with image
- `PromptSuggestionGrid.tsx` - 3×2 grid

## New Data Files

- `categoryChipsData.ts` - 6 categories
- `promptSuggestionsData.ts` - 36 prompts

## Migration Steps

### If you're using the default integration:
1. ✅ No changes needed!
2. The AIChatBox component handles everything internally

### If you're using internal components:
1. Replace `TemplateQuickActions` with `CategoryChipList`
2. Replace `AIChatInput` with `AIChatInputField`
3. Remove template dropdown logic
4. Add prompt suggestion logic

### If you're customizing the AI button:
```tsx
// OLD (Phase 1.1)
<Button className="bg-purple-600">
  <svg>...</svg> // Star icon
</Button>

// NEW (Phase 2.0)
import { AIButtonIcon } from '../ai-chat/AIButtonIcon';

<Button className="bg-gradient-to-br from-purple-500 to-purple-700">
  <AIButtonIcon />
</Button>
```

## Rollback Instructions

If you need to rollback to Phase 1.1:

1. Restore old `AIChatBox.tsx` from git history
2. Update imports to use Phase 1.1 components
3. Revert `CenterCanvas.tsx` AI button

The old components are still in the codebase and exported, so you can use them if needed.

## Testing Checklist

- [ ] AI button appears with gradient purple color
- [ ] Chat box expands to 600px width
- [ ] Input field is 56px height
- [ ] 6 category chips appear below input
- [ ] Click chip → creates blue tag in input
- [ ] Suggestion grid appears with 6 cards
- [ ] Each card shows preview image
- [ ] Click suggestion → auto-fills prompt
- [ ] Click X on tag → removes tag
- [ ] Generate button turns blue when prompt exists
- [ ] Close button works
- [ ] Animations are smooth

## Support

For questions or issues:
1. Check `README-PHASE2.md` for full documentation
2. Review component source code
3. Check legacy components in Phase 1.1 for reference

## Summary

Phase 2.0 is a **drop-in replacement** with better UX. The public API hasn't changed, so existing integrations will work without modifications. The new design provides a more modern, visual, and intuitive experience for users.
