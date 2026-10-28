# M-DESIGN-02 — Editor Design Token Fix

> **Epic:** [EPIC-DESIGN-01](../EPIC.md)  
> **Status:** ✅ Done — closed 2026-10-28. US-DESIGN-002 merged (#1); US-DESIGN-003 and US-DESIGN-004 verified on staging 2026-10-27.
> **Target:** 2026-04-30 · **Last verified:** 2026-04-15 · **PR #1 merged:** 2026-04-17

---

## Status

| Item | State |
|------|--------|
| US-DESIGN-002 implementation | ✅ Merged to `main` via [PR #1](https://github.com/din-prajapati/infographic.io/pull/1) (2026-04-17) |
| US-DESIGN-002 PR merged | ✅ Done |
| US-DESIGN-003 | ✅ Done 2026-10-28 — AC3 verified live on staging 2026-10-27 |
| **AI Chat** — `gray-*` / `zinc-*` / `bg-white` in `components/ai-chat/*.tsx` | ✅ **0 matches** (grep verified 2026-04-29) |
| **AI Chat** — hover/button tokens (blue → primary, purple → ai-accent) | ✅ 14 instances fixed + ai-accent token introduced (2026-04-29) |
| **Editor** — Publish/Share buttons removed; AI button hidden in preview | ✅ Done (2026-04-29) |
| **Editor** — Residual gray/white in secondary editor UI | 🟡 Deferred — non-blocking for Phase 0 gate |

**Editor files still matching (non-exhaustive):** `EditableTitle.tsx`, `toolbar/ImageToolbar.tsx`, `EditorLayout.tsx` (preview), `ZoomControls.tsx`, `toolbar/TextControls.tsx`, `toolbar/ShapeToolbar.tsx`, `EditorToolbar.tsx`, `CenterCanvas.tsx` (template / modal UI), `RightSidebar.tsx`, `ColorPickerField.tsx`.

---

## Milestone done when

- [x] US-DESIGN-002 **PR merged** + PR# in [STORY.md](../stories/US-DESIGN-002/STORY.md)
- [x] US-DESIGN-003 auto + static TCs recorded (5/6 ACs verified 2026-04-29)
- [x] US-DESIGN-003 AC3 — generation result on staging — ✅ 2026-10-27 (3 cards 2560×1440, usage 7 → 8)
- [x] US-DESIGN-004 — human visual checks on staging — ✅ 2026-10-27 (no split panels in Light mode; dark chart labels 5.72:1 / 16.7:1)
- [x] Editor Light/Dark smoke + `npm run check` gate — ✅ editor measured light in Light mode and rendering in Dark on staging 2026-10-27/28; `npm run check` runs in CI on `main` (green)
- [x] Manual smoke on staging: add text, shape, image, drag-resize — ✅ 2026-10-28: text, square and image layers added (image 600×600, `object-fit: contain`, undistorted); drag moved the square exactly the drag distance; corner resize grew it 93×62 → 173×122

---

*Milestone created 2026-04-15 · Status-only doc.*
