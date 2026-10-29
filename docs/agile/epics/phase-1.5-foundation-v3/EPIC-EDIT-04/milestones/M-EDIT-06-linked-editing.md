---
title: M-EDIT-06-linked-editing — Linked editing and export review
type: milestone
tags: [orion, milestone, phase-1.5]
updated: 2026-10-29
---

# M-EDIT-06-linked-editing — Linked editing and export review

> **Epic:** [EPIC-EDIT-04](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** TBD (Phase 1.5 sequence — see the [phase README](../../README.md))

---

## Goal

The agent can see and change what every text element is linked to, and Export refuses a design with missing or out-of-date facts.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-EDIT-020](../stories/US-EDIT-020/STORY.md) | Linked-element inspector and Manage links | M | US-PROP-004, US-PROP-002 | 🔲 | — |
| 2 | [US-EDIT-021](../stories/US-EDIT-021/STORY.md) | Export review dialog and out-of-date image guard | M | US-EDIT-020 | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] Detach / reconnect works and is undoable
- [ ] Export blocks a missing price, a placeholder and an out-of-date poster
- [ ] All stories above have status ✅ Done
- [ ] Verification gates pass for affected domains

---

## Notes / Blockers

- Gate 2 browser checks on staging for both stories.

---

*Milestone created: 2026-10-29*
