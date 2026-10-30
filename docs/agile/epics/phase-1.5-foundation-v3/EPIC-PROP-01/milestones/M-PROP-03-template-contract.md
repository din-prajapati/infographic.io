---
title: M-PROP-03-template-contract — Template contract
type: milestone
tags: [orion, milestone, phase-1.5]
updated: 2026-10-29
---

# M-PROP-03-template-contract — Template contract

> **Epic:** [EPIC-PROP-01](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** TBD (Phase 1.5 sequence — see the [phase README](../../README.md))

---

## Goal

Every text element carries an explicit link type, and templates carry a version and a proven mark — the contract kits will be built on.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-PROP-004](../stories/US-PROP-004/STORY.md) | Element binding types on the template contract | M | — | 🔲 | — |
| 1 | [US-PROP-005](../stories/US-PROP-005/STORY.md) | Template version and proven flag | S | — | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] Every curated template element has an explicit binding
- [ ] The API stores, returns and keeps (across re-saves) the template a design came from; the client starts sending it in US-EDIT-022
- [ ] All stories above have status ✅ Done
- [ ] Verification gates pass for affected domains

---

## Notes / Blockers

- US-PROP-004 is a prerequisite of the linking UI (US-EDIT-020); US-PROP-005 of the Look picker (US-EDIT-022).
- **Shared files with M-PROP-01 — sequence, don't run in parallel:**
  - US-PROP-005 edits `designs.service.ts` and `create-design.dto.ts`, which US-PROP-001 also edits (the cross-org `propertyId` guard). Start US-PROP-005 after US-PROP-001 merges, and rebase.
  - US-PROP-004 edits `listingBindings.ts`, which US-PROP-007 and US-PROP-003 also edit. Start US-PROP-004 after US-PROP-003 merges (or rebase onto whichever merged last).
- Within this milestone, US-PROP-004 and US-PROP-005 share only `api/scripts/data/premium-templates.data.ts` — merge one, rebase the other.

---

*Milestone created: 2026-10-29*
