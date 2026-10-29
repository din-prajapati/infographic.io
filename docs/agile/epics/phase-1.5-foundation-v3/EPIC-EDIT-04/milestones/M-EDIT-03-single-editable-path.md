---
title: Milestone — Single Editable Path
type: milestone
domain: EDIT
created: 2026-09-01
---

# M-EDIT-03-single-editable-path — Single Editable Path

> **Epic:** [EPIC-EDIT-04](../EPIC.md) — moved 2026-10-29 from EPIC-EDIT-03 (Phase 1). See [ADR-003](../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md).
> **Status:** ✅ **Done — closed 2026-10-29.** US-EDIT-009 merged via [PR #49](https://github.com/din-prajapati/infographic.io/pull/49); Gate 2 steps 1, 3, 4 and 5 re-run on staging 2026-10-29 (`b2cac42`), all passing. Step 5 now attaches a real listing photo (BL-26) and asserts `photoReference` on the generate request and `composition: "background"` on every variation; the saved background is the uploaded photo with no baked-in text (evidence `test-results/gate2-evidence/us-edit-009-step5-background-2026-10-29T11-33-02-916Z.png`).
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
| 1 | [US-EDIT-009](../stories/US-EDIT-009/STORY.md) | Remove the pre-placement Flat/Editable toggle | M | — | ✅ | [#49](https://github.com/din-prajapati/infographic.io/pull/49), [#82](https://github.com/din-prajapati/infographic.io/pull/82) |

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

**Closeout checks — all done 2026-10-29:**

- [x] **Gate 2, step 3** — ✅ **PASSED 2026-09-07** against local dev, on the real AI Chat path.
      `e2e/us-edit-009-gate2.spec.ts` drove a live AI Chat generation, clicked "Edit elements", and
      the compose request went out with a real generation id (not the `current-gen` placeholder
      US-EDIT-005 once shipped), returned 201, and reached "Editable layers active" in 52s. The
      *"Design isn't linked to a generation"* toast never appeared. Step 1 and step 4 passed in the
      same run. **M-INFRA-01 check 1 also cleared incidentally:** all 3 variation URLs were stored
      on `pub-…​.r2.dev`, i.e. storage we own, not an expiring provider URL.
      Two assertions in the spec had to be corrected first — neither weakened, both wrong:
      the BL-21 progress check demanded a ticking label unconditionally (it samples only *after*
      `await request.response()`, so on a run whose compose round trip took 37s the label was
      already terminal), and its follow-up recognised only `Separating layers…` while
      `CanvasEditToolbar.tsx:232` also emits `Still working… Ns` on a long wait. Recorded in the
      spec: BL-21's real behaviour — does the wait narrate itself *while the user waits* — is still
      not covered, because the sampling window opens after the request completes.
- [x] **Gate 2, step 5** — ✅ **PASSED 2026-10-29 on staging** after BL-26: a real listing photo, `photoReference` on the request, `composition: "background"` on every variation, background visually text-free. *Original note:* a real listing photo must generate an **unmarked** background. This is
      the one behaviour change that reaches users who never touched the old toggle.
      ⚠️ **Still open, and the test cannot close it — see [BL-26](../../../../BACKLOG.md).** Run
      2026-09-07 with `RUN_PHOTO_CHECK=1`: the test passes, but `generateFromAiChat()` only fills
      the chat textarea — **no photo is ever uploaded**, so `photoReference` is never set. Since
      this story settled *Option A* (the text-free prompt triggers on `photoReference` alone), the
      text-free prompt correctly does not fire, and the fully-composed background the run produced
      is the **expected** output for a text-only generation, not a defect. The step therefore
      cannot fail for the reason it exists — nor pass for it. The captured evidence
      (`test-results/gate2-evidence/`) documents the text-only path only.
- [x] Closed 2026-10-29 (manual cascade — the hook is BL-48) once both pass, to cascade STORY → milestone → epic →
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
