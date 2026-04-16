# M-DESIGN-02 — Editor Design Token Fix

> **Epic:** [EPIC-DESIGN-01](../EPIC.md)  
> **Status:** 🟡 In Progress  
> **Target:** 2026-04-30 · **Last verified:** 2026-04-15 · **PR #1 merged:** 2026-04-17

---

## Status

| Item | State |
|------|--------|
| US-DESIGN-002 implementation | ✅ Merged to `main` via [PR #1](https://github.com/din-prajapati/infographic.io/pull/1) (2026-04-17) |
| US-DESIGN-002 PR merged | ✅ Done |
| US-DESIGN-003 | 🟡 Partial — human TCs + live API (unblocked by US-002 merge) |
| **AI Chat** — `gray-*` / `zinc-*` / `bg-white` in `components/ai-chat/*.tsx` | ✅ **0 matches** (grep) |
| **Editor** — same pattern grep in `components/editor/` | 🟡 **Residual** — optional follow-up |

**Editor files still matching (non-exhaustive):** `EditableTitle.tsx`, `toolbar/ImageToolbar.tsx`, `EditorLayout.tsx` (preview), `ZoomControls.tsx`, `toolbar/TextControls.tsx`, `toolbar/ShapeToolbar.tsx`, `EditorToolbar.tsx`, `CenterCanvas.tsx` (template / modal UI), `RightSidebar.tsx`, `ColorPickerField.tsx`.

---

## Milestone done when

- [x] US-DESIGN-002 **PR merged** + PR# in [STORY.md](../stories/US-DESIGN-002/STORY.md)
- [ ] US-DESIGN-003 human TCs recorded (where applicable)
- [ ] Editor Light/Dark smoke + `npm run check` gate on merged `main`
- [ ] Manual smoke: add text, shape, image, drag-resize

---

*Milestone created 2026-04-15 · Status-only doc.*
