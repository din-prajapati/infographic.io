# PR Task List — US-AI-036

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai-us-ai-036-canvas-aware-orientation`
> **PR:** #_____ (fill when opened)
> **Type:** fix

---

## Three Pillars Pre-flight (check before starting AI session)

- [ ] **Brain** — STORY.md filled: ACs written, out-of-scope listed
- [ ] **Muscle** — file list + ordered tasks + exact test commands (below)
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists for this epic
- [ ] **Env** — N/A (no new env vars; frontend-only fix)

---

## PR Scope Summary

**One-liner:** Generation orientation follows the active canvas; "Use This Design" inserts into it instead of replacing it — fixes a confirmed bug, no backend change.
```
fix(ai): canvas-aware generation orientation + insert-as-layer — US-AI-036
```

---

## Task Breakdown

### T1 — Orientation-derivation helper
**File:** `client/src/lib/canvasState.ts`
- New pure function `deriveOrientationFromCanvas(width, height): AiOrientation`, bucketing into landscape/portrait/square (reuse the same ratio logic `resolveAiArtboard` already uses for images)
- Falls back to `DEFAULT_ORIENTATION` on missing/zero dimensions

### T2 — Quick Generate reads active canvas
**File:** `client/src/components/editor/RightSidebar.tsx`
- Replace hardcoded `orientation: "landscape"` in `handleGenerate()` with `deriveOrientationFromCanvas(...)` fed by the active canvas's current width/height

### T3 — AI Chat orientation picker default
**File:** `client/src/components/ai-chat/AIChatBox.tsx`
- Orientation picker's initial state derives from the active canvas instead of a fixed default
- Manual override by the user must still work exactly as today

### T4 — Insert-as-layer vs. auto-resize branch
**File:** `client/src/lib/canvasState.ts`
- In `loadAiVariationToCanvas()`, branch on whether the active canvas has a deliberate origin (`templateId` present / `type === 'template'`)
- Deliberate origin → new `ImageElement` fit inside existing `canvasWidth`/`canvasHeight` (`objectFit: 'contain'`, centered), canvas untouched
- No deliberate origin → keep today's `resolveAiArtboard`-driven auto-resize exactly as-is

### T5 — Tests
**Files:** new/extended unit test file for `canvasState.ts` helpers
- Unit tests for `deriveOrientationFromCanvas` (TC-036-01, TC-036-06)
- Manual test pass for TC-036-02 through TC-036-05

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
# Manual: open Instagram Story template -> Quick Generate -> Use This Design
#         -> verify portrait generation + image lands inside existing canvas
# Manual: blank canvas -> Quick Generate -> Use This Design -> auto-resize unchanged
```

---

## Task Checklist

- [x] T1 — Orientation-derivation helper + unit tests
- [x] T2 — Quick Generate reads active canvas
- [x] T3 — AI Chat picker default from active canvas
- [x] T4 — Insert-as-layer vs. auto-resize branch
- [x] T5 — Tests (unit + manual)
- [x] `npm run check` passes ✅
- [x] `npm run test:unit` passes ✅
- [ ] Manual test recorded ✅
- [ ] PR opened with story card as description ✅
- [x] STORY.md ACs updated ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT touch the backend generation endpoint, DTO, or Ideogram service — `orientation` already works end-to-end; this is a frontend value-sourcing fix only
- Do NOT add new aspect-ratio buckets beyond landscape/portrait/square
- Do NOT remove the user's ability to manually override orientation in AI Chat
- Do NOT build the Format Picker or Save-as-Template here — separate stories

---

*Tasks created: 2026-07-29*
