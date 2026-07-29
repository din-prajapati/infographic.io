# Story Card — US-LAUNCH-012

> **Status:** ✅ Done
> **Feature:** F-LAUNCH-02 — Transactional Email
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-02-revenue-on](../../milestones/M-LAUNCH-02-revenue-on.md)
> **Size:** S
> **Depends on:** US-LAUNCH-002 (EmailService) merged.
> **Linear:** LIN-XXX
> **Created:** 2026-07-24 | **Closed:** 2026-07-29

---

## Story

*As a* paying subscriber whose renewal charge has just failed
*I want* to receive an email immediately telling me the charge failed, what plan it was for, and how to reach my account page
*So that* I can update my payment method before my access silently lapses — today the subscription flips to PAST_DUE with zero notification to the subscriber.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When `handlePaymentFailed` in `payments.service.ts` successfully executes `updateSubscription(subscription.id, { status: PAST_DUE })` for the first time for a given payment ID (i.e., the idempotency check at the top of the method did not fire an early return), `EmailService.send()` is called exactly once with `to` set to `subscription.user.email`.

- [x] **AC2 [happy-path]:** The email passed to `EmailService.send()` satisfies all four content requirements: (a) `subject` contains the words "payment" and "failed" (case-insensitive); (b) `html` or `text` body contains the plan name derived from `subscription.planTier` (e.g., "SOLO", "TEAM"); (c) body contains the failed charge amount in ₹, computed as `paymentData.amount / 100` (paise-to-rupee conversion, no fractional rupees needed); (d) body contains the string `/account` as the call-to-action URL pointing to the subscriber's account page.

- [x] **AC3 [error-path]:** If `EmailService.send()` throws or returns `{ sent: false }`, `handlePaymentFailed` does not rethrow — the method completes normally, the webhook handler can return HTTP 200, and the subscription record in the database retains `PAST_DUE` status.

- [x] **AC4 [edge-case]:** When `handlePaymentFailed` is called with a RazorPay payment ID that `getPaymentByExternalId` already has on record (duplicate webhook event — the early-return idempotency guard at the top of the method fires), `EmailService.send()` is NOT called.

- [x] **AC5 [regression]:** Unit tests in `api/tests/payments/payment-failed-email.spec.ts` cover: (a) first-time failure event → `EmailService.send` mock asserted called with `to = subscription.user.email`, plan name, ₹ amount, and `/account` in the body; (b) `EmailService.send` throws → handler resolves without throwing, `updateSubscription` still called with `PAST_DUE`; (c) duplicate event (idempotency path) → `EmailService.send` mock asserted never called.

---

## Out of Scope

- Any retry or queue mechanism for failed email delivery — `EmailService`'s existing swallow-and-log behaviour is the complete error strategy; no new infrastructure.
- Any change to RazorPay webhook signature verification or to the `PAST_DUE` subscription state-transition logic — those lines in `payments.service.ts` must not be modified.
- A grace-period or access-revocation policy change — what happens after `PAST_DUE` (how long access persists) is determined by existing app behaviour, unchanged by this story.
- GST invoice PDF generation for failed-payment events.
- A dunning sequence (D+3, D+7 follow-up emails while the payment remains uncollected) — this story delivers one notification email per failure event, nothing more.
- Any frontend change to surface the PAST_DUE state to the subscriber (in-app banner, toast, account page badge).

---

## Engineering / PR

- **Branch:** `feat/launch/m-02-emails-and-gate`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/modules/payments/services/payments.service.ts` — add `EmailService` constructor parameter; add `emailService.send(...)` call (wrapped in try/catch) after the `updateSubscription PAST_DUE` line (~line 921)
  - `api/src/modules/payments/payments.module.ts` — import `EmailModule`; add `EmailService` to the `PaymentsService` `useFactory` inject array and constructor call
  - `api/tests/payments/payment-failed-email.spec.ts` — new unit test file covering AC5(a), AC5(b), AC5(c)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
Stack: NestJS 11, Prisma 6, Wouter router. See CLAUDE.md for full architecture.

Story: US-LAUNCH-012 — Payment-failed email notification

As a paying subscriber whose renewal charge fails, I want to receive an email telling me the charge
failed and how to fix it, so that I have a chance to update my payment method before losing access.

Acceptance Criteria:
AC1: When handlePaymentFailed completes updateSubscription(..., { status: PAST_DUE }) for a first-time
     event, EmailService.send() is called once with to = subscription.user.email.
AC2: Email subject contains "payment" and "failed" (case-insensitive). Body contains: planTier
     (e.g. "SOLO"), ₹ amount (paymentData.amount / 100), paymentData.id (RazorPay payment ID),
     and the string "/account" as the CTA link.
AC3: If EmailService.send() throws or returns { sent: false }, handlePaymentFailed does not rethrow;
     webhook returns 200 and subscription remains PAST_DUE.
AC4: If getPaymentByExternalId finds an existing record (duplicate event, early-return fires),
     EmailService.send() is NOT called.
AC5: Unit tests in api/tests/payments/payment-failed-email.spec.ts cover AC1+AC2, AC3, and AC4
     as three separate test cases using vi.fn() mocks.

Implementation notes:
- handlePaymentFailed is in api/src/modules/payments/services/payments.service.ts (~line 885).
  Add the email call AFTER line 921 (updateSubscription PAST_DUE) inside a try/catch that swallows
  all errors.
- subscription from getSubscriptionByExternalId already has user and organization included
  (include: { user: true, organization: true } in subscription-storage.service.ts line 91) —
  no additional DB query is needed to get the user's email.
- PaymentsService constructor currently takes only SubscriptionStorageService. Add:
    private readonly emailService: EmailService
  and update the useFactory in payments.module.ts accordingly:
    import EmailModule; add EmailService to inject array and to new PaymentsService(...) args.
- EmailModule (api/src/modules/email/email.module.ts) already exports EmailService — just import it.
- The /account route exists at client/src/App.tsx line 103 — use it as the CTA URL.

Out of Scope:
- Do NOT change webhook signature verification or subscription state transitions.
- Do NOT add retry/queue logic; EmailService.send() swallows errors already.
- Do NOT add frontend changes, dunning sequences, or grace-period logic.
- Do NOT touch any file not in the Primary files list.

Rules:
- Touch ONLY the three files listed in "Primary files touched"
- Run `npm run check` before declaring done
- Run `npm run test:unit` before declaring done
- When done: list files changed, ACs checked ✅, test command output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-LAUNCH-012-01 | Auto (unit) | P0 | Given a first-time `subscription.payment.failed` webhook (idempotency check passes), when `handlePaymentFailed` runs, then `EmailService.send` is called with `to = subscription.user.email`, plan name, `paymentData.amount / 100` as ₹ amount, `paymentData.id`, and `/account` in the body | ✅ | |
| TC-LAUNCH-012-02 | Auto (unit) | P0 | Given `EmailService.send` rejects with an Error, when `handlePaymentFailed` runs, then the method resolves without throwing and `updateSubscription` was still called with `{ status: PAST_DUE }` | ✅ | |
| TC-LAUNCH-012-03 | Auto (unit) | P1 | Given `getPaymentByExternalId` returns an existing payment record (duplicate event), when `handlePaymentFailed` runs, then `EmailService.send` is never called | ✅ | |
| TC-LAUNCH-012-04 | Manual | P1 | Given the live-mode real ₹ test environment (US-LAUNCH-005), when a charge is deliberately failed, then the payment-failed email arrives in the owner's inbox with the correct plan name, ₹ amount, and a working `/account` link | ⏸ | Deferred — RazorPay live mode is approved and keys are live (US-LAUNCH-005 AC1–4 done); this TC needs a deliberately-failed real charge, which is intentionally not yet run |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded (TC-04 deferred, see exception below)
- [x] `npm run check` passes
- [x] `npm run test:unit` passes
- [x] Manual flow verified — deferred with documented exception below
- [x] PR merged — no PR; deployed via direct commit, documented exception below
- [x] [TASKS.md](./TASKS.md) task list fully checked

> **DoD exception 1:** TC-LAUNCH-012-04 (deliberately-failed real charge → inbox email) not run. RazorPay live mode is fully active (US-LAUNCH-005 AC1–4 done) — not blocked on approval. Deferred because deliberately failing a real charge was out of scope for the Task 3 smoke test. Approved by: Dinesh, 2026-07-29.
> **DoD exception 2:** No PR was opened — code shipped via direct commit `fa1d345` to `main`. Gate 1 passed. Approved by: Dinesh, 2026-07-29.

---

*Story created: 2026-07-24*
