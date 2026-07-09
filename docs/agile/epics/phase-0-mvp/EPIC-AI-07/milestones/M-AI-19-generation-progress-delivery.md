# M-AI-19-generation-progress-delivery — Fix Frozen Progress UI

> **Epic:** [EPIC-AI-07](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** 2026-07-11

---

## Goal

A real generation on staging renders its result cards in the browser within 30 seconds of the backend completing — every time, not just when a page reload happens to catch it.

---

## Stories in this Milestone

| Story | Title | Status | PR |
|-------|-------|--------|----|
| [US-AI-034](../stories/US-AI-034/STORY.md) | Diagnose and fix generation-progress delivery on staging | 🟡 Fix in code + locally verified; staging re-test pending deploy | — |
| [US-AI-035](../stories/US-AI-035/STORY.md) | Client-side fallback re-sync for stalled progress UI | ⏭️ Superseded by US-AI-034 | — |

---

## Acceptance (Milestone Done When…)

- [ ] Root cause of the staging delivery gap is documented (in US-AI-034's STORY.md or a linked ADR)
- [ ] 3 consecutive real generations against staging each render results within 30s of backend `gen:complete` — re-verified using the same live-pass method as the 2026-07-09 discovery session
- [ ] A generation that somehow still misses its live-update event self-heals via REST poll within a bounded time (US-AI-035), so no single delivery mechanism failure can strand a user again
- [ ] All stories above have status ✅ Done

---

## Notes / Blockers

- **Blocks:** Task 2 sign-off (`docs/testing/PHASE_0_HUMAN_QA_CHECKLIST.md`) → Task 3 production go-live → M-LAUNCH-01 beta-live gate. This is the critical path right now.
- Root cause is genuinely unknown going in — US-AI-034's ACs are written outcome-first (does the UI update in time?) rather than prescribing the fix, since it could be Railway's WS proxy config, a wrong socket host on staging, a stale closure over `generationId`, or a React state-batching issue. Investigate before committing to a fix approach.
- Real-money cost note: verifying this fix requires real Ideogram generations (like the discovery session did, $0.184 × 3 ≈ $0.55) — budget for at least one more live-pass round after the fix lands.

---

*Milestone created: 2026-07-09*
