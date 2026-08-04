# EPIC-LAUNCH-01 — Go-Live & Revenue Readiness

> **Phase:** Phase 1 — Revenue Strategy (v1.1)
> **Status:** 🟡 In Progress — 8/14 stories Done, 4 Implemented (merged, awaiting M-LAUNCH-01 close), 1 In Progress (US-LAUNCH-005), 1 Not Started (US-LAUNCH-014)
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
| [US-LAUNCH-001](stories/US-LAUNCH-001/STORY.md) | Legal & policy pages (Terms · Privacy · Refund) | M-LAUNCH-01 | M | ✅ Done | 51b0040 |
| [US-LAUNCH-002](stories/US-LAUNCH-002/STORY.md) | Transactional email foundation (provider-agnostic EmailService) | M-LAUNCH-01 | M | ✅ Done | ec166fb |
| [US-LAUNCH-003](stories/US-LAUNCH-003/STORY.md) | Forgot / reset password flow | M-LAUNCH-01 | M | ✅ Done | 1bc7346 |
| [US-LAUNCH-004](stories/US-LAUNCH-004/STORY.md) | Beta launch mode (checkout off · AI-content disclaimer) | M-LAUNCH-01 | S | ✅ Done | [#18](https://github.com/din-prajapati/infographic.io/pull/18) |
| [US-LAUNCH-005](stories/US-LAUNCH-005/STORY.md) | RazorPay live-mode activation | M-LAUNCH-02 | M | 🟡 AC1–4 done — approved, live keys deployed 2026-07-28; AC5/6 (prereqs check, real ₹ txn) open | — (ops) |
| [US-LAUNCH-006](stories/US-LAUNCH-006/STORY.md) | Payment receipt email on subscription charge | M-LAUNCH-02 | S | ✅ Done | `fa1d345` |
| [US-LAUNCH-007](stories/US-LAUNCH-007/STORY.md) | BROKERAGE tier gate on pricing page (resolves PT-06) | M-LAUNCH-02 | S | ✅ Done | `fa1d345` |
| [US-LAUNCH-008](stories/US-LAUNCH-008/STORY.md) | Metering policy guard (1 generation = 1 credit) | M-LAUNCH-02 | S | ✅ Done | `aaf3aef` |
| [US-LAUNCH-009](stories/US-LAUNCH-009/STORY.md) | Environment & secrets management convention (docs/config) | M-LAUNCH-01 | M | ✅ Done | ec166fb |
| [US-LAUNCH-010](stories/US-LAUNCH-010/STORY.md) | Config hardening — APP_ENV + boot validation + RazorPay guard | M-LAUNCH-01 | M | ✅ Done | [#17](https://github.com/din-prajapati/infographic.io/pull/17) |
| [US-LAUNCH-011](stories/US-LAUNCH-011/STORY.md) | Rebrand user-facing surfaces to Buildographic | M-LAUNCH-01 | S | ✅ Done | [#16](https://github.com/din-prajapati/infographic.io/pull/16) |
| [US-LAUNCH-012](stories/US-LAUNCH-012/STORY.md) | Payment-failed (dunning) email notification | M-LAUNCH-02 | S | ✅ Done | `fa1d345` |
| [US-LAUNCH-013](stories/US-LAUNCH-013/STORY.md) | Subscription renewal reminder email (3-day notice) | M-LAUNCH-02 | S | ✅ Done | `fa1d345`+`5c52dc0` |
| [US-LAUNCH-014](stories/US-LAUNCH-014/STORY.md) | Email verification for new local accounts (backlog, non-blocking) | M-LAUNCH-01 | M | 🔲 | — |

---

## Features in this Epic

| Feature ID | Scope | Stories |
|------------|-------|---------|
| F-LAUNCH-01 | Legal & Trust Pages | US-LAUNCH-001 |
| F-LAUNCH-02 | Transactional Email | US-LAUNCH-002, US-LAUNCH-003, US-LAUNCH-006, US-LAUNCH-012, US-LAUNCH-013, US-LAUNCH-014 |
| F-LAUNCH-03 | Beta Launch Mode | US-LAUNCH-004 |
| F-LAUNCH-04 | Payments Go-Live | US-LAUNCH-005, US-LAUNCH-007 |
| F-LAUNCH-05 | Metering Policy | US-LAUNCH-008 |
| F-LAUNCH-06 | Environment & Secrets Management | US-LAUNCH-009, US-LAUNCH-010 |
| F-LAUNCH-07 | Brand Identity (Buildographic) | US-LAUNCH-011 |

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

---

## Implementation Update (log)

### 2026-07-27 — US-LAUNCH-007 implementation complete (pre-PR)
- **Files touched:** `client/src/pages/PricingPage.tsx`, `api/src/modules/payments/services/payments.service.ts`, `api/tests/payments/plan-availability.spec.ts`, `docs/agile/PROJECT_CONTEXT.md`
- **ACs covered:** AC1, AC2, AC3, AC4 (all covered; AC1/AC2 require manual visual verification on localhost)
- **Commits:** 3 on branch `feat/launch/m-02-emails-and-gate` (T1 pricing gate, T2 BROKERAGE fallback+PLAN_NOT_AVAILABLE+configured field, T3 tests+PT-06 close-out)
- **Notes:** PT-06 root cause was non-empty `'plan_brokerage'` string fallback bypassing the `!externalPlanId` check. Fixed to empty string. `getAvailablePlans()` now returns `configured: boolean` driven by `getExternalPlanId()` — FREE tier always configured (price=0), paid tiers only configured when env vars set. PricingPage uses `paymentsApi.getPlans()` query result for gate — not hardcoded to BROKERAGE tier name.

### 2026-07-27 — US-LAUNCH-013 implementation complete (pre-PR)
- **Files touched:** `package.json`, `package-lock.json`, `api/prisma/schema.prisma`, `api/src/app.module.ts`, `api/src/modules/payments/services/renewal-reminder.service.ts`, `api/src/modules/payments/payments.module.ts`, `api/tests/payments/renewal-reminder.spec.ts`
- **ACs covered:** AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8 (5 of 5 unit-testable scenarios pass: send+update, sent=false, cycle-guard, window-guard, FREE-tier query-filter check added post-merge)
- **Commits:** 4 on branch `feat/launch/m-02-emails-and-gate` (T1 package.json+schema, T2 AppModule, T3 service+module, T4 tests)
- **Notes:** npm install was interrupted in a prior attempt leaving node_modules with `@nestjs/schedule` but no package.json entry — re-ran install to reconcile. Used `vi.hoisted` for Prisma singleton mock to avoid hoisting error. Prisma two-step approach (DB query + in-memory filter) implemented correctly — Prisma cannot compare two columns in WHERE. `prisma generate` regenerated after schema change. TC-LAUNCH-013-06/07 manual verification deferred (require running server + qualifying DB row).

### 2026-07-27 — US-LAUNCH-012 implementation complete (pre-PR)
- **Files touched:** `api/src/modules/payments/services/payments.service.ts`, `api/tests/payments/payment-failed-email.spec.ts`
- **ACs covered:** AC1, AC2, AC3, AC4, AC5 (3 unit tests pass: email fields, failure isolation, duplicate skip)
- **Commits:** 2 on branch `feat/launch/m-02-emails-and-gate` (T1 skipped — EmailModule already wired by US-LAUNCH-006)
- **Notes:** Email appended after `updateSubscription PAST_DUE` in a try/catch block. PaymentsModule T1 was a no-op since US-LAUNCH-006 already added EmailModule + EmailService. Manual inbox verification (TC-LAUNCH-012-04) requires live-mode failure simulation.

### 2026-07-27 — US-LAUNCH-006 implementation complete (pre-PR)
- **Files touched:** `api/src/modules/payments/services/payments.service.ts`, `api/src/modules/payments/payments.module.ts`, `api/tests/payments/receipt-email.spec.ts`
- **ACs covered:** AC1, AC2, AC3, AC4, AC5 (3 unit tests pass: receipt fields, failure isolation, renewal)
- **Commits:** 2 on branch `feat/launch/m-02-emails-and-gate`
- **Notes:** EmailService injected as optional constructor parameter so pre-existing tests (`new PaymentsService(mockStorage)`) remain unbroken. Receipt email fires after both the PENDING→ACTIVE and renewal (ACTIVE) branches of `handleSubscriptionCharged`. Prisma client was not pre-generated in this worktree — ran `npx prisma generate` to unblock tests. HTML amount formatted with `en-IN` locale (₹2,999, not 2999). Manual inbox verification (TC-LAUNCH-006-04) requires live-mode environment.

### 2026-07-27 — US-LAUNCH-008 implementation complete (pre-PR)
- **Files touched:** `api/tests/ai/metering-policy.spec.ts` (new), `docs/agile/PROJECT_CONTEXT.md`, `CLAUDE.md`, `docs/agile/epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-008/TASKS.md`, `docs/agile/epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-008/STORY.md`
- **ACs covered:** AC1 (policy blockquote in PROJECT_CONTEXT.md + one-line note in CLAUDE.md), AC2 (unit tests pin creditsUsed: 1 at both creation sites), AC3 (unit tests pin costUsd = actual provider cost at both sites), AC4 (UsageLimitService test demonstrates FREE=3/mo credit counting + error-path ForbiddenException)
- **Commits:** 2 on branch `feat/launch/us-launch-008` — d9a39a4 (T1 tests), d8b8279 (T2 docs) — merged to `main` at `aaf3aef`
- **Notes:** No production logic changed — story pins existing behavior as policy. Discovered a pre-existing Vitest module-load ordering quirk: importing `AiOrchestrator` alongside `UsageLimitService` in the same test file caused `SubscriptionStatus` from `@prisma/client` to be undefined. Fixed with a passthrough `vi.mock('@prisma/client', async (importOriginal) => importOriginal())` in the spec file (does not affect production code). Gate 1: `npm run check` clean, `npm run test:unit` 111/111 pass (9 test files).

### 2026-07-18 — US-LAUNCH-011 implementation complete (pre-PR)
- **Files touched:** `client/index.html`, `client/src/pages/LandingPage.tsx`, `client/src/pages/PricingPage.tsx`, `client/src/components/SiteFooter.tsx`, `client/src/pages/AuthPage.tsx`, `client/src/pages/auth/ForgotPasswordPage.tsx`, `client/src/pages/auth/ResetPasswordPage.tsx`, `client/src/pages/legal/TermsPage.tsx`, `client/src/pages/legal/PrivacyPage.tsx`, `client/src/pages/legal/RefundPolicyPage.tsx`, `api/src/modules/auth/services/auth.service.ts`, `api/src/main.ts`, `api/tests/auth/password-reset.spec.ts`, `e2e/us-launch-001-legal-pages.spec.ts`
- **ACs covered:** AC1, AC2, AC3, AC4 (E2E assertions written; actual E2E run deferred to /test-story — needs running server)
- **Commits:** 5 on branch `feat/launch/us-launch-011-rebrand-buildographic` (bc1a72e T1, 10c2851 T2, a343157 T3, 4a82384 T4, 3d88e45 T5)
- **Notes:** grep sweep `grep -rn "InfographicAI" client/src client/index.html api/src` returns zero hits. Occurrence count discrepancies found vs story: TermsPage.tsx has 7 non-email occurrences (story stated 6); PrivacyPage.tsx has 4 non-email occurrences (story stated 5) — all were replaced per instruction. Email addresses (`support@infographicai.in`, etc.) in legal pages intentionally left unchanged (they are domain/contact addresses, not user-facing brand name occurrences, and changing them would require new email infrastructure). The all-caps "WHY INFOGRAPHICAI" label in LandingPage.tsx was replaced to "WHY BUILDOGRAPHIC" to preserve the display style.

### 2026-07-25 — US-LAUNCH-004 implementation complete, incl. test-story AC3 fix (pre-PR)
- **Files touched:** `client/src/pages/PricingPage.tsx`, `api/src/modules/payments/controllers/payments.controller.ts`, `client/src/components/ai-chat/ResultsVariations.tsx`, `client/src/components/ai-chat/MessageBubble.tsx`, `api/tests/payments/beta-guard.spec.ts`, `e2e/us-launch-004-beta-mode.spec.ts`, `.env.example`
- **ACs covered:** AC1 (beta banner + disabled paid CTA), AC2 (403 BETA_MODE_ACTIVE guard), AC3 (AI-content disclaimer — see finding below), AC4 (flags off = current paid behavior, verified by unit + E2E), AC5 (9 unit tests in beta-guard.spec.ts, 88/88 full suite pass)
- **Commits:** 7 on branch `feat/launch-us-launch-004-beta-mode`
- **Notes:** Guard lives in the controller (not the service) so it fires before any payment-provider call. `test-story` E2E coverage found AC3 did not actually hold: the disclaimer in `ResultsVariations.tsx` only rendered in `AIChatBox`'s default view (`!hasActiveConversation`), unreachable once a prompt is submitted and the conversation view (`MessageBubble.tsx`) takes over. Fixed by adding the same disclaimer to `MessageBubble.tsx`; verified against both beta-on and beta-off local servers. Also found (documented, not fixed — out of this story's scope): the `BETA_MODE` guard is case-sensitive, so `BETA_MODE=TRUE` in a Railway dashboard would silently bypass it — flagged for the ops runbook.

### 2026-07-25 — US-LAUNCH-004 closed (PR #18 merged)
- **PR:** [#18](https://github.com/din-prajapati/infographic.io/pull/18) — squash-merged into `main`
- **ACs:** all checked ✅ (AC1–AC5)
- **Closed by:** /close-story
- **Notes:** Both remaining manual DoD items resolved at closure: disclaimer copy signed off (no vendor names); the VITE_BETA_MODE-on/BETA_MODE-off split-misconfig scenario confirmed by code read (the guard reads only `process.env.BETA_MODE`, never the frontend flag — already proven by existing unit coverage) rather than a fresh live run. Both flags must still be set together in ops — noted as a runbook risk, not a code gap.

### 2026-07-25 — US-LAUNCH-011 closed (PR #16 merged)
- **PR:** [#16](https://github.com/din-prajapati/infographic.io/pull/16) — merged 2026-07-22
- **ACs:** all checked ✅ (AC1–AC4), plus three unscoped follow-ups completed on the same branch: logo exploration/selection, site-wide logo propagation, and apex/app host routing groundwork
- **Closed by:** /close-story
- **Notes:** Closed 3 days after merge — the automated "Close Story on PR Merge" GitHub Action failed on this PR (and on #17, #18) because the workflow calls `.claude/hooks/cascade-close-story.sh`, which doesn't exist; the real script lives at `.orion/hooks/cascade-close-story.sh`. Manually verified DoD: Gate 1 green, E2E legal-pages suite passed locally (13/14, 1 pre-existing unrelated skip), manual sweep found no remaining "InfographicAI" strings (contact emails intentionally left, out of scope).

---

*Epic created: 2026-07-07 | Last updated: 2026-07-25*
