# EPIC-LAUNCH-01 — Go-Live & Revenue Readiness

> **Phase:** Phase 1 — Revenue Strategy (v1.1)
> **Status:** 🟡 In Progress — 13/17 stories Done, 1 In Progress (US-LAUNCH-005), 3 Not Started — all backlog/non-blocking (US-LAUNCH-014; US-LAUNCH-016/017 signup onboarding, added 2026-09-14). US-LAUNCH-015 (editable-design monetization) added 2026-08-13, closed 2026-08-15, live-verified. Only US-LAUNCH-005 AC5/6 (real ₹ transaction) stands between this epic and fully Done.
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
| [US-LAUNCH-014](stories/US-LAUNCH-014/STORY.md) | Sign-up verification gate + abuse controls (re-scoped 2026-09-14 from soft verification; re-rated should-have 2026-09-21) | M-LAUNCH-01 | L | 🟡 In Progress | [#55](https://github.com/din-prajapati/infographic.io/pull/55) |
| [US-LAUNCH-015](stories/US-LAUNCH-015/STORY.md) | Editable-design monetization (FREE gate + extra-compose credits) | M-LAUNCH-02 | M | ✅ Done 2026-08-15 — live-verified `[201, 402]` | — |
| [US-LAUNCH-016](stories/US-LAUNCH-016/STORY.md) | Post-signup onboarding — Screen 1 required profile (backlog, non-blocking) | M-LAUNCH-01 | M | 🔲 | — |
| [US-LAUNCH-017](stories/US-LAUNCH-017/STORY.md) | Onboarding brand kit — Screen 2, persisted + fed to generation (backlog, depends on 016) | M-LAUNCH-01 | M | 🔲 | — |

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
| F-LAUNCH-08 | Signup Onboarding | US-LAUNCH-016, US-LAUNCH-017 |

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

### 2026-09-18 — US-LAUNCH-014 follow-up: T7 internal test-account allowlist
- **Files touched:** `api/src/modules/auth/utils/email-policy.ts`, `api/src/modules/auth/services/auth.service.ts`, `api/src/common/guards/proxy-aware-throttler.guard.ts`, `.env.example`, `docs/agile/epics/phase-1-ai-core/EPIC-LAUNCH-01/ENV.yaml`, `scripts/seed-test-users.mjs` (new), `package.json`, `api/tests/auth/{email-policy,email-verification}.spec.ts`, `api/tests/common/proxy-aware-throttler.spec.ts`
- **ACs covered:** AC14, AC15, AC16, AC18 (AC17 partially — docs + script written, but the seed write and the full Playwright run are deferred to MV-014-13 / MV-014-10, see below)
- **Commits:** 1 on branch `feat/launch/us-launch-014-signup-verification-gate`
- **Notes:** **Why T7 exists:** AC8's gate and AC12's limits broke this repo's own E2E suite — 12 specs register `e2e-*@test.local` and then call a gated route (403), and one full run exceeds 5 sign-ups/hour from a single CI IP (429); `npx playwright test` defaults to **staging**, so this hits a deployed environment. `isInternalTestEmail()` reads `INTERNAL_TEST_EMAIL_DOMAINS` at **call** time (not module load) and matches the domain by **exact equality** — deliberately the opposite of `isDisposableEmail`'s parent-domain walk, because widening a block list is safe while widening an allow list hands out verified accounts (`evil-test.local` / `sub.test.local` must not match `test.local`). `register()` changes exactly three things for a match — skip the disposable check, create with `emailVerified: true` + `emailVerifiedAt`, skip token + send — and logs once at `warn`; the AC4 duplicate check, credits, plan limits, the guard and the global 100/min throttle are untouched. `shouldSkip()` consults the body email alone on `POST` to the three email-sending routes (paths compared by equality against both the prefixed and unprefixed forms, so `/anything/auth/register` gains nothing); no header, query parameter or body flag can select it. **Deviation:** `npm run seed:test-users` runs `npx tsx scripts/seed-test-users.mjs` rather than plain `node`, so the `.mjs` entry point can import the TypeScript `normalizeEmail` instead of re-implementing the duplicate key; the script writes through Prisma, bcrypt cost 10 (same as `register()`), and never reads `INTERNAL_TEST_EMAIL_DOMAINS` — production seeds without any bypass. **Outstanding:** the script reaches the DB but currently fails `P2022 User.emailNormalized does not exist` because T1's `prisma db push` has not been applied to the dev database — re-run MV-014-13 and MV-014-10 after the push, and confirm MV-014-14 (`INTERNAL_TEST_EMAIL_DOMAINS` absent in Railway production).

### 2026-09-18 — US-LAUNCH-014 implementation complete (pre-PR)
- **Files touched:** `api/prisma/schema.prisma`, `api/src/modules/auth/utils/email-policy.ts`, `api/src/modules/auth/services/auth.service.ts`, `api/src/modules/auth/controllers/auth.controller.ts`, `api/src/modules/auth/dto/auth.dto.ts`, `api/src/common/guards/email-verified.guard.ts`, `api/src/common/guards/proxy-aware-throttler.guard.ts`, `api/src/common/filters/http-exception.filter.ts`, `api/src/app.module.ts`, `api/src/modules/infographics/controllers/{infographics,generations,extractions}.controller.ts`, `server/index.ts`, `.env.example`, `package.json`, `shared/schema.ts`, `client/src/lib/queryClient.ts`, `client/src/components/auth/EmailVerificationRequiredDialog.tsx`, `client/src/components/ui/EmailVerificationBanner.tsx`, `client/src/pages/auth/VerifyEmailPage.tsx`, `client/src/App.tsx`, `api/tests/auth/{email-policy,email-verification}.spec.ts`, `api/tests/common/{email-verified.guard,proxy-aware-throttler,http-exception-filter}.spec.ts`
- **ACs covered:** AC1–AC13 (AC9/AC10 implemented this pass; the 375px/1440px no-overflow check is MV-014-09 and stays manual, as do MV-014-01..-08)
- **Commits:** 8 on branch `feat/launch/us-launch-014-signup-verification-gate` — f189005 (T1 schema), 91cd852 (T2 email-policy), ebf0953 (T3 auth service/controller/dto), e55af8f (T4 EmailVerifiedGuard + 5 gated routes), d7069c9 (T5 proxy-aware throttler + @Throttle), 11fb6ae (AC13 tick), b8ed6ac (T5b exception filter), fbf997f (T6 client)
- **Notes:** **T5b was added mid-story (product-owner approved).** `AllExceptionsFilter` rebuilt every error as `{ statusCode, message }` and silently dropped a thrower-supplied `code`, so AC9's `code === 'EMAIL_NOT_VERIFIED'` match could never have fired — and `BETA_MODE_ACTIVE` (US-LAUNCH-004) had the same latent bug. The fix is additive: `code` is emitted only when the thrower set a string one; non-HttpException errors are untouched. Keying the dialog off a bare 403 was rejected deliberately — `usage-limit.service.ts` also answers 403 for the monthly cap. Client side: `queryClient` dispatches `buildographic:email-verification-required` before re-throwing the unchanged `ApiError`, so each call site keeps its own toast; the dialog is mounted once inside `AuthProvider` (single `open` boolean, so repeat events re-open rather than stack). `LegacyUser.emailVerified` is optional and the banner treats `undefined` as verified, so grandfathered and Google sessions are never nagged. `/auth/verify-email` is registered above `/auth` because Wouter's `Switch` renders the first match. **Outstanding:** MV-014-06 — confirm `TRUSTED_PROXY_HOPS` on Railway staging (likely `2`) before the register limit is trusted in production; and `npx prisma db push` has not been applied to staging/production yet (run it, then confirm existing rows read `emailVerified = true`).

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
