---
title: PR Task List — US-EDIT-009
type: tasks
updated: 2026-09-01
---

# PR Task List — US-EDIT-009

> **Story:** [STORY.md](./STORY.md)
> **Milestone branch:** `feat/edit/m-03-single-editable-path`
> **PR:** #_____

---

## Four Pillars Pre-flight

- [x] **Brain** — STORY.md filled, 7 ACs, all file-specific
- [x] **Muscle** — T0-T5 below
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd)
- [x] **Env** — no environment changes

---

## PR Scope Summary

**One-liner:** One way to get editable text — on the canvas, after the image exists.

```
feat(edit): T{n} {summary} — US-EDIT-009
```

---

## Task Breakdown

### T0 — Decide the real-photo text-free question ⚠️ **do this first**
- **Type:** decision, no code
- Answer the Open Question in STORY.md and write the choice into the card. Option A (drive
  `buildTextFreeImagePrompt` from `photoReference != null`) changes T4's shape; Option B deletes
  that path entirely and reopens `US-AI-051`.
- Implementing before deciding means writing T4 twice.

### T1 — Remove the toggle from AI Chat
- **File:** `client/src/components/ai-chat/AIChatBox.tsx`
- **Type:** `feat` · **AC(s):** AC1, AC2
- 13 `renderMode` references, including the control at line 1461 and the branches at 852 / 1153 /
  1168. `composeInFlight && renderMode === "editable"` at line 153 becomes just `composeInFlight`.

### T2 — Remove it from the sidebar
- **File:** `client/src/components/editor/RightSidebar.tsx`
- **Type:** `feat` · **AC(s):** AC2
- 7 references.

### T3 — Drop it from the client→server contract
- **File:** `client/src/lib/api.ts`, `client/src/components/ai-chat/types.ts`
- **Type:** `feat` · **AC(s):** AC3

### T4 — Retire the server parameter
- **File:** `api/src/modules/infographics/dto/generate-from-chat.dto.ts`,
  `generations.controller.ts`, `generations.service.ts`,
  `api/src/modules/ai-generation/services/ai-orchestrator.service.ts`,
  `infographic-prompt.builder.ts`
- **Type:** `feat` · **AC(s):** AC4, AC7
- The DTO field is removed but an incoming `renderMode` must be **ignored, not rejected** — a
  stale browser tab should not start 400ing mid-session.
- `infographic-prompt.builder.ts` is T0's outcome, not a mechanical edit.

### T5 — Tests
- **File:** `client/src/lib/layout/__tests__/loadVariation.spec.ts` (9 existing assertions),
  plus new coverage per the TC table
- **Type:** `test` · **AC(s):** AC5, AC6, all TCs
- **TC-EDIT-009-03 is the one that matters.** `CanvasEditToolbar` must still derive editable state
  from the canvas alone. Its comment documents a real bug — a freshly opened template claiming to
  be editable after an unrelated compose — and this story deletes code all around it.

---

## Task Checklist

- [ ] T0 — Decide the text-free question (blocks T4)
- [ ] T1 — Remove the toggle from AIChatBox
- [ ] T2 — Remove renderMode from RightSidebar
- [ ] T3 — Drop it from the client contract
- [ ] T4 — Retire the server parameter
- [ ] T5 — Tests
- [ ] Gate 1 passes
- [ ] Gate 2 — staging visual check (generate → no mode choice → Edit elements works)
- [ ] US-AI-051 status reconciled
- [ ] PR opened with story card as description
- [ ] STORY.md ACs ticked off
