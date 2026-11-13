---
title: M-EDIT-09-v3-shell — V3 editor shell and tabs
type: milestone
tags: [orion, milestone, phase-1.5]
updated: 2026-10-29
---

# M-EDIT-09-v3-shell — V3 editor shell and tabs

> **Epic:** [EPIC-EDIT-04](../EPIC.md)
> **Status:** 🟡 In Progress — approved shell integration on dependent V3 foundation branch; verification and merge pending.
> **Target date:** TBD (Phase 1.5 sequence — see the [phase README](../../README.md))

---

## Reconciled integration scope — 2026-11-13

**Sequence:** Existing US-EDIT-024/027 foundation → US-EDIT-025.

Use approved Listing/Agent/Brand navigation and overview with manual photos, structured pricing and reviewed paste. Basic 375px/1440px access is included; SVG export remains excluded. No Contact rename or AI Assistant implementation.

The reconciled story cards supersede conflicting historical acceptance/dependency notes below for this delivery. Historical rows are retained for traceability, not as claims of completion. Done requires actual scoped AC evidence and gates; deferred siblings do not become Done.

## Goal

Apply the approved editor skeleton and Navy/Teal light/dark themes to the working opt-in V3 slice: top bar, seven-item rail, floating Tools, proximity formatting, footer Layers/settings/zoom, separate Property and Agent panels, and acknowledged autosave. The approval supersedes the earlier guide bar, top-bar Assistant and rail Layers placement. See [the approved integration contract](../../../../../../Mockups/approved-v3-editor/INTEGRATION_PLAN.md).

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-EDIT-024](../stories/US-EDIT-024/STORY.md) | Approved editor shell and existing capability adapters | L | US-EDIT-031 foundation | 🟡 | — |
| 2 | [US-EDIT-027](../stories/US-EDIT-027/STORY.md) | Autosave and save status | M | US-EDIT-024 (status slot) | 🟡 | — |
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
- US-EDIT-025's broader paste-first/Brand-profile/CTA contract remains pending. Existing Property/Agent forms are reachable through US-EDIT-024; this does not complete US-EDIT-025 or rename the approved Agent rail entry.

---

*Milestone created: 2026-10-29*
