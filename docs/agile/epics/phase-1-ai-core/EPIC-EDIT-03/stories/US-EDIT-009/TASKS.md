---
title: PR Task List — US-EDIT-009
type: tasks
updated: 2026-09-01
---

# PR Task List — US-EDIT-009

> **Story:** [STORY.md](./STORY.md)
> **Milestone branch:** `feat/edit/m-03-single-editable-path`
> **PR:** #49

---

## Four Pillars Pre-flight

- [x] **Brain** — STORY.md filled, 7 ACs, all file-specific
- [x] **Muscle** — T0-T5 below
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd)
- [x] **Env** — no environment changes

---

## PR Scope Summary

**One-liner:** One way to get editable text — on the canvas, after the image exists.

```
feat(edit): T{n} {summary} — US-EDIT-009
```

---

## Task Breakdown

### T0 — ✅ Decided 2026-09-01: **Option A**
- **Type:** decision, no code — recorded in STORY.md §Decisions
- The text-free real-photo path survives, re-triggered from `photoReference` alone.
  `US-AI-051` is neither reopened nor superseded. T4 and T4a below are shaped by this.

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

### T4a — Re-trigger the text-free path from the photo (Option A)
- **File:** `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` (`useTextFree`,
  lines 269–272), `infographic-prompt.builder.ts` (doc comment, line 284)
- **Type:** `feat` · **AC(s):** AC8
- Delete **only** the `renderMode === 'editable' &&` clause. The two remaining conjuncts
  (`typeof photoReference === 'string' && photoReference.length > 0`) are US-AI-051's AC7 guard —
  leave them exactly as written. The AC6 try/catch fallback around `buildTextFreeImagePrompt` also
  stays; it is unrelated to how the branch is entered.
- Split from T4 so the diff that *removes* a parameter is separable from the diff that *changes
  behaviour*. If the text-free trigger turns out wrong on staging, this reverts alone.

### T5 — Tests
- **File:** `client/src/lib/layout/__tests__/loadVariation.spec.ts` (9 existing assertions),
  plus new coverage per the TC table
- **Type:** `test` · **AC(s):** AC5, AC6, all TCs
- **TC-EDIT-009-03 is the one that matters.** `CanvasEditToolbar` must still derive editable state
  from the canvas alone. Its comment documents a real bug — a freshly opened template claiming to
  be editable after an unrelated compose — and this story deletes code all around it.

---

## Task Checklist

- [x] T0 — Decide the text-free question → **Option A**, 2026-09-01
- [x] T1 — Remove the toggle from AIChatBox
- [x] T2 — Remove renderMode from RightSidebar
- [x] T3 — Drop it from the client contract
- [x] T4 — Retire the server parameter
- [x] T4a — Re-trigger the text-free path from the photo
- [x] T5 — Tests
- [x] Gate 1 passes
- [ ] Gate 2 — staging visual check (generate → no mode choice → Edit elements works)
- [ ] Gate 2 — staging real-photo check: generate from an uploaded listing photo, confirm the
      background comes back **unmarked** (T4a's whole point)
- [x] US-AI-051 banner updated to record the resolution; status stays ✅
- [x] PR opened — #49
- [x] STORY.md ACs ticked off — AC1–AC9, with AC4/AC5/AC6 annotated where the AC as written was
      wrong or unachievable; see the story's Follow-ups for what was deliberately left undone
- [x] **Re-hardened 2026-09-02** — lock b0587df27888, 9 ACs. Fixed AC9's label first: the colon
      sat outside the bold span, which made ac-audit skip it silently (filed BL-16).
