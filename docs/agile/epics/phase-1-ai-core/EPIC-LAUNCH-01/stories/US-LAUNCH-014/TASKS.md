# PR Task List — US-LAUNCH-014

> **Story:** [STORY.md](./STORY.md) | **Branch:** `feat/launch/us-launch-014-signup-verification-gate` | **Type:** feat | **PR:** [#55](https://github.com/din-prajapati/infographic.io/pull/55)

```
feat(launch): sign-up verification gate + abuse controls — US-LAUNCH-014
```

Backlog item — not launch-blocking. Re-scoped 2026-09-14 (M → L). Email verification now gates the five AI-spend routes; disposable domains and Gmail aliases are refused at sign-up; email-sending endpoints get per-IP limits on a proxy-aware tracker. Existing users are grandfathered via `emailVerified @default(true)`.

## Four Pillars Pre-flight

- [x] **Brain** — STORY.md ACs read, including "Why this was re-scoped"
- [x] **Muscle** — File list + ordered tasks confirmed below
- [x] **Map** — ARCHITECTURE.mmd (EPIC-LAUNCH-01) reviewed; `disposable-email-domains-js` export API inspected
- [x] **Env** — `RESEND_API_KEY`/`EMAIL_FROM` absent locally → EmailService dev-fallback logs `[DEV EMAIL]` (confirmed in `email.service.ts`); `TRUSTED_PROXY_HOPS` documented in `.env.example`, value to be confirmed on staging (MV-014-06)

## PR Scope

One-liner: unverified new accounts can sign in and explore but cannot spend AI credits until they verify; throwaway domains, Gmail aliases and scripted sign-ups are stopped before an organization is ever created.

## Task Breakdown

- [x] **T1** — `api/prisma/schema.prisma`: `emailVerified @default(true)` (grandfathering comment), `emailVerifiedAt`, `emailNormalized @unique`, `EmailVerificationToken`; `npx prisma generate`
- [x] **T2** — `package.json` + `api/src/modules/auth/utils/email-policy.ts` (new) + `api/tests/auth/email-policy.spec.ts` (new): `normalizeEmail`, `isDisposableEmail`
- [x] **T3** — `auth.service.ts` + `auth.controller.ts` + `auth.dto.ts` + `api/tests/auth/email-verification.spec.ts` (new): register checks, verification send, verify / resend, googleLogin normalized link
- [x] **T4** — `api/src/common/guards/email-verified.guard.ts` (new) + spec + apply to `infographics.controller.ts`, `generations.controller.ts`, `extractions.controller.ts`
- [x] **T5** — `api/src/common/guards/proxy-aware-throttler.guard.ts` (new) + spec + `app.module.ts` + `server/index.ts` (`xfwd`) + `.env.example` + `@Throttle` on register / resend / forgot-password
- [x] **T5b** — `api/src/common/filters/http-exception.filter.ts` + `api/tests/common/http-exception-filter.spec.ts` (new): pass a thrower-supplied `code` through to the response body. **Added 2026-09-18 during implementation, approved by the product owner.** The backend pass proved the filter rebuilds every error as `{ statusCode, message }` and drops `code`, so AC9 could not work as written and `BETA_MODE_ACTIVE` has the same latent bug. Additive only: `code` appears when the thrower set one, nothing else changes.
- [x] **T6** — `shared/schema.ts`, `client/src/lib/queryClient.ts`, `EmailVerificationRequiredDialog.tsx` (new), `EmailVerificationBanner.tsx` (new), `VerifyEmailPage.tsx` (new), `client/src/App.tsx`

- [x] **T7** — internal test-account allowlist: `email-policy.ts` (`isInternalTestEmail`), `auth.service.ts` (register bypass), `proxy-aware-throttler.guard.ts` (`shouldSkip`), `.env.example` + epic `ENV.yaml`, `scripts/seed-test-users.mjs` (new) + `package.json` script, and the three specs extended. **Added 2026-09-18, approved by the product owner.** Without it AC8/AC12 break this repo's own E2E suite: 12 specs register `@test.local` then hit a gated route (403), and one run exceeds 5 sign-ups/hour from a single CI IP (429).

- [x] **T7b** — exempt internal-test traffic from the **global** `100/min` cap: `proxy-aware-throttler.guard.ts` (add `/auth/login` to the exemptible paths; new `isInternalTestSession()` verifying the Bearer JWT against `JWT_SECRET`) + `proxy-aware-throttler.spec.ts`. **Added 2026-09-19, approved by the product owner.** Measured cause of the E2E flakiness: a suite run exhausts the shared bucket (120 rapid requests → 100×200 then 20×429) and `POST /auth/login` is then refused, which reads as a broken login. T7's sign-up exemption could not fix it — the budget goes on authenticated GETs, not the four auth endpoints. Result: `us-ai-040` + `us-launch-003` went from 19 passed / 8 failed to **27 passed / 0 failed**.

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
| `api/src/common/filters/http-exception.filter.ts` | T5b |
| `api/tests/common/http-exception-filter.spec.ts` | T5b |
| `shared/schema.ts` | T6 |
| `client/src/lib/queryClient.ts` | T6 |
| `client/src/components/auth/EmailVerificationRequiredDialog.tsx` | T6 |
| `client/src/components/ui/EmailVerificationBanner.tsx` | T6 |
| `client/src/pages/auth/VerifyEmailPage.tsx` | T6 |
| `client/src/App.tsx` | T6 |
| `api/src/modules/auth/utils/email-policy.ts` | T2, T7 |
| `api/src/modules/auth/services/auth.service.ts` | T3, T7 |
| `api/src/common/guards/proxy-aware-throttler.guard.ts` | T5, T7 |
| `.env.example` | T5, T7 |
| `docs/agile/epics/phase-1-ai-core/EPIC-LAUNCH-01/ENV.yaml` | T7 |
| `scripts/seed-test-users.mjs` | T7 |
| `package.json` | T2, T7 |
| `api/tests/auth/email-policy.spec.ts` | T2, T7 |
| `api/tests/auth/email-verification.spec.ts` | T3, T7 |
| `api/tests/common/proxy-aware-throttler.spec.ts` | T5, T7, T7b |
| `api/src/common/guards/proxy-aware-throttler.guard.ts` (2nd pass) | T7b |

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
- Do not let any request-supplied value (header, query param, body flag) select the test-account bypass — only the email domain matched against a server-side env var. A client-selectable bypass would hand anyone a verified account.
- Do not use suffix or parent-domain matching for the allowlist — `evil-test.local` must not match `test.local`. (This is the opposite of the disposable check, which deliberately walks parents.)
- Do not set `INTERNAL_TEST_EMAIL_DOMAINS` in production, and do not make the seed script depend on it — production test accounts are seeded directly, never registered through the bypass.
- Do not read the email from an **unverified** JWT payload when deciding the T7b exemption — base64 is not a secret, and a forged `{"email":"x@test.local"}` would opt any sender out of rate limiting on every route. `jwt.verify` against `JWT_SECRET`, or no exemption.
- When an E2E spec fails, **run it alone before theorising**. This story burned two wrong diagnoses (memory pressure, then the `redirect_to_auth` race) on a failure whose cause was visible in one command: the test passes 3/3 in isolation and fails 3/3 inside its file, which points at accumulated state, not at the test.
- Do not key the verify dialog off a bare 403 — `usage-limit.service.ts` throws 403 for the monthly cap, so a hit free-tier limit would wrongly prompt for verification. Match on `code === 'EMAIL_NOT_VERIFIED'` (hence T5b).

*Tasks created: 2026-07-25 · Re-scoped: 2026-09-14*
