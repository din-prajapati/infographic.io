---
title: M-PROP-01-property-record — Property record and structured listing
type: milestone
tags: [orion, milestone, phase-1.5]
updated: 2026-10-29
---

# M-PROP-01-property-record — Property record and structured listing

> **Epic:** [EPIC-PROP-01](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** TBD (Phase 1.5 sequence — see the [phase README](../../README.md))

---

## Goal

A listing is a saved Property with structured price and Sale/Rent intent, filled by typing or by pasting a message and reviewing what was found.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-PROP-001](../stories/US-PROP-001/STORY.md) | Property as a saved record (backend) | M | — | 🔲 | — |
| 2 | [US-PROP-006](../stories/US-PROP-006/STORY.md) | Property as a saved record (client) | M | US-PROP-001 | 🔲 | — |
| 2 | [US-PROP-002](../stories/US-PROP-002/STORY.md) | Structured price: parser, schema and generation | M | US-PROP-001 | 🔲 | — |
| 3 | [US-PROP-007](../stories/US-PROP-007/STORY.md) | Listing intent and price in the editor — *split from US-PROP-002 on 2026-10-30* | M | US-PROP-002 | 🔲 | — |
| 4 | [US-PROP-003](../stories/US-PROP-003/STORY.md) | Auto-Fill from a listing message, with review | M | US-PROP-002, US-PROP-007 | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] Two designs on one Property show the same facts
- [ ] A rental shows FOR RENT and its period on canvas and in a generated poster
- [ ] A pasted message fills only the facts the agent ticks
- [ ] All stories above have status ✅ Done
- [ ] Verification gates pass for affected domains

---

## Notes / Blockers

- US-PROP-006 and US-PROP-002 both start after US-PROP-001 and can run in parallel; both touch `usePropertyStore.ts`, so merge US-PROP-006 first. US-PROP-003 follows US-PROP-002.
- US-PROP-001 and US-PROP-002 each add a Prisma migration (in that order); US-PROP-001 — runs as the Railway `preDeployCommand`; staging DB is the dev DB (BL-37).

---

*Milestone created: 2026-10-29*
