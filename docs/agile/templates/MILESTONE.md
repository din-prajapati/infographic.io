---
title: M-{DOMAIN}-{NN}-{slug} — {Short Milestone Title}
type: template
tags: [orion, template]
updated: 2026-05-21
---

# M-{DOMAIN}-{NN}-{slug} — {Short Milestone Title}

> **Epic:** [EPIC-{DOMAIN}-{NN}](../EPIC.md)
> **Feature:** F-{DOMAIN}-{NN} (if feature level used)
> **Status:** 🔲 Not Started | 🟡 In Progress | ✅ Done
> **Target date:** YYYY-MM-DD

---

## Goal

{One sentence — what is shippable/demonstrable when this milestone closes}

---

## Stories in this Milestone

> **Reading the table:**
> - **Order** — work-execution order within this milestone. `1` is the first story to start;
>   ties indicate stories that can be done in parallel.
> - **Blocked By** — explicit dependencies on other stories (use the US-ID). Leave `—` if free to start.
> - Status is the per-story state from STORY.md (do not edit here — keep both in sync via `/close-story`).

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-{DOMAIN}-{NNN}](../stories/US-{DOMAIN}-{NNN}/STORY.md) | {title} | M | — | 🔲 | — |
| 2 | [US-{DOMAIN}-{NNN}](../stories/US-{DOMAIN}-{NNN}/STORY.md) | {title} | M | US-{prev} | 🔲 | — |
| 2 | [US-{DOMAIN}-{NNN}](../stories/US-{DOMAIN}-{NNN}/STORY.md) | {title} | S | US-{prev} | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] {Specific outcome 1}
- [ ] {Specific outcome 2}
- [ ] All stories above have status ✅ Done
- [ ] Verification gates pass for affected domains

---

## Notes / Blockers

- {Any dependency, risk, or prerequisite for this milestone}
- {Cross-epic dependencies — reference {EPIC-ID} or {US-ID} explicitly}

---

*Milestone created: YYYY-MM-DD*
