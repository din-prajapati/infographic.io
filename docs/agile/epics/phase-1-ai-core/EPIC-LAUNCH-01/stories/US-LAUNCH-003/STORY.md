# Story Card — US-LAUNCH-003

> **Status:** 🟡 Implemented — code complete, Gate 1 + 8 unit tests green, merged to `main`. ⚠️ Live DB migration (`PasswordResetToken` table via `prisma db push`) runs on next deploy (`db:deploy`); manual E2E (TC-05) pending. Awaiting M-LAUNCH-01 close (Task 3).
> **Feature:** F-LAUNCH-02 — Transactional Email
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-01-public-beta](../../milestones/M-LAUNCH-01-public-beta.md)
> **Size:** M
> **Depends on:** US-LAUNCH-002 must be merged before this story can start.
> **Linear:** LIN-XXX
> **Created:** 2026-07-07 | **Closed:** —

---

## Story

*As a* registered agent who forgot my password
*I want* to receive a reset link by email and set a new password
*So that* I don't permanently lose my account (and everything I've paid for) — today there is no recovery path at all.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** `POST /api/v1/auth/forgot-password` accepts `{ email }`, always returns 200 with a generic message (no user enumeration), and for existing local-password accounts creates a `PasswordResetToken` row (new Prisma model: hashed token, userId, `expiresAt` = +1h, `usedAt` nullable)
- [x] **AC2 [security]:** Reset email sent via `EmailService` containing a link to `/auth/reset?token={rawToken}`; the raw token is never stored (store SHA-256 hash)
- [x] **AC3 [error-path]:** `POST /api/v1/auth/reset-password` with `{ token, newPassword }` validates token (exists, unexpired, unused), updates the user's bcrypt hash, marks token used — expired/used/unknown tokens return 400 with a safe message
- [x] **AC4 [happy-path]:** Frontend: "Forgot password?" link on the AuthPage login form → `/auth/forgot` (email form) and `/auth/reset` (new-password form) pages, both public routes, with success/error states
- [x] **AC5 [edge-case]:** Google-OAuth-only accounts (no local password) receive an email saying "this account signs in with Google" instead of a reset link — still 200 to the caller

---

## Out of Scope

- Email-change / verify-email flow
- 2FA, magic-link login, session revocation UI
- Password strength meter beyond the existing register validation rules (reuse them)
- Rate limiting infrastructure (note: acceptable v1 = token creation throttled per-user by deleting prior unused tokens)

---

## Engineering / PR

- **Branch:** `feat/launch-us-launch-003-password-reset`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/prisma/schema.prisma` (PasswordResetToken model)
  - `api/src/modules/auth/services/auth.service.ts`
  - `api/src/modules/auth/controllers/auth.controller.ts` `(TBC — match actual controller path)`
  - `client/src/pages/AuthPage.tsx` + `client/src/pages/auth/ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx` (new)
  - `client/src/App.tsx` (routes)

---

## AI Implementation Prompt

> Copy this block into Claude Code / Cursor to implement the story.

```
Context: InfographicAI SaaS — NestJS API (3001) + React/Wouter frontend (5000). See CLAUDE.md.
Prisma 6 is canonical (api/prisma/schema.prisma). Auth = Passport local + JWT, bcrypt hashes.
EmailService exists at api/src/modules/email (US-LAUNCH-002) — provider-agnostic send().

Story: US-LAUNCH-003 — Forgot / reset password flow

Backend: PasswordResetToken model (id, userId, tokenHash, expiresAt, usedAt?, createdAt);
POST /api/v1/auth/forgot-password (always 200, no enumeration; delete prior unused tokens
for the user; email link with raw token, store sha256 hash; OAuth-only users get a
"sign in with Google" email); POST /api/v1/auth/reset-password (validate, bcrypt-update,
mark used). Frontend: /auth/forgot + /auth/reset pages (public), "Forgot password?" link
on the login form. Run npx prisma db push after schema change.

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- Do NOT implement anything in "Out of scope"
- Email failures must not 500 the endpoint (EmailService already swallows)
- When done: list files changed, ACs checked, test command to run
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-LAUNCH-003-01 | Auto (unit) | P0 | Given an existing local account, when forgot-password called, then token row created (hashed, 1h expiry) and EmailService.send invoked with reset link | 🔲 | |
| TC-LAUNCH-003-02 | Auto (unit) | P0 | Given a valid unexpired token, when reset-password called, then bcrypt hash updated and token marked used; reusing same token → 400 | 🔲 | |
| TC-LAUNCH-003-03 | Auto (unit) | P0 | Given an unknown email, when forgot-password called, then 200 returned and no token created (no enumeration) | 🔲 | |
| TC-LAUNCH-003-04 | Auto (unit) | P1 | Given an expired token, when reset-password called, then 400 and password unchanged | 🔲 | |
| TC-LAUNCH-003-05 | E2E | P0 | Full flow on localhost: request reset → console-logged email link → open → set new password → login works with new password, old fails | ⏸ | E2E written, `test.skip`'d until deploy (needs `PasswordResetToken` table via `prisma db push`) — `e2e/us-launch-003-password-reset.spec.ts` |
| TC-LAUNCH-003-06 | Auto (unit) | P1 | Given a Google-OAuth-only account, when forgot-password called, then "signs in with Google" email sent, no token created | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [ ] All test cases run and recorded
- [x] `npm run check` passes
- [x] `npm run test:unit` passes
- [ ] Manual flow verified on `localhost:5000`
- [ ] PR merged (PR #_____)
- [ ] No console errors for the changed flow
- [x] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-07-07*
