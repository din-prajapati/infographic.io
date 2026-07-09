# M-LAUNCH-01-public-beta — Public Free Beta Live

> **Epic:** [EPIC-LAUNCH-01](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** 2026-07-21

---

## Goal

A real estate agent who is a total stranger can sign up on production, generate infographics on the FREE tier, recover a forgotten password by email, and read Terms/Privacy/Refund pages — while paid checkout is cleanly disabled behind a single beta flag and every generation result carries an AI-content disclaimer.

---

## Stories in this Milestone

| Order | Story | Title | Blocked By | Status | PR |
|:-----:|-------|-------|------------|--------|----|
| 1 | [US-LAUNCH-001](../stories/US-LAUNCH-001/STORY.md) | Legal & policy pages (Terms · Privacy · Refund) | — | 🔲 | — |
| 1 | [US-LAUNCH-002](../stories/US-LAUNCH-002/STORY.md) | Transactional email foundation | — | 🔲 | — |
| 1 | [US-LAUNCH-004](../stories/US-LAUNCH-004/STORY.md) | Beta launch mode | — | 🔲 | — |
| 2 | [US-LAUNCH-003](../stories/US-LAUNCH-003/STORY.md) | Forgot / reset password flow | US-LAUNCH-002 | 🔲 | — |

> **Order** = wave. Same order = no known file overlap, safe to run in parallel worktrees. **Blocked By** = genuine logical dependency (must be ✅ Done, not just merged-and-mergeable). File-overlap safety within an order is verified automatically by `orion run next M-LAUNCH-01`, not by this column.

---

## Acceptance (Milestone Done When…)

- [ ] `/terms`, `/privacy`, `/refund-policy` are live on production and linked from the footer
- [ ] A password-reset email arrives in a real inbox from production and the reset link works
- [ ] With `BETA_MODE=true`, no paid checkout can be initiated from UI **or** API
- [ ] AI-content disclaimer visible on generation results/export
- [ ] All stories above have status ✅ Done

---

## Notes / Blockers

- **Blocked by:** EPIC-INFRA-01 — the 3 Phase 0 HUMAN deploy tasks. There is no production URL to put these pages on until that closes.
- US-LAUNCH-003 depends on US-LAUNCH-002 (EmailService must exist first).
- Legal page *content* needs a human review pass before go-live (drafted text is not legal advice).
- This milestone is deliberately revenue-free: the synthetic-photo limitation (fixed by EPIC-AI-06) is a disclosed beta limitation, not a mis-sold product.

---

*Milestone created: 2026-07-07*
