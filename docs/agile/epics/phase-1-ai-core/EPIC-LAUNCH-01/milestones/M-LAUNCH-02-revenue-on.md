# M-LAUNCH-02-revenue-on — Revenue On (Live Payments)

> **Epic:** [EPIC-LAUNCH-01](../EPIC.md)
> **Status:** 🟡 In Progress — RazorPay live-mode approved & keys deployed (US-LAUNCH-005 AC1–4); US-LAUNCH-006/007/008/012/013 implemented and merged to `main` (no PR — see Stories table); real ₹ transaction test (US-LAUNCH-005 AC6) intentionally not yet run
> **Target date:** 2026-08-15 · **Flip gated by EPIC-AI-06** (real-photo pipeline) — prep stories can run earlier in parallel

---

## Goal

The first real rupee can be collected defensibly: live RazorPay checkout → webhook → ACTIVE subscription → receipt email, with no dead BROKERAGE checkout path and metering codified at 1 generation = 1 credit.

---

## Stories in this Milestone

| Order | Story | Title | Blocked By | Status | PR |
|:-----:|-------|-------|------------|--------|----|
| 1 | [US-LAUNCH-005](../stories/US-LAUNCH-005/STORY.md) | RazorPay live-mode activation | US-LAUNCH-001 | 🟡 AC1–4 done, AC5/6 open | — (ops) |
| 1 | [US-LAUNCH-007](../stories/US-LAUNCH-007/STORY.md) | BROKERAGE tier gate on pricing page (PT-06) | — | 🟡 impl, manual TC pending | `fa1d345` |
| 1 | [US-LAUNCH-008](../stories/US-LAUNCH-008/STORY.md) | Metering policy guard (1 generation = 1 credit) | — | 🟡 impl | `aaf3aef` |
| 2 | [US-LAUNCH-006](../stories/US-LAUNCH-006/STORY.md) | Payment receipt email on subscription charge | US-LAUNCH-002 | 🟡 impl, manual TC pending | `fa1d345` |
| 2 | [US-LAUNCH-012](../stories/US-LAUNCH-012/STORY.md) | Payment-failed (dunning) email notification | US-LAUNCH-002 | 🟡 impl, manual TC pending | `fa1d345` |
| 2 | [US-LAUNCH-013](../stories/US-LAUNCH-013/STORY.md) | Subscription renewal reminder email (3-day notice) | US-LAUNCH-002 | 🟡 impl, TC-06/07 pending | `fa1d345`+`5c52dc0` |

> All five implemented stories merged directly to `main` — no PR was opened for any of them (process drift from this repo's own milestone-branch → PR convention; flagged, not yet corrected).

> US-LAUNCH-006, US-LAUNCH-007, and US-LAUNCH-012 all touch `payments.service.ts` (cluster C2) — `orion run next` will correctly withhold parallel eligibility among these three even though there's no formal Blocked-By between them; that's the file-overlap engine working as designed, not a bug. US-LAUNCH-013 touches a new file (`renewal-reminder.service.ts`) + schema + `app.module.ts` — not in cluster C2, safe to run parallel to the other three.

---

## Acceptance (Milestone Done When…)

- [ ] One real ₹ subscription purchased on production with live keys, confirmed ACTIVE via webhook, receipt email received — then refunded (RazorPay live mode itself is approved and ready; this specific transaction is intentionally not yet run)
- [x] Production boots refuse `rzp_test_*` keys (startup assert) — shipped via US-LAUNCH-010; production has booted successfully with live keys
- [ ] Pricing page shows no checkout button for any tier lacking configured live plan IDs — implemented (US-LAUNCH-007), manual verification on production still pending
- [x] Metering policy documented + unit-test guarded — US-LAUNCH-008 implemented and tested
- [ ] **EPIC-AI-06 shipped** — `BETA_MODE` may only be turned off after real-photo pipeline is live (an agent must be able to market their *actual* listing before we charge them) — Track B, not started (deferred)
- [ ] All stories above have status ✅ Done — currently 🟡 implemented/merged, none formally closed (no PRs opened)

---

## Notes / Blockers

- **RazorPay live activation review requires US-LAUNCH-001 pages live** (business website with terms/privacy/refund policy) — sequence M-LAUNCH-01 first.
- US-LAUNCH-005 is mostly HUMAN ops (dashboard KYC, plan creation, env vars); only the startup assert is code.
- US-LAUNCH-006 depends on US-LAUNCH-002 (EmailService).
- Live plans must be **re-created** in the live dashboard — test-mode plans do not carry over.

---

*Milestone created: 2026-07-07*
