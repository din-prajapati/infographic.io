# EPIC-LAUNCH-01 — Go-Live & Revenue Readiness

> **Phase:** Phase 1 — Revenue Strategy (v1.1)
> **Status:** 🔲 Not Started
> **Depends on:** EPIC-INFRA-01 (Phase 0 production deploy) for all stories · EPIC-AI-06 gates the **revenue-on switch** (M-LAUNCH-02 DoD), not M-LAUNCH-02 prep work
> **Linear Project:** LIN-EPIC-XXX
> **Target date:** 2026-08-15
> **Owner:** Dinesh

---

## Goal

**Outcome:** The deployed product can be legitimately offered to real agents as a public free beta, and — once EPIC-AI-06 ships — can collect real money: live RazorPay, password recovery, payment receipts, legal pages, and honest metering.

**Why now:** The 2026-07-07 launch-readiness assessment found the codebase technically finished but operationally unlaunchable: RazorPay is on `rzp_test_*` keys, there is **no transactional email at all** (a customer who forgets their password permanently loses the account they pay for, and gets no receipt), no terms/privacy/refund pages (RazorPay live activation requires them; legally expected for paid subscriptions in India), and the BROKERAGE tier renders on the pricing page with no configured plan IDs (PT-06). Separately, charging is irresponsible until EPIC-AI-06 replaces synthetic property photos/headshots — hence the two-milestone split: **beta live first, revenue on second.**

**Success metric:**
- M-LAUNCH-01: a stranger can sign up on production, generate, recover a forgotten password, and read Terms/Privacy/Refund — with paid checkout cleanly disabled behind a beta flag
- M-LAUNCH-02: one real ₹ subscription completes end-to-end on live RazorPay (checkout → webhook → ACTIVE → receipt email) and is then refunded

---

## Milestones

| Milestone | Scope | Target | Status |
|-----------|-------|--------|--------|
| [M-LAUNCH-01-public-beta](milestones/M-LAUNCH-01-public-beta.md) | Legal pages · email foundation · password reset · beta mode | 2026-07-21 | 🔲 |
| [M-LAUNCH-02-revenue-on](milestones/M-LAUNCH-02-revenue-on.md) | RazorPay live activation · receipt email · BROKERAGE gate · metering guard | 2026-08-15 (flip gated by EPIC-AI-06) | 🔲 |

---

## Stories in this Epic

| Story ID | Title | Milestone | Size | Status | PR |
|----------|-------|-----------|------|--------|----|
| [US-LAUNCH-001](stories/US-LAUNCH-001/STORY.md) | Legal & policy pages (Terms · Privacy · Refund) | M-LAUNCH-01 | M | 🔲 | — |
| [US-LAUNCH-002](stories/US-LAUNCH-002/STORY.md) | Transactional email foundation (provider-agnostic EmailService) | M-LAUNCH-01 | M | 🟡 impl | ec166fb |
| [US-LAUNCH-003](stories/US-LAUNCH-003/STORY.md) | Forgot / reset password flow | M-LAUNCH-01 | M | 🔲 | — |
| [US-LAUNCH-004](stories/US-LAUNCH-004/STORY.md) | Beta launch mode (checkout off · AI-content disclaimer) | M-LAUNCH-01 | S | 🔲 | — |
| [US-LAUNCH-005](stories/US-LAUNCH-005/STORY.md) | RazorPay live-mode activation | M-LAUNCH-02 | M | 🔲 | — |
| [US-LAUNCH-006](stories/US-LAUNCH-006/STORY.md) | Payment receipt email on subscription charge | M-LAUNCH-02 | S | 🔲 | — |
| [US-LAUNCH-007](stories/US-LAUNCH-007/STORY.md) | BROKERAGE tier gate on pricing page (resolves PT-06) | M-LAUNCH-02 | S | 🔲 | — |
| [US-LAUNCH-008](stories/US-LAUNCH-008/STORY.md) | Metering policy guard (1 generation = 1 credit) | M-LAUNCH-02 | S | 🔲 | — |
| [US-LAUNCH-009](stories/US-LAUNCH-009/STORY.md) | Environment & secrets management convention (docs/config) | M-LAUNCH-01 | M | 🟡 impl | ec166fb |
| [US-LAUNCH-010](stories/US-LAUNCH-010/STORY.md) | Config hardening — APP_ENV + boot validation + RazorPay guard | M-LAUNCH-01 | M | 🔲 | — |

---

## Features in this Epic

| Feature ID | Scope | Stories |
|------------|-------|---------|
| F-LAUNCH-01 | Legal & Trust Pages | US-LAUNCH-001 |
| F-LAUNCH-02 | Transactional Email | US-LAUNCH-002, US-LAUNCH-003, US-LAUNCH-006 |
| F-LAUNCH-03 | Beta Launch Mode | US-LAUNCH-004 |
| F-LAUNCH-04 | Payments Go-Live | US-LAUNCH-005, US-LAUNCH-007 |
| F-LAUNCH-05 | Metering Policy | US-LAUNCH-008 |
| F-LAUNCH-06 | Environment & Secrets Management | US-LAUNCH-009, US-LAUNCH-010 |

---

## Out of Scope (Epic Level)

- Stripe activation + billing portal — EPIC-PAY-03, Phase 2
- Marketing / lifecycle email campaigns, email queues with retry — Phase 3
- GST-compliant PDF invoicing (the `Invoice` model exists; full tax invoicing is post-revenue)
- Waitlist / invite-code system — beta is open, gated only by the FREE tier limit
- Creating BROKERAGE plans in RazorPay — US-LAUNCH-007 only *hides* the dead checkout path
- The synthetic-photo fix itself — that is EPIC-AI-06; this epic only sequences around it

---

## Definition of Done (Epic)

- [ ] All milestones closed
- [ ] All stories have PR merged and STORY.md status = ✅ Done
- [ ] Verified on staging environment
- [ ] `npm run check` + `npm run test:unit` passing
- [ ] One real ₹ live transaction completed and refunded (M-LAUNCH-02)
- [ ] AGILE_INDEX.md epic row updated to ✅ Done

---

## Architecture Notes

See [ARCHITECTURE.mmd](./ARCHITECTURE.mmd).

Key files relevant to this epic:
```
- client/src/App.tsx                                          (new public routes)
- client/src/pages/PricingPage.tsx                            (beta mode, BROKERAGE gate)
- api/src/modules/auth/                                       (forgot/reset password)
- api/src/modules/payments/services/payments.service.ts       (webhook → receipt hook)
- api/src/modules/email/                                      (NEW module — EmailService)
- api/prisma/schema.prisma                                    (PasswordResetToken model)
- .env.example / Railway env vars                             (live RazorPay keys + plans)
```

---

*Epic created: 2026-07-07 | Last updated: 2026-07-07*
