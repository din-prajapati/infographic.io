# Story Card — US-LAUNCH-002

> **Status:** 🔲 Not Started
> **Feature:** F-LAUNCH-02 — Transactional Email
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-01-public-beta](../../milestones/M-LAUNCH-01-public-beta.md)
> **Size:** M
> **Linear:** LIN-XXX
> **Created:** 2026-07-07 | **Closed:** —

---

## Story

*As the* product operator
*I want* a provider-agnostic transactional email service in the NestJS API
*So that* password resets (US-LAUNCH-003) and payment receipts (US-LAUNCH-006) can be sent — today the app has no way to email a user at all.

---

## Acceptance Criteria

- [ ] **AC1:** New NestJS module `api/src/modules/email/` exports an `EmailService` with a provider-agnostic interface: `send({ to, subject, html, text })` — callers never reference the provider by name (same generic-naming rule as `promptTemplate`)
- [ ] **AC2:** Resend implementation used when `RESEND_API_KEY` is set; reads `EMAIL_FROM` for the from-address; no provider SDK import outside the email module
- [ ] **AC3:** When `RESEND_API_KEY` is absent (local dev), `EmailService.send()` logs the full message to console and resolves successfully — the app never crashes or blocks on missing email config
- [ ] **AC4:** `send()` failures are caught and logged (returns `{ sent: false }`), never thrown to callers — email must not break auth or webhook flows
- [ ] **AC5:** Unit tests (`api/tests/email/email.service.spec.ts`) cover: provider called with correct payload, console fallback path, and error swallowing — all mock-based, no network

---

## Out of Scope

- Actual emails sent from any flow (password reset = US-LAUNCH-003, receipts = US-LAUNCH-006)
- Email queue, retries, rate limiting — Phase 3
- HTML template system / branded email designer — inline templates per email are fine for now
- Marketing/campaign email of any kind
- Domain DNS setup for Resend (HUMAN task, tracked in ENV.yaml)

---

## Engineering / PR

- **Branch:** `feat/launch-us-launch-002-email-service`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/modules/email/email.module.ts` (new)
  - `api/src/modules/email/email.service.ts` (new)
  - `api/src/app.module.ts` (register module)
  - `api/tests/email/email.service.spec.ts` (new)
  - `package.json` (add `resend` dependency)

---

## AI Implementation Prompt

> Copy this block into Claude Code / Cursor to implement the story.

```
Context: InfographicAI SaaS — NestJS 11 API (api/src). See CLAUDE.md.
DatabaseModule is @Global() — do not re-provide PrismaService.

Story: US-LAUNCH-002 — Transactional email foundation

Create api/src/modules/email/ with an EmailService: send({ to, subject, html, text }).
- RESEND_API_KEY set → send via Resend SDK using EMAIL_FROM
- RESEND_API_KEY absent → log message to console, resolve { sent: true, dev: true }
- Any provider error → catch, log, resolve { sent: false } (never throw)
Naming must be provider-agnostic everywhere outside the module (EmailService, not
ResendService). Make the module exportable for auth + payments modules to import.
Unit tests: mock the provider; cover happy path, dev fallback, error swallow.

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- Do NOT implement anything in "Out of scope"
- When done: list files changed, ACs checked, test command to run
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-LAUNCH-002-01 | Auto (unit) | P0 | Given RESEND_API_KEY set, when send() called, then provider receives to/from/subject/html exactly as passed | 🔲 | |
| TC-LAUNCH-002-02 | Auto (unit) | P0 | Given no RESEND_API_KEY, when send() called, then message logged to console and promise resolves | 🔲 | |
| TC-LAUNCH-002-03 | Auto (unit) | P1 | Given provider throws, when send() called, then no exception propagates and result is { sent: false } | 🔲 | |
| TC-LAUNCH-002-04 | Manual | P1 | Given a real RESEND_API_KEY in .env, when triggering a test send, then email arrives in a real inbox | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual flow verified on `localhost:5000`
- [ ] PR merged (PR #_____)
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-07-07*
