# PR Task List — US-LAUNCH-013

> **Story:** [STORY.md](./STORY.md) | **Branch:** `feat/launch-us-launch-013-renewal-reminder-email` | **Type:** feat | **PR:** none — merged directly to `main` via `fa1d345` + `5c52dc0`

```
feat(launch): subscription renewal reminder email — US-LAUNCH-013
```

This story introduces a new dependency (`@nestjs/schedule`) and a schema migration — run `npm install` and `npx prisma generate` as part of T1/T2 below, not as an afterthought.

## Three Pillars Pre-flight

- [x] **Brain** — STORY.md ACs written and read
- [x] **Muscle** — File list + ordered tasks confirmed below
- [x] **Map** — ARCHITECTURE.mmd (EPIC-LAUNCH-01) reviewed
- [x] **Env** — ENV.yaml loaded, `RESEND_API_KEY`/`EMAIL_FROM` confirmed present in local `.env`

## Closure

- [x] T1–T4 implemented, Gate 1 green (`npm run check` + `npm run test:unit`)
- [x] ~~PR opened~~ _(no PR — merged directly to `main` via `fa1d345` + `5c52dc0`)_
- [x] STORY.md ACs + DoD updated ✅ (2026-07-29)

## PR Scope

One-liner: one new `@Cron` job that emails subscribers ~3 days before renewal, guarded against duplicate sends by a new `renewalReminderSentAt` field — no queue, no retry infra, no change to how billing dates are computed.

## Task Breakdown

- **T1** — `package.json` + `api/prisma/schema.prisma`: add `@nestjs/schedule` dependency, add `renewalReminderSentAt DateTime?` to `Subscription`, run `npx prisma generate --schema=api/prisma/schema.prisma`
- **T2** — `api/src/app.module.ts`: register `ScheduleModule.forRoot()`
- **T3** — `api/src/modules/payments/services/renewal-reminder.service.ts` (new) + `api/src/modules/payments/payments.module.ts`: `RenewalReminderService` with `@Cron('0 8 * * *')`, wired into `PaymentsModule` providers (and `EmailModule` import if not already added by US-LAUNCH-012)
- **T4** — `api/tests/payments/renewal-reminder.spec.ts` (new): unit tests for AC1, AC3/AC4, AC(cycle-guard), AC(window-guard)

## File-to-Task Mapping

| File | Task |
|---|---|
| `package.json` | T1 |
| `api/prisma/schema.prisma` | T1 |
| `api/src/app.module.ts` | T2 |
| `api/src/modules/payments/services/renewal-reminder.service.ts` | T3 |
| `api/src/modules/payments/payments.module.ts` | T3 |
| `api/tests/payments/renewal-reminder.spec.ts` | T4 |

## Exact Test Commands

```bash
npm install @nestjs/schedule
npx prisma generate --schema=api/prisma/schema.prisma
npm run check && npm run test:unit
npm run dev   # confirm boots cleanly with ScheduleModule registered
# Manual: invoke sendRenewalReminders() directly (dev script or temp test call) against a qualifying row, confirm [DEV EMAIL] log or real email
```

## Anti-patterns to avoid

- Do not add BullMQ/Redis or any general job-queue system — one `@Cron` method only, per Out of Scope
- Do not attempt the cycle-guard as a single Prisma `where` clause — Prisma can't compare two columns; use DB query + in-memory filter (see AI Implementation Prompt)
- Do not call the RazorPay API from inside the cron job — read `currentPeriodEnd`/`currentPeriodStart` only from the DB, they're already populated by the existing webhook handler

*Tasks created: 2026-07-24*
