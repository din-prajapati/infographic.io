# M-DEPLOY-01 — Velocity Foundation

> **Epic:** [EPIC-DEPLOY-01](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target:** rolling / post-beta (non-blocking)
> **Demo-able outcome:** open a PR → green CI in <10 min → click a live preview URL → merge → staging → flip a flag to release.

---

## 🚦 Non-blocking to beta

This milestone runs **in parallel** with the live public beta. The beta ships on the existing merge→staging /
tag→production pipeline once [PHASE_0_HUMAN_QA_CHECKLIST.md](../../../../testing/PHASE_0_HUMAN_QA_CHECKLIST.md)
Task 3 is signed off. No story here gates go-live.

---

## Stories

| Story | Title | Size | Est. | Status |
|-------|-------|------|------|--------|
| [US-DEPLOY-001](../stories/US-DEPLOY-001/STORY.md) | Harden the CI gate | S | 0.5 d | 🔲 |
| [US-DEPLOY-002](../stories/US-DEPLOY-002/STORY.md) | Preview environment per PR | L | 1.5 d | 🔲 |
| [US-DEPLOY-003](../stories/US-DEPLOY-003/STORY.md) | Feature-flag mechanism | S | 0.5 d | 🔲 |
| [US-DEPLOY-004](../stories/US-DEPLOY-004/STORY.md) | Production migration workflow | M | 1 d | 🔲 |
| [US-DEPLOY-005](../stories/US-DEPLOY-005/STORY.md) | Progressive delivery + auto-rollback | M | 1 d | 🔲 |

**Recommended order:** 001 → 003 → 002 → 004 → 005.

---

## Acceptance (milestone)

- [ ] CI gate mandatory + fast (US-DEPLOY-001)
- [ ] Preview URL per PR with prod-shaped data (US-DEPLOY-002)
- [ ] One feature released via flag flip (US-DEPLOY-003)
- [ ] `migrate deploy` + baseline migration live (US-DEPLOY-004)
- [ ] Canary auto-rollback drill passed (US-DEPLOY-005)

---

*Milestone created: 2026-07-13*
