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
| Backlog | [US-LAUNCH-014](../stories/US-LAUNCH-014/STORY.md) | Sign-up verification gate + abuse controls | — | ✅ Done 2026-09-29 | [#55](https://github.com/din-prajapati/infographic.io/pull/55) (`09c6e9e`) + fix `7044a44` |
| Backlog | [US-LAUNCH-016](../stories/US-LAUNCH-016/STORY.md) | Post-signup onboarding — Screen 1 required profile | — (file overlap with 014: sequence, don't parallelize) | 🔲 | — |
| Backlog | [US-LAUNCH-017](../stories/US-LAUNCH-017/STORY.md) | Onboarding brand kit — Screen 2 | US-LAUNCH-016 | 🔲 | — |

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
- [x] A password-reset email arrives in a real inbox from production and the reset link works —
      ✅ **verified live against production 2026-07-21**, recorded under
      [US-LAUNCH-003](../stories/US-LAUNCH-003/STORY.md) TC-LAUNCH-003-05. A real account was
      registered on `app.buildographic.com`, forgot-password triggered, the genuine Resend email
      received, and the link correctly carried `https://app.buildographic.com/auth/reset?token=…`
      with no `localhost` fallback — the reset was then completed and the new password used to log
      in. That run is also what caught the empty `BASE_URL` / missing `CLIENT_URL` on both
      environments, so it exercised the thing this item exists to catch. Closed on that evidence
      2026-10-19.

      > **Provenance note:** the account used for it, `din.prajapati+prodreset@gmail.com`, was
      > deleted on 2026-10-19 as part of the `emailNormalized` backfill — it was one of two empty
      > legacy test accounts colliding on the unique key. The verification stands and is written up
      > in US-LAUNCH-003; the account that produced it no longer exists. Re-running it on a current
      > account takes about three minutes if live evidence is ever wanted instead of the citation.
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
- [ ] All stories above have status ✅ Done, **except US-LAUNCH-016 and US-LAUNCH-017** (Backlog — non-blocking, may close after this milestone). US-LAUNCH-014 closed 2026-09-29.

---

## Notes / Blockers

- **2026-09-29 — this milestone's premise was broken for 15 days and nobody noticed.** Production and staging served nothing from 2026-09-14 to 2026-09-29 after the Railway trial lapsed (see [[BL-34]]), so the Acceptance item *"a stranger can sign up on production"* was false for that whole period regardless of what the code did. Both environments are live again on `7044a44`. Re-verify the remaining Acceptance items against the restored deployment rather than against the 2026-09-08 evidence, which predates the outage.

- **Blocked by:** EPIC-INFRA-01 — the 3 Phase 0 HUMAN deploy tasks. There is no production URL to put these pages on until that closes.
- US-LAUNCH-003 depends on US-LAUNCH-002 (EmailService must exist first).
- Legal page *content* needs a human review pass before go-live (drafted text is not legal advice).
- This milestone is deliberately revenue-free: the synthetic-photo limitation (fixed by EPIC-AI-06) is a disclosed beta limitation, not a mis-sold product.

---

*Milestone created: 2026-07-07*
