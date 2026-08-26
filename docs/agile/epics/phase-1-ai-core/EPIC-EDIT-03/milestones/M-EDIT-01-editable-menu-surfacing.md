---
title: M-EDIT-01-editable-menu-surfacing — Editable Menu Surfacing
type: milestone
tags: [orion, edit, ui]
updated: 2026-08-26
---

# M-EDIT-01-editable-menu-surfacing — Editable Menu Surfacing

> **Epic:** [EPIC-EDIT-03](../EPIC.md)
> **Status:** 🟡 In Progress — its only story (US-EDIT-005) is merged and live-verified;
> the milestone stays open solely on that story's AC4, which is blocked on a backend
> response-shape change (see EPIC.md Blockers).
> **Target date:** TBD
> **Branch:** `feat/edit/m-01-editable-menu-surfacing`

---

## Goal

The editable-design capability is visible and understandable to a customer before they generate
anything, using the existing, working `renderMode` toggle relocated and relabeled — no new backend
behavior.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-EDIT-005](../stories/US-EDIT-005/STORY.md) | Floating "Edit elements" control on the canvas | M | US-PAY-103 (quota badge only) | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] Editable-mode entry point is visible in the editor before any generation exists
- [ ] Existing renderMode toggle behavior, compose pipeline, and upgrade-gate messaging are all
      unchanged — this is placement/labeling only
- [ ] Story above has status ✅ Done
- [ ] Gate 1 + Gate 2 (frontend) pass

---

## Notes / Blockers

- **Revised 2026-08-21**: no longer fully independent. The quota badge (real remaining-editable
  count) needs `US-PAY-103`'s `getEditableUsageQuota()` (`EPIC-PAY-05`, not built yet). Everything
  else in this story — the floating control itself, loading/cache states, credit-charge
  confirmation, upgrade prompt — has no dependency and can proceed regardless.
- Still fully independent of `EPIC-INFRA-02`.

---

*Milestone created: 2026-08-21*
