---
title: Phase Tracker — {Project Name} Delivery
type: template
tags: [orion, template]
updated: 2026-05-20
---

# Phase Tracker — {Project Name} Delivery

> **Audience:** Executives, product owners, stakeholders
> **Purpose:** Single-page view of delivery progress across all product phases
> **Update cadence:** After each milestone closes or phase gate decision
> **Last updated:** YYYY-MM-DD

---

## Phase Overview — At a Glance

| Phase | Release | Business Outcome | Status | Complete | Target |
|-------|---------|-----------------|--------|:--------:|--------|
| [Phase 0](#phase-0--{slug}) | v1.0 | {outcome} | 🔲 | 0% | TBD |
| [Phase 1](#phase-1--{slug}) | v1.1 | {outcome} | 🔲 | 0% | TBD |
| [Phase 2](#phase-2--{slug}) | v1.2 | {outcome} | 🔲 | 0% | TBD |

**Current Focus:** {1-line statement of what the team is actively delivering}

---

## Phase Gates

Each phase requires a gate decision before the next phase starts.

| Gate | Criteria | Owner | Status |
|------|----------|-------|:------:|
| **G0 → G1** | {What must be true to leave Phase 0} | {name} | 🔲 |
| **G1 → G2** | | | 🔲 |
| **G2 → G3** | | | 🔲 |

---

## Phase 0 — {Slug}

> **Release:** v1.0 · **Status:** 🔲 Not Started · **Outcome:** {one sentence}
> **Last updated:** YYYY-MM-DD · **Timeline:** {dates}

### Gate Criteria (Phase 0 → Done)
- [ ] {Specific criterion 1}
- [ ] {Specific criterion 2}
- [ ] {Specific criterion 3}

### Epics in Phase 0

| Epic | Domain | Focus | Status | Stories | Notes |
|------|--------|-------|:------:|:-------:|-------|
| [EPIC-{D}-{NN}](epics/phase-0-{slug}/EPIC-{D}-{NN}/EPIC.md) | {D} | {focus} | 🔲 | 0/0 | |

### Completion Rollup

| Category | Done | Total | % |
|----------|:----:|:-----:|:-:|
| Stories | 0 | 0 | — |
| Milestones | 0 | 0 | — |
| Epics | 0 | 0 | — |
| Manual QA | 0 | 0 | — |
| Auto E2E | 0 | 0 | — |
| **Overall Phase 0** | — | — | **0%** |

---

## Phase 1 — {Slug}

> **Release:** v1.1 · **Status:** 🔲 Not Started
> **Gate criteria (Phase 0 → Phase 1):** {What must be true to enter Phase 1}

### Planned Epics

| Epic | Domain | Focus | Status |
|------|--------|-------|:------:|
| EPIC-{D}-{NN} | {D} | {focus} | 🔲 Plan |

### Scope Summary (from PRD)

| # | Feature | Domain | Effort |
|---|---------|--------|--------|
| 1.1 | {feature} | {domain} | {N}h |
| 1.2 | {feature} | {domain} | {N}h |

---

## Phase 2 — {Slug}

> **Release:** v1.2 · **Status:** 🔲 Not Started

### Planned Epics

| Epic | Domain | Focus | Status |
|------|--------|-------|:------:|
| EPIC-{D}-{NN} | {D} | {focus} | 🔲 Plan |

---

## Phase {N} — Backlog

> Items intentionally deferred. Promote to active delivery by business trigger, not calendar.

| ID | Item | Domain | Effort | Trigger |
|----|------|--------|--------|---------|
| B-01 | {item} | {domain} | {N}d/wk | {what would promote this} |

---

## How Phase % Is Calculated

```
Phase % = (Stories with status ✅ Done) / (Total stories in phase) × 100
```

For phases without epics yet created in `docs/agile/epics/`, use the planned epic count from the relevant PRD section.

---

## How to Update This Document

1. **When a story closes:** `/close-story` cascades automatically.
2. **When a milestone closes:** Update the epic's milestone table → recalculate phase %.
3. **When an epic closes:** Update the epic row in the relevant phase → update "Complete %" at top.
4. **When a phase gate passes:** Tick gate criteria → move "Current Focus" to next phase.
5. **When planning a new phase:** Fill in "Planned Epics" + "Scope Summary" + run `/new-epic`.

---

*See also: [AGILE_INDEX.md](AGILE_INDEX.md) · [TEAM_STATUS.md](TEAM_STATUS.md) · [ROADMAP.md](ROADMAP.md)*
