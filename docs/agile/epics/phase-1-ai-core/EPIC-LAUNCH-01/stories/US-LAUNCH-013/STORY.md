# Story Card — US-LAUNCH-013

> **Status:** ✅ Done
> **Feature:** F-LAUNCH-02 — Transactional Email
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-02-revenue-on](../../milestones/M-LAUNCH-02-revenue-on.md)
> **Size:** S
> **Depends on:** US-LAUNCH-002 (EmailService) merged. US-LAUNCH-012 not required (independent), but shares milestone and email pattern.
> **Note:** Introduces `@nestjs/schedule` as a new `package.json` dependency — `npm install @nestjs/schedule` is required before implementation begins.
> **Linear:** LIN-XXX
> **Created:** 2026-07-24 | **Closed:** 2026-07-29

---

## Story

*As a* paying subscriber with an active SOLO, TEAM, or BROKERAGE recurring subscription
*I want* a renewal reminder email approximately 3 days before my subscription auto-charges
*So that* I am not surprised by the upcoming charge and have time to cancel or update my payment method before the billing date.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When `RenewalReminderService.sendRenewalReminders()` executes, `EmailService.send()` is called only for subscriptions satisfying ALL of the following conditions: `status = ACTIVE`, `planTier != FREE`, `currentPeriodEnd` is after `now` and at or before `now + 72 hours`, AND no reminder has been sent for the current billing cycle — defined as `renewalReminderSentAt IS NULL` or `renewalReminderSentAt` is earlier than `currentPeriodStart`. Any subscription failing one or more of these conditions receives zero `EmailService.send()` calls.

- [x] **AC2 [happy-path]:** For each subscription satisfying AC1, `EmailService.send()` is called exactly once with: `to` set to the subscription owner's `User.email`, a `subject` containing the word "renew" (case-insensitive), and a body that includes the subscription owner's `User.name`, the plan name (e.g., SOLO / TEAM / BROKERAGE), the renewal date formatted from `currentPeriodEnd` (human-readable, not a raw timestamp), and the renewal amount in ₹ derived from `Subscription.amount / 100`. No RazorPay vendor names and no internal subscription or user IDs appear in the email body.

- [x] **AC3 [happy-path]:** When `EmailService.send()` returns `{ sent: true }` for a qualifying subscription, `Subscription.renewalReminderSentAt` is immediately written to the current UTC timestamp via a Prisma `update` call — such that a subsequent invocation of `sendRenewalReminders()` with identical data excludes that subscription via the AC1 cycle guard and does not re-dispatch the email.

- [x] **AC4 [error-path]:** When `EmailService.send()` returns `{ sent: false }` or throws, `Subscription.renewalReminderSentAt` is NOT written, the failure is logged via `Logger.warn`, and the method continues processing any remaining qualifying subscriptions — it does not throw or halt the cron job.

- [x] **AC5 [regression]:** The `sendRenewalReminders()` method carries a `@Cron('0 8 * * *')` decorator from `@nestjs/schedule`, visible by inspection of `RenewalReminderService` — this schedules the job at 08:00 UTC daily.

- [x] **AC6 [regression]:** `@nestjs/schedule` is present in `package.json` `dependencies`, `ScheduleModule.forRoot()` is registered in `AppModule`, `RenewalReminderService` is declared in `PaymentsModule` providers, and `EmailModule` is imported into `PaymentsModule` — `npm run check` passes and `npm run dev` boots without error after these changes.

- [x] **AC7 [regression]:** The new field `renewalReminderSentAt DateTime?` is added to the `Subscription` model in `api/prisma/schema.prisma` and `npx prisma generate --schema=api/prisma/schema.prisma` completes without error — the field is nullable and has no default value.

- [x] **AC8 [regression]:** Unit tests in `api/tests/payments/renewal-reminder.spec.ts` cover: (a) `EmailService.send` is called exactly once for a qualifying subscription and `renewalReminderSentAt` is written via the Prisma mock; (b) when `EmailService.send` returns `{ sent: false }`, `renewalReminderSentAt` is NOT written and no exception propagates; (c) a subscription where `renewalReminderSentAt` is equal to or later than `currentPeriodStart` is excluded — zero email calls; (d) a subscription with `currentPeriodEnd` more than 72 hours away is excluded — zero email calls.

---

## Out of Scope

- Any change to RazorPay webhook signature verification or subscription state machine transitions
- Any change to how `currentPeriodEnd` is computed or written — this story only reads the value already stored in the `Subscription` record by the existing webhook handler
- Reminder emails for FREE tier users or non-recurring one-time payment events
- Building a general-purpose job queue or retry infrastructure — this story introduces exactly one `@Cron` method; no BullMQ, Redis, or job queue system (job queues are scoped to Phase 3 for a different purpose)
- In-app notifications or push notifications for upcoming renewals
- Configurable reminder lead time — the 72-hour window is hardcoded for this story; making it tenant-configurable is a later story

---

## Engineering / PR

- **Branch:** `feat/launch-us-launch-013-renewal-reminder-email`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `package.json` — add `@nestjs/schedule` to `dependencies`
  - `api/prisma/schema.prisma` — add `renewalReminderSentAt DateTime?` to `Subscription` model
  - `api/src/app.module.ts` — import `ScheduleModule.forRoot()` from `@nestjs/schedule`
  - `api/src/modules/payments/services/renewal-reminder.service.ts` — NEW: `RenewalReminderService` with `@Cron('0 8 * * *')` method and Prisma + EmailService calls
  - `api/src/modules/payments/payments.module.ts` — add `RenewalReminderService` to providers; add `EmailModule` import (skip if US-LAUNCH-012 already added it)
  - `api/tests/payments/renewal-reminder.spec.ts` — NEW: unit tests covering AC8 (a)–(d)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — NestJS 11 API (port 3001) + React frontend (port 5000).
Stack: NestJS 11, Prisma 6, React 18 + Vite, Wouter, Zustand + React Query.
See CLAUDE.md for full architecture.

Story: US-LAUNCH-013 — Subscription renewal reminder email (3-day advance notice)

As a paying subscriber, I want an email ~3 days before my subscription auto-charges so that I
am not surprised by the charge and have time to cancel or update my payment method first.

Key facts:
- EmailService is at api/src/modules/email/email.service.ts. Signature: send({to, subject, html?, text?}).
  Returns Promise<{ sent: boolean; dev?: boolean }>. Never throws to callers.
- EmailModule is NOT currently imported in PaymentsModule — add it (skip if US-LAUNCH-012 already did).
- @nestjs/schedule is NOT in package.json — install it first: npm install @nestjs/schedule
- The Subscription model stores currentPeriodEnd (DateTime) and currentPeriodStart (DateTime),
  already populated from RazorPay's subscription.current_end unix timestamp by the existing
  webhook handler (see payments.service.ts extractPaymentData() ~line 959). Do NOT call RazorPay
  API inside the cron job — read only from the DB.
- PrismaClient does not support cross-column comparisons in where clauses. Use a two-step approach:
  Step 1 — DB query: fetch subscriptions where status=ACTIVE, planTier != FREE,
            currentPeriodEnd > now, currentPeriodEnd <= now+72h.
  Step 2 — In-memory filter: exclude those where renewalReminderSentAt is not null
            AND renewalReminderSentAt >= currentPeriodStart.
  Include user: true in the Prisma query to get User.email and User.name in one call.

Schema change: add `renewalReminderSentAt DateTime?` to Subscription model in
api/prisma/schema.prisma. After editing run:
  npx prisma generate --schema=api/prisma/schema.prisma

Acceptance Criteria:
AC1: EmailService.send() called only for ACTIVE, non-FREE subscriptions with currentPeriodEnd
     within next 72h AND (renewalReminderSentAt IS NULL OR renewalReminderSentAt < currentPeriodStart).
AC2: Email to=User.email; subject contains "renew" (case-insensitive); body includes User.name,
     plan name, renewal date (human-readable from currentPeriodEnd), amount in ₹ (amount/100).
     No RazorPay vendor names or internal IDs in body.
AC3: On { sent: true }, write Subscription.renewalReminderSentAt = now via Prisma update.
AC4: On { sent: false } or throw, do NOT write renewalReminderSentAt; log via Logger.warn;
     continue to next subscription.
AC5: Method decorated @Cron('0 8 * * *') from @nestjs/schedule.
AC6: @nestjs/schedule in package.json; ScheduleModule.forRoot() in AppModule;
     RenewalReminderService in PaymentsModule providers; EmailModule imported in PaymentsModule.
     npm run check passes and npm run dev boots without error.
AC7: renewalReminderSentAt DateTime? field added to Subscription model; prisma generate succeeds.
AC8: Unit tests in api/tests/payments/renewal-reminder.spec.ts cover scenarios (a)–(d) from story.

Out of Scope:
- No changes to webhook signature verification or subscription state machine
- No changes to how currentPeriodEnd is computed
- No FREE tier emails
- No BullMQ/Redis/job queue infrastructure — one @Cron method only

Primary files to touch (do NOT touch other files):
  package.json
  api/prisma/schema.prisma
  api/src/app.module.ts
  api/src/modules/payments/services/renewal-reminder.service.ts  (NEW)
  api/src/modules/payments/payments.module.ts
  api/tests/payments/renewal-reminder.spec.ts  (NEW)

Rules:
- Touch ONLY the files listed above
- Do NOT implement anything in Out of Scope
- Run npx prisma generate --schema=api/prisma/schema.prisma after schema change
- Run npm run check before declaring done
- Run npm run test:unit before declaring done
- When done: list files changed, ACs checked ✅, test command output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-LAUNCH-013-01 | Auto (unit) | P0 | Given subscription with status=ACTIVE, planTier=SOLO, currentPeriodEnd=now+48h, renewalReminderSentAt=null — when sendRenewalReminders() runs — then EmailService.send called once and renewalReminderSentAt written via Prisma mock | ✅ | |
| TC-LAUNCH-013-02 | Auto (unit) | P0 | Given EmailService.send returns { sent: false } — when sendRenewalReminders() runs for a qualifying subscription — then renewalReminderSentAt is NOT updated and no exception propagates from the method | ✅ | |
| TC-LAUNCH-013-03 | Auto (unit) | P1 | Given subscription with renewalReminderSentAt set to a value >= currentPeriodStart — when sendRenewalReminders() runs — then EmailService.send is NOT called for that subscription | ✅ | |
| TC-LAUNCH-013-04 | Auto (unit) | P1 | Given subscription with currentPeriodEnd = now+96h (outside 72h window) — when sendRenewalReminders() runs — then EmailService.send is NOT called | ✅ | |
| TC-LAUNCH-013-05 | Auto (unit) | P1 | Given subscription with planTier=FREE and status=ACTIVE — when sendRenewalReminders() runs — then EmailService.send is NOT called | ✅ | Added after merge (was a gap): asserts `findMany`'s `where.planTier` clause is `{ not: PlanTier.FREE }` directly, rather than mocking a FREE-tier row through `findMany` — the service has no in-memory planTier guard, so the query filter is the only enforcement point and is what the test needs to verify. |
| TC-LAUNCH-013-06 | Manual | P1 | Given RESEND_API_KEY absent in dev environment — when sendRenewalReminders() is invoked directly (e.g., via a one-off NestJS bootstrap script or test call) against a qualifying subscription row — then a [DEV EMAIL] log line appears in console containing plan name, ₹ amount, and renewal date | ⏸ | Deferred — no qualifying subscription row exists yet (no real ACTIVE subscription has been created since RazorPay went live) |
| TC-LAUNCH-013-07 | Manual | P2 | Given a real ACTIVE subscription in the DB with currentPeriodEnd within 72h and RESEND_API_KEY set — when sendRenewalReminders() is invoked directly — then email arrives in the real inbox with correct plan name, ₹ amount (matching Subscription.amount/100), and renewal date | ⏸ | Deferred — same root cause as TC-06; will be testable once a real subscription exists (US-LAUNCH-005 AC6) |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded — TC-01–05 auto, all pass; TC-06/07 deferred, see exception below
- [x] `npm run check` passes (0 new TypeScript errors)
- [x] `npm run test:unit` passes (no regressions)
- [x] `npx prisma generate --schema=api/prisma/schema.prisma` run after schema change
- [x] Manual flow verified — deferred with documented exception below
- [x] PR merged — no PR; deployed via direct commit, documented exception below
- [x] [TASKS.md](./TASKS.md) task list fully checked

> **DoD exception 1:** TC-LAUNCH-013-06/07 (manual [DEV EMAIL] log check + real inbox delivery) not run — both require a qualifying ACTIVE subscription with `currentPeriodEnd` inside the 72h window, which doesn't exist yet since no real transaction has been completed (same root cause as the US-LAUNCH-006/012 exceptions). Will be testable the first time a real subscription is purchased (US-LAUNCH-005 AC6). Approved by: Dinesh, 2026-07-29.
> **DoD exception 2:** No PR was opened — code shipped via direct commits `fa1d345` (implementation) + `5c52dc0` (TC-05 test) to `main`. Gate 1 passed. Approved by: Dinesh, 2026-07-29.

---

*Story created: 2026-07-24*
