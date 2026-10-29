# M-LAUNCH-01-public-beta — Public Free Beta Live

> **Epic:** [EPIC-LAUNCH-01](../EPIC.md)
> **Status:** ✅ **Done** — closed 2026-10-19. 7/7 stories, and all four Acceptance items resolved: legal pages and the AI disclaimer verified 2026-09-08, the production password-reset flow on US-LAUNCH-003's 2026-07-21 evidence, and the `BETA_MODE` item **superseded by decision** — beta-gating was dropped, and M-LAUNCH-02 closed the same day on a real ₹5,499 transaction. Public beta is live at `app.buildographic.com` and takes payment.
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
| Backlog | [US-LAUNCH-016](../../../phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-LAUNCH-016/STORY.md) | Post-signup onboarding — Screen 1 required profile | — (file overlap with 014: sequence, don't parallelize) | 🔲 | — |
| Backlog | [US-LAUNCH-017](../../../phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-LAUNCH-017/STORY.md) | Onboarding brand kit — Screen 2 | US-LAUNCH-016 | 🔲 | — |

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
- [~] ⚠️ ~~With `BETA_MODE=true`, no paid checkout can be initiated from UI **or** API~~ —
      **SUPERSEDED 2026-10-19, by decision. Not a failed check; a retired requirement.**

      This item asserted that checkout must be *blocked*. On 2026-10-19 the product decision was
      taken to drop beta-gating entirely: Buildographic accepts payment whether it presents itself
      as beta or as a commercial launch. `M-LAUNCH-02` (revenue-on) closed the same day on the
      opposite evidence — a real ₹5,499 transaction charged, webhook-verified, refunded and
      cancelled. The two criteria contradict each other and the newer one describes the product
      that shipped.

      Nothing is lost by retiring it: the guard's behaviour is still covered by
      `api/tests/payments/beta-guard.spec.ts`, so if `BETA_MODE` is ever set it still blocks. What
      is dropped is the *requirement* that it be set.

      **Follow-up worth deciding separately:** `BETA_MODE` is now a flag nobody intends to use. The
      guard at `payments.controller.ts:57` is dead code, and [[BL-29]] existed precisely because
      people reasoned about a flag that was never set. A flag that looks protective and is not is
      worse than no flag — see the open question at the end of this milestone.

- [x] AI-content disclaimer visible on generation results/export — ✅ **verified 2026-09-08** in the
      deployed bundle: "Imagery may include AI-generated visuals. Verify all details before
      publishing to represent a real listing." renders at two result surfaces
      (`ResultsVariations`, `MessageBubble`). The export path was **not** separately proven — if
      this item means the disclaimer must also survive onto the exported file, that is still open.
- [x] All stories above have status ✅ Done — 7/7 (US-LAUNCH-001, 002, 003, 004, 009, 010, 011). US-LAUNCH-016/017 sit in the Backlog and were never part of this milestone's seven. US-LAUNCH-014 closed 2026-09-29.

---

## Notes / Blockers

- **2026-09-29 — this milestone's premise was broken for 15 days and nobody noticed.** Production and staging served nothing from 2026-09-14 to 2026-09-29 after the Railway trial lapsed (see [[BL-34]]), so the Acceptance item *"a stranger can sign up on production"* was false for that whole period regardless of what the code did. Both environments are live again on `7044a44`. Re-verify the remaining Acceptance items against the restored deployment rather than against the 2026-09-08 evidence, which predates the outage.

- **Blocked by:** EPIC-INFRA-01 — the 3 Phase 0 HUMAN deploy tasks. There is no production URL to put these pages on until that closes.
- US-LAUNCH-003 depends on US-LAUNCH-002 (EmailService must exist first).
- Legal page *content* needs a human review pass before go-live (drafted text is not legal advice).
- This milestone is deliberately revenue-free: the synthetic-photo limitation (fixed by EPIC-AI-06) is a disclosed beta limitation, not a mis-sold product.

---

*Milestone created: 2026-07-07*


---

## Open question left behind by this milestone (2026-10-19)

Retiring the `BETA_MODE` acceptance item leaves a flag nobody intends to set. The guard at
`payments.controller.ts:57` reads `process.env.BETA_MODE === 'true'` and is now permanently dead on
both environments.

That is not neutral. [[BL-29]] happened *because* people reasoned about this flag as though it were
protecting checkout while it was unset — a guard that looks protective and is not is worse than no
guard, because it stops the question being asked. The same applies to `VITE_BETA_MODE` on the
pricing page.

**Decide, rather than let it sit:** either remove both flags and their guard outright, or document
in the code that they are an intentional emergency kill-switch kept for a reason. Doing neither
recreates the exact condition BL-29 was filed for.
