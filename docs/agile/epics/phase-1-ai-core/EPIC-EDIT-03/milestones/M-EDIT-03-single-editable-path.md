---
title: Milestone — Single Editable Path
type: milestone
domain: EDIT
created: 2026-09-01
---

# M-EDIT-03-single-editable-path — Single Editable Path

> **Epic:** [EPIC-EDIT-03](../EPIC.md)
> **Status:** 🟡 **Code merged, milestone not closed** — US-EDIT-009 merged via
> [PR #49](https://github.com/din-prajapati/infographic.io/pull/49) (2026-09-02, rebase), Gate 1
> green. Gate 2 is a human visual check and has **not** been run; two of its five steps cover
> behaviour no unit test reached. See the story's Gate 2 checklist.
> **Target date:** TBD
> **Branch:** `feat/edit/m-03-single-editable-path` (merged, deleted)

---

## Why this milestone exists

`M-EDIT-01` shipped `CanvasEditToolbar` — extracting text into editable layers as an action taken
**after** an image is on the canvas. It did not remove the older surface that does the same thing
**before** generation: the "Edit as: Flat / Editable" toggle in AI Chat.

So the product currently offers two answers to one question, at two different moments. The decision
(2026-09-01) is that generation is **always flat** and extraction is **always a post-placement
action**. This milestone makes the code match that.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-EDIT-009](../stories/US-EDIT-009/STORY.md) | Remove the pre-placement Flat/Editable toggle | M | — | 🟡 | [#49](https://github.com/din-prajapati/infographic.io/pull/49) |

---

## Acceptance (Milestone Done When…)

- [x] No UI anywhere lets a user choose flat vs editable *before* generating — both toggle blocks
      removed from AI Chat, and Quick Generate's mode-dependent load path with them. Verified by
      diff; the rendered result is Gate 2 step 1.
- [x] `renderMode` no longer exists in the client→server contract — with one deliberate exception:
      the generate DTO keeps an ignored, unvalidated, Swagger-hidden shim, because `main.ts` sets
      `forbidNonWhitelisted: true` and deleting the field outright would 400 every generate from a
      stale browser tab. Nothing reads it. Tracked for removal as BL-19.
- [x] `CanvasEditToolbar`'s behaviour is unchanged — **zero lines changed**, verified by diff.
      ⚠️ Not "verified by its existing tests": it has none, because the project has no React test
      harness (BL-20). Covered structurally instead — the session-global `renderMode` its warning
      comment depends on no longer exists to be misused.
- [x] The real-photo text-free question is decided and recorded — **Option A**: the text-free
      prompt now triggers on `photoReference` alone. Recorded in the story's §Decisions and in
      US-AI-051's banner.

**Still open — this is why the milestone is 🟡 and not ✅:**

- [ ] **Gate 2, step 3** — an *AI Chat* generation (not Quick Generate) placed on the canvas must
      extract text on "Edit elements", not report *"Design isn't linked to a generation"*. This is
      the AC9 regression found mid-implementation; the unit test proves the setter works, not that
      AI Chat calls it on the real completion path.
- [ ] **Gate 2, step 5** — a real listing photo must generate an **unmarked** background. This is
      the one behaviour change that reaches users who never touched the old toggle.
- [ ] `orion close-story US-EDIT-009` once both pass, to cascade STORY → milestone → epic →
      TEAM_STATUS.

---

## Notes / Blockers

- **No blockers.** Nothing external gates this.
- **A superseded branch informed it.** `feat/ai/editable-layers-toolbar` (commit `8171fb9`,
  2026-08-25) proposed the same removal, plus a competing mechanism for reaching the generation id
  from the canvas — putting the reference on `ImageElement` rather than in a store. `main` arrived
  at the element-level reference independently (`ImageElement.aiSourceUrl`, `canvasTypes.ts:80`)
  while `US-EDIT-005` used `useGenerationPrefs.activeGenerationId` for the id itself. The branch
  was deleted rather than rebased: its mechanism is already present by another route, and rebasing
  would have re-litigated a design `main` shipped and live-verified. Its reasoning survives in its
  commit message and the `EPIC-AI-06` 2026-08-25 log.
