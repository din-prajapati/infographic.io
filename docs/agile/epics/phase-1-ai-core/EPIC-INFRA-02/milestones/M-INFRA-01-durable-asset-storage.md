# M-INFRA-01-durable-asset-storage — Durable Asset Storage

> **Epic:** [EPIC-INFRA-02](../EPIC.md)
> **Feature:** F-INFRA-01, F-INFRA-02
> **Status:** 🔲 Not Started
> **Target date:** before US-LAUNCH-005 AC6 (real ₹ transaction)
> **Branch:** `feat/infra/m-01-durable-asset-storage`

---

## Goal

Every generated infographic image, composed-design variant, and user-uploaded source photo lands
in a Cloudflare R2 bucket Buildographic owns — not on Ideogram's expiring CDN and not on the
NestJS container's ephemeral tmp dir — verified end-to-end on staging.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-INFRA-001](../stories/US-INFRA-001/STORY.md) | R2 bucket + StorageService | S | — | 🔲 | — |
| 2 | [US-INFRA-002](../stories/US-INFRA-002/STORY.md) | Persist generated images to owned storage | M | US-INFRA-001 | 🔲 | — |
| 2 | [US-INFRA-003](../stories/US-INFRA-003/STORY.md) | Move source-photo uploads off the ephemeral tmp dir | S | US-INFRA-001 | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] `Infographic.imageUrl` for a newly-created generation points at the owned R2 domain
      (`assets.buildographic.com`), not `ideogram.ai`
- [ ] The `composedDesigns` cache (US-AI-048) keys off and serves the owned URL for new writes
- [ ] A source-photo upload survives a mid-generation Railway container restart
- [ ] Verified live: an infographic generated through this pipeline still renders after its
      original Ideogram URL would have expired (simulate by revoking/ignoring the Ideogram URL and
      confirming the app serves the R2 copy)
- [ ] All stories above have status ✅ Done
- [ ] Verification gates pass (Gate 1 mandatory; Gate 4 API smoke for the backend changes)

---

## Notes / Blockers

- Gates the M-LAUNCH-02 revenue-on flip (`BETA_MODE=false`) — see
  [PHASE_TRACKER.md](../../../../PHASE_TRACKER.md) and
  [LAUNCH_TIMELINE.md §5](../../../../LAUNCH_TIMELINE.md). Not itself part of M-LAUNCH-02's story
  list — a separate epic/milestone whose completion is a precondition US-LAUNCH-005 AC6 should
  check before running the real ₹ transaction.
- Requires a Cloudflare account + R2 bucket provisioned (US-INFRA-001, HUMAN task: create the
  bucket and API token — Claude cannot self-provision third-party cloud credentials).
- No Prisma schema migration needed — `Infographic.imageUrl` stays a `String` column; only its
  *source* changes.
- Backfilling pre-existing `Infographic` rows (already pointing at Ideogram URLs) is explicitly out
  of scope for this milestone — see EPIC.md "Out of Scope."

---

*Milestone created: 2026-08-19*
