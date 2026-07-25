# PR Task List — US-LAUNCH-014

> **Story:** [STORY.md](./STORY.md) | **Branch:** `feat/launch-us-launch-014-email-verification` | **Type:** feat

```
feat(launch): email verification for new local accounts — US-LAUNCH-014
```

Backlog item — not launch-blocking. Introduces a new dependency-free Prisma model (`EmailVerificationToken`, mirrors the existing `PasswordResetToken` pattern) and two new auth endpoints.

## Three Pillars Pre-flight

- [ ] **Brain** — STORY.md ACs written and read
- [ ] **Muscle** — File list + ordered tasks confirmed below
- [ ] **Map** — ARCHITECTURE.mmd (EPIC-LAUNCH-01) reviewed
- [ ] **Env** — ENV.yaml loaded, `RESEND_API_KEY`/`EMAIL_FROM` confirmed present in local `.env`

## PR Scope

One-liner: soft (non-blocking) email verification — new user gets a verification email + link, an in-app banner nudges unverified users to verify, but zero product features are gated on it.

## Task Breakdown

- **T1** — `api/prisma/schema.prisma`: add `emailVerified`/`emailVerifiedAt` to `User`, add `EmailVerificationToken` model (mirrors `PasswordResetToken`), run `npx prisma generate`
- **T2** — `api/src/modules/auth/services/auth.service.ts` + `api/src/modules/auth/dto/auth.dto.ts`: `register()` sends verification email + creates token; `login()`/`register()` expose `emailVerified`; new `verifyEmail()` + `resendVerification()` methods; `googleLogin()` sets `emailVerified: true` for new OAuth users
- **T3** — `api/src/modules/auth/controllers/auth.controller.ts`: `POST /auth/verify-email` (public) + `POST /auth/resend-verification` (JWT-guarded)
- **T4** — `shared/schema.ts`: add `emailVerified?: boolean` to `LegacyUser`
- **T5** — `client/src/pages/auth/VerifyEmailPage.tsx` (new) + `client/src/App.tsx`: public verify-email route
- **T6** — `client/src/components/ui/EmailVerificationBanner.tsx` (new) + `client/src/App.tsx`: non-blocking banner in `AppLayoutWithHeader`
- **T7** — `api/tests/auth/email-verification.spec.ts` (new): unit tests for all AC11 scenarios

## File-to-Task Mapping

| File | Task |
|---|---|
| `api/prisma/schema.prisma` | T1 |
| `api/src/modules/auth/services/auth.service.ts` | T2 |
| `api/src/modules/auth/dto/auth.dto.ts` | T2 |
| `api/src/modules/auth/controllers/auth.controller.ts` | T3 |
| `shared/schema.ts` | T4 |
| `client/src/pages/auth/VerifyEmailPage.tsx` | T5 |
| `client/src/App.tsx` | T5, T6 |
| `client/src/components/ui/EmailVerificationBanner.tsx` | T6 |
| `api/tests/auth/email-verification.spec.ts` | T7 |

## Exact Test Commands

```bash
npx prisma generate --schema=api/prisma/schema.prisma
npm run check && npm run test:unit
npm run dev   # manual: register a fresh account, confirm [DEV EMAIL] log has the verify link; open it; confirm success state
```

## Anti-patterns to avoid

- Do not gate any product feature (generation, editor, templates, account) behind `emailVerified` — this is a soft/trust-signal-only story
- Do not touch `PasswordResetToken`, `forgotPassword()`, or `resetPassword()` — this is a parallel, independent token type
- Do not add verification for Google OAuth signups — they're auto-verified at creation

*Tasks created: 2026-07-25*
