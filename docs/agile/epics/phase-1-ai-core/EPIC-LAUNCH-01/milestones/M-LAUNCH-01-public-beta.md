# M-LAUNCH-01-public-beta — Public Free Beta Live

> **Epic:** [EPIC-LAUNCH-01](../EPIC.md)
> **Status:** 🟡 In Progress — **7/7 stories ✅ Done** (US-LAUNCH-001, 002, 003, 004, 009, 010, 011, closed 2026-08-04), but **the milestone is not a status flip away from closing.** Two of the four Acceptance checks were verified 2026-09-08 (see below); one needs a real inbox, and one can no longer be verified as written because production has moved past beta. Production go-live itself is done — `app.buildographic.com` serves the deployed build.
> **Target date:** 2026-07-21 (slipping — Task 3 still open; see [PHASE_0_HUMAN_QA_CHECKLIST.md](../../../../testing/PHASE_0_HUMAN_QA_CHECKLIST.md) for live Task 3 status)

---

## Goal

A real estate agent who is a total stranger can sign up on production, generate infographics on the FREE tier, recover a forgotten password by email, and read Terms/Privacy/Refund pages — while paid checkout is cleanly disabled behind a single beta flag and every generation result carries an AI-content disclaimer.

---

## Stories in this Milestone

| Order | Story | Title | Blocked By | Status | PR |
|:-----:|-------|-------|------------|--------|----|
| 1 | [US-LAUNCH-001](../stories/US-LAUNCH-001/STORY.md) | Legal & policy pages (Terms · Privacy · Refund) | — | ✅ Done | 51b0040 (direct, no PR) |
| 1 | [US-LAUNCH-002](../stories/US-LAUNCH-002/STORY.md) | Transactional email foundation | — | ✅ Done | ec166fb (direct, no PR) |
| 1 | [US-LAUNCH-004](../stories/US-LAUNCH-004/STORY.md) | Beta launch mode | — | ✅ Done | [#18](https://github.com/din-prajapati/infographic.io/pull/18) |
| 2 | [US-LAUNCH-003](../stories/US-LAUNCH-003/STORY.md) | Forgot / reset password flow | US-LAUNCH-002 | ✅ Done | 1bc7346 (direct, no PR) |
| 1 | [US-LAUNCH-009](../stories/US-LAUNCH-009/STORY.md) | Environment & secrets management convention (docs/config) | — | ✅ Done | ec166fb (direct, no PR) |
| 2 | [US-LAUNCH-010](../stories/US-LAUNCH-010/STORY.md) | Config hardening — APP_ENV + boot validation + RazorPay guard | US-LAUNCH-009 | ✅ Done | [#17](https://github.com/din-prajapati/infographic.io/pull/17) |
| 3 | [US-LAUNCH-011](../stories/US-LAUNCH-011/STORY.md) | Rebrand user-facing surfaces to Buildographic | — | ✅ Done | [#16](https://github.com/din-prajapati/infographic.io/pull/16) |
| Backlog | [US-LAUNCH-014](../stories/US-LAUNCH-014/STORY.md) | Email verification for new local accounts | — | 🔲 | — |

> **Order** = wave. Same order = no known file overlap, safe to run in parallel worktrees. **Blocked By** = genuine logical dependency (must be ✅ Done, not just merged-and-mergeable). File-overlap safety within an order is verified automatically by `orion run next M-LAUNCH-01`, not by this column.
>
> **US-LAUNCH-014 is Backlog, not a wave** — should-have, not launch-blocking (see its STORY.md header). It is explicitly excluded from the Acceptance checklist below; do not treat it as required for this milestone to close.

---

## Acceptance (Milestone Done When…)

- [x] `/terms`, `/privacy`, `/refund-policy` are live on production and linked from the footer —
      ✅ **verified 2026-09-08** against the deployed bundle (`/assets/index-IzdFBQQr.js`) on
      `app.buildographic.com`. All three are real Wouter routes bound to components
      (`{path:"/terms",component:…}`, same for `/privacy` and `/refund-policy`), and the bundle
      carries four footer link sites pointing at them ("Privacy Policy", "Refund & Cancellation
      Policy"). Note an HTTP check alone cannot answer this: the SPA catch-all returns 200 for any
      path, including nonsense ones — the first pass at this check did exactly that and proved
      nothing.
- [ ] A password-reset email arrives in a real inbox from production and the reset link works —
      **HUMAN.** Needs a real inbox; nothing else blocks it.
- [ ] ⚠️ With `BETA_MODE=true`, no paid checkout can be initiated from UI **or** API —
      **cannot be verified as written, and the premise has changed.** `BETA_MODE` is **not set at
      all** on production (checked 2026-09-08 via `railway variables --environment production`).
      `payments.controller.ts:62` gates on `process.env.BETA_MODE === 'true'`, so the guard is
      inactive and **paid checkout is live on production** against the live Razorpay plans — which
      is what M-LAUNCH-02 wants, not what this item asserts. Needs a decision, not a test run:
      either drop this item as superseded by revenue-on, or re-verify it on staging where the flag
      is meaningful. Filed as [BL-29](../../../../BACKLOG.md) because the *ordering* is the real
      risk — checkout is reachable by strangers and no transaction has ever been run through it
      (US-LAUNCH-005 AC6).
- [x] AI-content disclaimer visible on generation results/export — ✅ **verified 2026-09-08** in the
      deployed bundle: "Imagery may include AI-generated visuals. Verify all details before
      publishing to represent a real listing." renders at two result surfaces
      (`ResultsVariations`, `MessageBubble`). The export path was **not** separately proven — if
      this item means the disclaimer must also survive onto the exported file, that is still open.
- [ ] All stories above have status ✅ Done, **except US-LAUNCH-014** (Backlog — non-blocking, may close after this milestone)

---

## Notes / Blockers

- **Blocked by:** EPIC-INFRA-01 — the 3 Phase 0 HUMAN deploy tasks. There is no production URL to put these pages on until that closes.
- US-LAUNCH-003 depends on US-LAUNCH-002 (EmailService must exist first).
- Legal page *content* needs a human review pass before go-live (drafted text is not legal advice).
- This milestone is deliberately revenue-free: the synthetic-photo limitation (fixed by EPIC-AI-06) is a disclosed beta limitation, not a mis-sold product.

---

*Milestone created: 2026-07-07*
