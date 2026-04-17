# AI Chat Box - Testing Guide

## 🧪 Complete Testing Checklist

Use this guide to verify all Phase 2 features are working correctly.

---

## Phase 2.0: Core UI Testing

### Test 1: AI Button
- [ ] Button appears in bottom-right corner
- [ ] Has purple gradient (lighter top, darker bottom)
- [ ] Shows white sparkle icon with 2 small accent sparkles
- [ ] Size is 56px × 56px
- [ ] Hover increases shadow
- [ ] Click opens chat box

### Test 2: Chat Box Expansion
- [ ] Box appears bottom-right, 600px wide
- [ ] Smooth spring animation (bounce effect)
- [ ] Header shows "Real Estate Templates" + "Powered by AI ✨"
- [ ] Close button (X) visible in top-right
- [ ] Background is white with rounded corners
- [ ] Shadow is visible (0 8px 32px rgba(0,0,0,0.12))

### Test 3: Input Field
- [ ] Height is 56px (larger than before)
- [ ] Paperclip icon on left
- [ ] 5 icons on right (Lightbulb, Lightning, Palette, Blue Circle, Upload)
- [ ] Placeholder text: "Ask AI to create a stunning real estate infographic..."
- [ ] Border is gray-200, becomes gray-900 on focus
- [ ] Rounded corners (xl)

### Test 4: Category Chips
- [ ] 6 chips appear below input
- [ ] Chips are outlined (not filled)
- [ ] Each has emoji + text
- [ ] Horizontal scrolling if needed
- [ ] Chips appear with stagger animation (50ms delay each)
- [ ] Order: Property, Open House, Just Sold, Agent, Stats, Neighborhood

### Test 5: Chip Selection
- [ ] Click "Property Listings" chip
- [ ] Chip border changes to orange
- [ ] Blue tag appears inside input field
- [ ] Tag shows: 🏡 Property Listings [X]
- [ ] Input placeholder changes to "Describe what you want to create..."
- [ ] Click X on tag removes it
- [ ] Tag removal has smooth animation

### Test 6: Prompt Suggestions
- [ ] After selecting chip, 3×2 grid appears
- [ ] 6 cards with preview images
- [ ] Each card has image + text description
- [ ] Images are from Unsplash (real photos)
- [ ] Hover scales card slightly
- [ ] Click card auto-fills prompt
- [ ] Grid has smooth fade-in animation

---

## Phase 2.1: Icon Bar Testing

### Test 7: Lightbulb (AI Suggestions)
- [ ] Click lightbulb icon
- [ ] Panel appears top-left of chat box
- [ ] Shows "AI Suggestions 💡"
- [ ] 3 sections: Trending, Quick Templates, Popular Styles
- [ ] Each section has 3 suggestions
- [ ] Click suggestion fills input
- [ ] Click outside panel closes it
- [ ] Backdrop is visible (20% black)

### Test 8: Lightning (Quick Actions)
- [ ] Click lightning icon
- [ ] Panel appears top-left
- [ ] Shows "Quick Actions ⚡"
- [ ] 5 actions with icons:
  - Magic Fill (wand)
  - Smart Images (image)
  - Professional Copy (text)
  - Layout Optimize (layout)
  - Color Harmony (palette)
- [ ] Each has icon + description
- [ ] Click action logs to console
- [ ] Panel closes after selection

### Test 9: Palette (Style Presets)
- [ ] Click palette icon
- [ ] Panel appears top-left
- [ ] Shows "Style Presets 🎨"
- [ ] 6 presets with color swatches:
  - Modern Luxury (black, gold, white)
  - Coastal Fresh (blues)
  - Warm Traditional (browns)
  - Urban Bold (vibrant)
  - Minimal Professional (grays)
  - Nature Inspired (greens)
- [ ] Each shows 3 color circles
- [ ] Each has mood tag (Sophisticated, Refreshing, etc.)
- [ ] Click preset logs to console

### Test 10: Upload (Image Upload)
- [ ] Click upload icon
- [ ] Panel appears top-right (different side!)
- [ ] Shows "Upload Reference 📷"
- [ ] Drag & drop area visible
- [ ] "Browse Files" button present
- [ ] Drag file over area highlights it purple
- [ ] Drop file shows preview in grid
- [ ] Multiple files show in 3-column grid
- [ ] Each preview has remove button (X)
- [ ] Tip box shows at bottom

### Test 11: Generate Button
- [ ] Blue circle button
- [ ] Disabled (gray) when input empty
- [ ] Active (blue) when input has text OR chip selected
- [ ] Click starts generation
- [ ] Shows spinner while generating
- [ ] Enter key also triggers generate

---

## Phase 2.2: History & Favorites Testing

### Test 12: Prompt History
- [ ] Generate a prompt
- [ ] Close chat and reopen
- [ ] See "Recent Prompts" section with clock icon
- [ ] Shows last 5 prompts
- [ ] Each has star button (outline)
- [ ] Click prompt fills input
- [ ] Newest prompts at top

### Test 13: Favorites System
- [ ] Click star on a history item
- [ ] Star fills with yellow color
- [ ] Header star button shows count (e.g., "★ 1")
- [ ] Click header star button
- [ ] Switches to "Favorite Prompts" view
- [ ] Star icon in header is filled (yellow)
- [ ] Shows only favorited prompts
- [ ] Each has trash icon on hover
- [ ] Click trash removes favorite (star → outline)
- [ ] Click star again to toggle back to history

### Test 14: Empty States
- [ ] Open chat for first time
- [ ] No history section appears
- [ ] Switch to favorites view (star button)
- [ ] Shows empty state:
  - Star icon (gray)
  - "No favorite prompts yet"
  - "Star prompts from history to save them"

---

## Phase 2.3: Generation Testing

### Test 15: Generation Progress
- [ ] Click generate with prompt
- [ ] Progress panel appears (purple/blue gradient bg)
- [ ] Shows "Generating your infographic..." with spinner
- [ ] 5 steps visible:
  1. Analyzing your prompt
  2. Designing layout
  3. Generating content
  4. Applying style
  5. Finalizing design
- [ ] Steps start gray (pending)
- [ ] Current step is purple with spinner
- [ ] Completed steps are green with checkmark
- [ ] Progress bar at bottom fills left to right
- [ ] Shows "Step X of 5"
- [ ] Each step takes ~1.5 seconds
- [ ] Total time ~7.5 seconds

### Test 16: Result Variations
- [ ] After generation completes
- [ ] Progress panel disappears
- [ ] "Choose Your Design ✨" header appears
- [ ] 3 variation cards in grid
- [ ] Each card shows:
  - Preview image (3:4 aspect)
  - Title (Classic Elegance, Modern Minimal, Vibrant Bold)
  - Description
- [ ] Cards appear with stagger (0.1s delay each)
- [ ] Click card to select
- [ ] Selected card gets blue border + ring
- [ ] Blue checkmark appears top-right
- [ ] Hover shows overlay with 2 buttons:
  - Edit button
  - Download button

### Test 17: Variation Actions
- [ ] Select a variation
- [ ] "Use This Design" button appears at bottom
- [ ] "Customize" button appears next to it
- [ ] "Regenerate" button in top-right
- [ ] Click "Use This Design" → logs to console + closes chat
- [ ] Click "Customize" → logs to console
- [ ] Click "Regenerate" → starts new generation

---

## Phase 2.4: Polish & UX Testing

### Test 18: Keyboard Shortcuts
- [ ] Type in input field
- [ ] Press Enter key
- [ ] Generation starts (if input not empty)
- [ ] Disabled if input empty

### Test 19: Scrolling
- [ ] Add multiple history items
- [ ] Chat content becomes scrollable
- [ ] Max height enforced (calc(100vh - 120px))
- [ ] Scroll bar appears when needed
- [ ] Header stays fixed at top
- [ ] Close button stays visible

### Test 20: Animations
- [ ] Chat box expansion: Spring bounce
- [ ] Chips: Stagger fade-up (50ms each)
- [ ] Tags: Scale + opacity on add/remove
- [ ] Panels: Fade + slide
- [ ] Progress bar: Width transition
- [ ] Variations: Scale + fade on appear
- [ ] All transitions smooth (no jank)

### Test 21: Error Handling
- [ ] Generate causes error (network fail simulation)
- [ ] Red error banner appears
- [ ] Error message: "Failed to generate template. Please try again."
- [ ] Generation stops
- [ ] Can retry generation

### Test 22: Click Outside
- [ ] Open lightbulb panel
- [ ] Click on backdrop (black area)
- [ ] Panel closes
- [ ] Same for all 4 panels
- [ ] Click inside panel doesn't close it

### Test 23: Close Button
- [ ] Click X in top-right
- [ ] Chat closes with animation (reverse of open)
- [ ] All state resets
- [ ] Panels close
- [ ] Reopen chat → clean slate

---

## Integration Testing

### Test 24: Full User Journey
1. [ ] Click purple AI button → chat opens
2. [ ] Click "Property Listings" chip → tag appears
3. [ ] Click suggestion card → prompt fills
4. [ ] Click lightbulb → see AI suggestions panel
5. [ ] Click palette → see style presets
6. [ ] Click upload → see image upload panel
7. [ ] Click outside → panels close
8. [ ] Click generate → progress starts
9. [ ] Wait 7.5s → 3 variations appear
10. [ ] Click variation → selection highlight
11. [ ] Click "Use This Design" → chat closes
12. [ ] Reopen chat → prompt in history
13. [ ] Star the prompt → favorite added
14. [ ] Click star button → favorites view
15. [ ] Click prompt → reuses it
16. [ ] Click X → chat closes

### Test 25: Multiple Sessions
- [ ] Generate 5+ prompts
- [ ] Close and reopen
- [ ] History shows last 5 only
- [ ] Star 3 prompts
- [ ] Favorites view shows 3
- [ ] Generate new prompt
- [ ] History updated
- [ ] Favorites preserved

---

## Performance Testing

### Test 26: Speed
- [ ] Chat opens in < 200ms
- [ ] Panels open in < 300ms
- [ ] Generation steps transition in 1.5s each
- [ ] Variations appear in < 500ms
- [ ] No lag when typing
- [ ] Smooth 60fps animations

### Test 27: Memory
- [ ] Open/close chat 10 times
- [ ] No memory leaks
- [ ] No orphaned event listeners
- [ ] Clean state reset each time

---

## Browser Testing

### Test 28: Cross-Browser
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Test 29: Responsive
- [ ] Works at 1920×1080
- [ ] Works at 1366×768
- [ ] Works at 1280×720
- [ ] Scrolls properly on small screens

---

## Accessibility Testing

### Test 30: Keyboard Navigation
- [ ] Can Tab to all buttons
- [ ] Focus visible (outline)
- [ ] Can activate with Enter/Space
- [ ] Escape key closes panels (future enhancement)

### Test 31: Screen Reader
- [ ] Buttons have proper labels
- [ ] Icons have title attributes
- [ ] Images have alt text
- [ ] ARIA labels where needed

---

## Visual Regression Testing

### Test 32: Layout
- [ ] No overlapping elements
- [ ] Consistent spacing
- [ ] Aligned elements
- [ ] Proper z-index stacking
- [ ] No cut-off text

### Test 33: Colors
- [ ] Gradient renders correctly
- [ ] Text contrast meets WCAG AA
- [ ] Hover states visible
- [ ] Disabled states clear
- [ ] Error colors distinct

---

## Edge Cases

### Test 34: Empty States
- [ ] No history
- [ ] No favorites
- [ ] No chips selected
- [ ] Empty input
- [ ] Failed generation

### Test 35: Long Content
- [ ] Very long prompt (500+ chars)
- [ ] Many tags in input
- [ ] Long suggestion text
- [ ] Many history items
- [ ] Many favorites

### Test 36: Rapid Actions
- [ ] Click generate multiple times rapidly
- [ ] Click panels rapidly
- [ ] Select chips rapidly
- [ ] Add/remove tags rapidly
- [ ] No race conditions

---

## Bug Prevention

### Common Issues to Check
- [ ] Z-index conflicts
- [ ] Backdrop click propagation
- [ ] State not resetting on close
- [ ] Memory leaks from listeners
- [ ] Animation conflicts
- [ ] CSS specificity issues
- [ ] Event handler cleanup
- [ ] Async race conditions

---

## Final Checklist

### Pre-Production
- [ ] All tests passing
- [ ] No console errors
- [ ] No console warnings
- [ ] TypeScript compiles
- [ ] Linter passes
- [ ] Bundle size acceptable
- [ ] Performance benchmarks met
- [ ] Documentation complete

### Sign-Off
- [ ] Developer tested
- [ ] Designer approved
- [ ] Product owner verified
- [ ] QA passed
- [ ] Accessibility audited
- [ ] Performance validated
- [ ] Security reviewed
- [ ] Ready for production 🚀

---

## Test Results Template

```
Date: _______________
Tester: _____________
Environment: _________

Phase 2.0: ☐ Pass  ☐ Fail
Phase 2.1: ☐ Pass  ☐ Fail
Phase 2.2: ☐ Pass  ☐ Fail
Phase 2.3: ☐ Pass  ☐ Fail
Phase 2.4: ☐ Pass  ☐ Fail

Integration: ☐ Pass  ☐ Fail
Performance: ☐ Pass  ☐ Fail
Browser:     ☐ Pass  ☐ Fail
A11y:        ☐ Pass  ☐ Fail

Overall: ☐ Approved  ☐ Needs Work

Notes:
_________________________
_________________________
_________________________
```

---

**Happy Testing! 🧪**

If all tests pass, you have a **production-ready AI Chat Box** with all Phase 2 features fully functional!
