# PR Task List — US-LAUNCH-012

> **Story:** [STORY.md](./STORY.md) | **Branch:** `feat/launch-us-launch-012-payment-failed-email` | **Type:** feat

```
feat(launch): payment-failed email notification — US-LAUNCH-012
```

## Three Pillars Pre-flight

- [ ] **Brain** — STORY.md ACs written and read
- [ ] **Muscle** — File list + ordered tasks confirmed below
- [ ] **Map** — ARCHITECTURE.mmd (EPIC-LAUNCH-01) reviewed
- [ ] **Env** — ENV.yaml loaded, `RESEND_API_KEY`/`EMAIL_FROM` confirmed present in local `.env`

## PR Scope

One-liner: hook a payment-failed email into the existing `PAST_DUE` webhook branch — no new detection logic, no state-machine changes.

## Task Breakdown

- **T1** — `api/src/modules/payments/payments.module.ts`: import `EmailModule`, wire `EmailService` into `PaymentsService`'s factory/constructor
- **T2** — `api/src/modules/payments/services/payments.service.ts`: add `emailService.send(...)` call (try/catch) after the existing `PAST_DUE` `updateSubscription` line
- **T3** — `api/tests/payments/payment-failed-email.spec.ts` (new): unit tests for AC1/AC2, AC3, AC4

## File-to-Task Mapping

| File | Task |
|---|---|
| `api/src/modules/payments/payments.module.ts` | T1 |
| `api/src/modules/payments/services/payments.service.ts` | T2 |
| `api/tests/payments/payment-failed-email.spec.ts` | T3 |

## Exact Test Commands

```bash
npm run check && npm run test:unit
# Manual (once live, US-LAUNCH-005 AC6): fail a real charge, confirm email arrives with plan/₹/​/account link
```

## Anti-patterns to avoid

- Do not touch webhook signature verification or the `PAST_DUE` transition logic itself — only add the email side-effect
- Do not add a retry/queue for the email — `EmailService` already swallows and logs failures
- Do not build a dunning sequence (multiple follow-ups) — this story is one email per failure event

*Tasks created: 2026-07-24*
