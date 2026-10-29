---
title: Milestone — Organization Roles
type: milestone
domain: ORG
created: 2026-08-31
---

# M-ORG-01-organization-roles — Organization Roles

> **Epic:** [EPIC-ORG-01](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** TBD — see "When to schedule" below
> **Branch:** `feat/org/m-01-organization-roles`

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-ORG-001](../stories/US-ORG-001/STORY.md) | Organization roles + permission enforcement | M | — | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] A member who is not OWNER or ADMIN cannot invite, add, or remove anyone — verified by test,
      per endpoint, per role
- [ ] The OWNER cannot be removed by anyone, including another OWNER-equivalent
- [ ] Every existing organisation has exactly one OWNER after the backfill migration, verified by
      a query against real data, not asserted
- [ ] Ownership can be transferred, so a departing owner does not strand the account

---

## When to schedule

**Not urgent by calendar; urgent by cost curve.** Nothing is broken for anyone today because no
organisation has a second member. The moment one does, two things change: the vulnerability
acquires a victim, and the backfill stops being trivial.

Concretely, the trigger is **the first multi-seat account** — a TEAM or AGENCY subscription where
someone accepts an invite. Landing this before that point is the cheap path.

---

## Notes / Blockers

- **No blockers.** The story is buildable now; nothing external gates it.
- **The backfill is the risky part**, not the enum. A `MEMBER` default with no backfill leaves
  every organisation with no owner — strictly worse than today, because then nobody could invite
  anyone. `Subscription.userId` gives the principled rule: the person being billed becomes the
  person in control.
