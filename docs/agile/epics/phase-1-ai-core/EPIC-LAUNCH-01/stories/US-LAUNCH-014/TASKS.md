# PR Task List — US-LAUNCH-014

> **Story:** [STORY.md](./STORY.md) | **Branch:** `feat/launch/us-launch-014-signup-verification-gate` | **Type:** feat

```
feat(launch): sign-up verification gate + abuse controls — US-LAUNCH-014
```

Backlog item — not launch-blocking. Re-scoped 2026-09-14 (M → L). Email verification now gates the five AI-spend routes; disposable domains and Gmail aliases are refused at sign-up; email-sending endpoints get per-IP limits on a proxy-aware tracker. Existing users are grandfathered via `emailVerified @default(true)`.

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md ACs read, including "Why this was re-scoped"
- [ ] **Muscle** — File list + ordered tasks confirmed below
- [ ] **Map** — ARCHITECTURE.mmd (EPIC-LAUNCH-01) reviewed; `disposable-email-domains-js` export API inspected
- [ ] **Env** — `RESEND_API_KEY`/`EMAIL_FROM` present locally (or dev-email logging confirmed); `TRUSTED_PROXY_HOPS` planned for staging

## PR Scope

One-liner: unverified new accounts can sign in and explore but cannot spend AI credits until they verify; throwaway domains, Gmail aliases and scripted sign-ups are stopped before an organization is ever created.

## Task Breakdown

- **T1** — `api/prisma/schema.prisma`: `emailVerified @default(true)` (grandfathering comment), `emailVerifiedAt`, `emailNormalized @unique`, `EmailVerificationToken`; `npx prisma generate`
- **T2** — `package.json` + `api/src/modules/auth/utils/email-policy.ts` (new) + `api/tests/auth/email-policy.spec.ts` (new): `normalizeEmail`, `isDisposableEmail`
- **T3** — `auth.service.ts` + `auth.controller.ts` + `auth.dto.ts` + `api/tests/auth/email-verification.spec.ts` (new): register checks, verification send, verify / resend, googleLogin normalized link
- **T4** — `api/src/common/guards/email-verified.guard.ts` (new) + spec + apply to `infographics.controller.ts`, `generations.controller.ts`, `extractions.controller.ts`
- **T5** — `api/src/common/guards/proxy-aware-throttler.guard.ts` (new) + spec + `app.module.ts` + `server/index.ts` (`xfwd`) + `.env.example` + `@Throttle` on register / resend / forgot-password
- **T6** — `shared/schema.ts`, `client/src/lib/queryClient.ts`, `EmailVerificationRequiredDialog.tsx` (new), `EmailVerificationBanner.tsx` (new), `VerifyEmailPage.tsx` (new), `client/src/App.tsx`

## File-to-Task Mapping

| File | Task |
|---|---|
| `api/prisma/schema.prisma` | T1 |
| `package.json`, `package-lock.json` | T2 |
| `api/src/modules/auth/utils/email-policy.ts` | T2 |
| `api/tests/auth/email-policy.spec.ts` | T2 |
| `api/src/modules/auth/services/auth.service.ts` | T3 |
| `api/src/modules/auth/controllers/auth.controller.ts` | T3, T5 |
| `api/src/modules/auth/dto/auth.dto.ts` | T3 |
| `api/tests/auth/email-verification.spec.ts` | T3 |
| `api/src/common/guards/email-verified.guard.ts` | T4 |
| `api/tests/common/email-verified.guard.spec.ts` | T4 |
| `api/src/modules/infographics/controllers/infographics.controller.ts` | T4 |
| `api/src/modules/infographics/controllers/generations.controller.ts` | T4 |
| `api/src/modules/infographics/controllers/extractions.controller.ts` | T4 |
| `api/src/common/guards/proxy-aware-throttler.guard.ts` | T5 |
| `api/tests/common/proxy-aware-throttler.spec.ts` | T5 |
| `api/src/app.module.ts` | T5 |
| `server/index.ts` | T5 |
| `.env.example` | T5 |
| `shared/schema.ts` | T6 |
| `client/src/lib/queryClient.ts` | T6 |
| `client/src/components/auth/EmailVerificationRequiredDialog.tsx` | T6 |
| `client/src/components/ui/EmailVerificationBanner.tsx` | T6 |
| `client/src/pages/auth/VerifyEmailPage.tsx` | T6 |
| `client/src/App.tsx` | T6 |

## Exact Test Commands

```bash
npx prisma generate --schema=api/prisma/schema.prisma
npm run check && npm run test:unit
cd api && npx vitest run tests/auth/email-policy.spec.ts tests/auth/email-verification.spec.ts tests/common/email-verified.guard.spec.ts tests/common/proxy-aware-throttler.spec.ts --reporter=verbose
npm run dev   # manual TC-13..TC-17, TC-19 — api/ edits need a full dev-server restart
# staging: TC-18 (TRUSTED_PROXY_HOPS) before enabling the register limit in production
```

## Anti-patterns to avoid

- Do not default `emailVerified` to `false` in the schema — `db push` would lock every existing user out of generating.
- Do not read `emailVerified` from the JWT or `localStorage` in the guard — the DB is the only source of truth.
- Do not gate login, onboarding or the editor — the gate protects spend, not access; over-gating costs real sign-ups.
- Do not ship the `@Throttle` limits without the proxy-aware tracker — behind the Express proxy every user shares one IP and 5 registrations/hour would apply to the whole product.
- Do not take the leftmost `X-Forwarded-For` entry — it is client-controlled.
- Do not use `normalizeEmail()` output as the login or send address — duplicate detection only.

*Tasks created: 2026-07-25 · Re-scoped: 2026-09-14*
