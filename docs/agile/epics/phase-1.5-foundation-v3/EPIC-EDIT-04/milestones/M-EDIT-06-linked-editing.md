---
title: M-EDIT-06-linked-editing — Linked editing and export review
type: milestone
tags: [orion, milestone, phase-1.5]
updated: 2026-10-29
---

# M-EDIT-06-linked-editing — Linked editing and export review

> **Epic:** [EPIC-EDIT-04](../EPIC.md)
> **Status:** 🟡 2/2 stories implemented locally; release review/UI acceptance/merge pending
> **Target date:** TBD (Phase 1.5 sequence — see the [phase README](../../README.md))

---

## Reconciled integration scope — 2026-11-13

**Sequence:** US-PROP-004 → US-EDIT-020 → US-EDIT-022 → US-EDIT-021.

Use friendly Template Fields with design-only overrides and reviewed actual PNG download. Do not add flat AI poster generation or AI image-guard features outside the approved manual workflow.

The reconciled story cards supersede conflicting historical acceptance/dependency notes below for this delivery. Historical rows are retained for traceability, not as claims of completion. Done requires actual scoped AC evidence and gates; deferred siblings do not become Done.

## Goal

The agent can see and change what every text element is linked to, and Export refuses a design with missing or out-of-date facts.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-EDIT-020](../stories/US-EDIT-020/STORY.md) | Linked-element inspector and Manage links | M | US-PROP-004, US-PROP-002 | 🟡 Implemented locally; review/merge pending | — |
| 2 | [US-EDIT-021](../stories/US-EDIT-021/STORY.md) | Export review dialog and out-of-date image guard | M | US-EDIT-020 | 🟡 Implemented locally; review/merge pending | — |

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


## Current reconciliation — 2026-11-14

2026-11-14 — reconciled from committed Opus baseline3e95a40; implementation present, release hardening/review and UI/font acceptance in progress; not merged Done. Current source and story evidence supersede older status summaries above, including the historical US-EDIT-027 AC4 gap (its card records8/8 implementation ACs). Release-specific template navigation repair remains separately tracked. See docs/research/2026-11-14-V3-RELEASE-HARDENING.md. No formal milestone closure.
