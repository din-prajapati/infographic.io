# M-LAUNCH-02-revenue-on — Revenue On (Live Payments)

> **Epic:** [EPIC-LAUNCH-01](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** 2026-08-15 · **Flip gated by EPIC-AI-06** (real-photo pipeline) — prep stories can run earlier in parallel

---

## Goal

The first real rupee can be collected defensibly: live RazorPay checkout → webhook → ACTIVE subscription → receipt email, with no dead BROKERAGE checkout path and metering codified at 1 generation = 1 credit.

---

## Stories in this Milestone

| Order | Story | Title | Blocked By | Status | PR |
|:-----:|-------|-------|------------|--------|----|
| 1 | [US-LAUNCH-005](../stories/US-LAUNCH-005/STORY.md) | RazorPay live-mode activation | US-LAUNCH-001 | 🔲 | — |
| 1 | [US-LAUNCH-007](../stories/US-LAUNCH-007/STORY.md) | BROKERAGE tier gate on pricing page (PT-06) | — | 🔲 | — |
| 1 | [US-LAUNCH-008](../stories/US-LAUNCH-008/STORY.md) | Metering policy guard (1 generation = 1 credit) | — | 🔲 | — |
| 2 | [US-LAUNCH-006](../stories/US-LAUNCH-006/STORY.md) | Payment receipt email on subscription charge | US-LAUNCH-002 | 🔲 | — |

> US-LAUNCH-006 and US-LAUNCH-007 both touch `payments.service.ts` (cluster C2) — `orion run next` will correctly withhold 006 from PARALLEL-ELIGIBLE while 007 is in progress even though there's no formal Blocked-By between them; that's the file-overlap engine working as designed, not a bug.

---

## Acceptance (Milestone Done When…)

- [ ] One real ₹ subscription purchased on production with live keys, confirmed ACTIVE via webhook, receipt email received — then refunded
- [ ] Production boots refuse `rzp_test_*` keys (startup assert)
- [ ] Pricing page shows no checkout button for any tier lacking configured live plan IDs
- [ ] Metering policy documented + unit-test guarded
- [ ] **EPIC-AI-06 shipped** — `BETA_MODE` may only be turned off after real-photo pipeline is live (an agent must be able to market their *actual* listing before we charge them)
- [ ] All stories above have status ✅ Done

---

## Notes / Blockers

- **RazorPay live activation review requires US-LAUNCH-001 pages live** (business website with terms/privacy/refund policy) — sequence M-LAUNCH-01 first.
- US-LAUNCH-005 is mostly HUMAN ops (dashboard KYC, plan creation, env vars); only the startup assert is code.
- US-LAUNCH-006 depends on US-LAUNCH-002 (EmailService).
- Live plans must be **re-created** in the live dashboard — test-mode plans do not carry over.

---

*Milestone created: 2026-07-07*
