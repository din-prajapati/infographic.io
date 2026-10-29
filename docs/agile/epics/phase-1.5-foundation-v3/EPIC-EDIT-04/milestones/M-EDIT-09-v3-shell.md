---
title: M-EDIT-09-v3-shell — V3 editor shell and tabs
type: milestone
tags: [orion, milestone, phase-1.5]
updated: 2026-10-29
---

# M-EDIT-09-v3-shell — V3 editor shell and tabs

> **Epic:** [EPIC-EDIT-04](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** TBD (Phase 1.5 sequence — see the [phase README](../../README.md))

---

## Goal

The editor looks and reads like V3 — top bar, guide bar, canvas header, tool rail, Property and Contact tabs — in both light and dark themes, and saves on its own.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-EDIT-024](../stories/US-EDIT-024/STORY.md) | Editor shell in the V3 layout, light and dark | L | — | 🔲 | — |
| 2 | [US-EDIT-027](../stories/US-EDIT-027/STORY.md) | Autosave and save status | M | US-EDIT-024 (status slot) | 🔲 | — |
| 3 | [US-EDIT-025](../stories/US-EDIT-025/STORY.md) | Property and Contact tabs in the V3 layout | M | US-EDIT-022, US-PROP-002/003, US-AI-028 | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] Every new surface passes in light **and** dark (contrast ≥ 4.5:1, no hard-coded colours)
- [ ] No editor tool is lost
- [ ] Autosave never overwrites newer work
- [ ] All stories above have status ✅ Done
- [ ] Verification gates pass for affected domains

---

## Notes / Blockers

- Merge order on shared files: US-EDIT-024 → US-EDIT-022 → US-EDIT-025.
- Phone layout and SVG export stay out of scope.

---

*Milestone created: 2026-10-29*
