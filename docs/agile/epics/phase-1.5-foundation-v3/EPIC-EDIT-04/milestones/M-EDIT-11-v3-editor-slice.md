# M-EDIT-11-v3-editor-slice — Opt-in V3 editor vertical slice

> **Epic:** [EPIC-EDIT-04](../EPIC.md)
> **Feature:** N/A — validation slice
> **Status:** 🟡 Implemented and locally verified — delivery pending
> **Target date:** Not committed; validate effort after first working slice.
> **Branch:** `feat/edit/m-11-v3-editor-slice`

---

## Goal

An authenticated agent can open an existing saved design, edit text, undo/redo, save to the same server record, reload and export PNG in a fresh V3 shell while the current editor remains the default.

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-EDIT-031](../stories/US-EDIT-031/STORY.md) | V3 shell: open → edit → save → reload → export | L | harden lock + independent tests | 🟡 locally verified | — |

## Acceptance (Milestone Done When…)

- [x] New V3 composition is visible only with `editor=v3`; current default/auth behaviour is preserved.
- [x] Existing designs retain canvas elements and metadata through text edits and server save/reload.
- [x] Save/load/export failures are visible and retryable; stale responses cannot claim newer work is saved.
- [x] Light/dark desktop visual and browser checks pass, PNG output is verified and authenticated real-server smoke is recorded separately.
- [ ] All stories above have status ✅ Done; applicable gates and independent review pass.

## Notes / Blockers

- Approved first experiment on 2026-10-31. Does not supersede or close US-EDIT-024/028/029/030 or promise full V3 parity; reconcile their remaining scope after reviewing this slice.
- No dependency on unfinished Property, Brand, template or Assistant stories. No production default switch or deployment is part of the slice.
- Milestone number follows the existing EDIT sequence (11); historical global milestone IDs already overlap across domains. Global next-ID mirror remains at least 22.
- Reference mockup is untracked in the primary checkout and supplies composition only.

*Milestone created: 2026-10-31*


## Local verification — 2026-10-31

[US-EDIT-031 verification](../stories/US-EDIT-031/VERIFICATION.md): TypeScript, 1,210 unit tests, 25 browser tests, four painted-artboard/contrast checks, production build and authenticated API/browser/database smoke passed. One existing client skip retained. Opus approved code/security; Gemini whole-milestone verification and human-approved delivery remain pending. The existing editor is still the default.
