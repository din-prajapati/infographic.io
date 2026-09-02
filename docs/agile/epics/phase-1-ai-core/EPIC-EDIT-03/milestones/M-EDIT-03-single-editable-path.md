---
title: Milestone — Single Editable Path
type: milestone
domain: EDIT
created: 2026-09-01
---

# M-EDIT-03-single-editable-path — Single Editable Path

> **Epic:** [EPIC-EDIT-03](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** TBD
> **Branch:** `feat/edit/m-03-single-editable-path`

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

- [ ] No UI anywhere lets a user choose flat vs editable *before* generating
- [ ] `renderMode` no longer exists in the client→server contract
- [ ] `CanvasEditToolbar`'s behaviour is unchanged, verified by its existing tests
- [ ] The real-photo text-free question (§Open Questions in the story) is decided and recorded,
      not left implicit

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
