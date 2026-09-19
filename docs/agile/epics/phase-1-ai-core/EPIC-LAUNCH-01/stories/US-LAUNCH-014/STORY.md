# Story Card — US-LAUNCH-014

> **Status:** 🔲 Not Started
> **Priority:** Backlog — should-have, not launch-blocking. Does NOT gate the M-LAUNCH-01 "Acceptance (Done When)" checklist. **Raise priority if free-tier abuse shows up in usage data** — every sign-up currently mints 3 free AI generations.
> **Feature:** F-LAUNCH-02 — Transactional Email
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-01-public-beta](../../milestones/M-LAUNCH-01-public-beta.md)
> **Size:** L (8–12 h) — was M. Re-scoped 2026-09-14 from "soft verification" to **"verify before you generate" + sign-up abuse controls**.
> **Depends on:** US-LAUNCH-002 (EmailService) ✅ and US-LAUNCH-003 (password reset) ✅ — this story mirrors the `PasswordResetToken` pattern.
> **File overlap:** US-LAUNCH-016 (`auth.service.ts`, `App.tsx`, `shared/schema.ts`) — sequence, don't parallelize.
> **Note:** Adds `User.emailVerified`, `User.emailVerifiedAt`, `User.emailNormalized` and a new `EmailVerificationToken` model — run `npx prisma generate --schema=api/prisma/schema.prisma` after the schema change.
> **Linear:** LIN-XXX
> **Created:** 2026-07-25 | **Re-scoped:** 2026-09-14 | **Closed:** —

---

## Why this was re-scoped (2026-09-14)

The original card was a *soft* verification: a banner, nothing blocked. That catches typo'd addresses but **not cost abuse**:

1. `AuthService.register()` creates a **new Organization with FREE = 3 generations** for every sign-up (`auth.service.ts` "Option 2"), and `UsageLimitService.assertCanGenerate()` counts per organization — so every new email address is 3 more paid AI runs (GPT-4o + Ideogram).
2. Throwaway inboxes (10minutemail, mailinator, …) **receive** verification links, so verification alone doesn't stop them.
3. Gmail ignores dots and `+tags`, so one real inbox yields unlimited "different" addresses.
4. **The rate limiter can't see client IPs.** Express proxies `/api/v1` to NestJS via `http-proxy-middleware` without `xfwd`, and NestJS has no proxy-aware tracker — so every request reaches `ThrottlerGuard` from localhost. Today's global `100/min` limit is effectively shared by **all users combined**, and a per-IP sign-up limit would be meaningless (or would lock everyone out).

This story therefore combines: verification **gating AI spend** (not login), a disposable-domain block, alias normalization, and email-endpoint rate limits on a proxy-aware tracker.

---

## Story

*As the* product owner paying for every AI generation
*I want* new email/password accounts to prove a real, permanent inbox before they can spend free AI credits, and throwaway or duplicate-alias sign-ups to be refused up front
*So that* free-tier credits go to real prospects instead of disposable accounts, while genuine new users can still sign in, onboard and explore the editor before verifying.

---

## Acceptance Criteria

### A. Schema

- [x] **AC1 [happy-path]:** `User` gains `emailVerified Boolean @default(true)`, `emailVerifiedAt DateTime?`, `emailNormalized String? @unique`, and relation `emailVerificationTokens EmailVerificationToken[]`. New model `EmailVerificationToken` mirrors `PasswordResetToken` (`id`, `userId` → `User` `onDelete: Cascade`, `tokenHash @unique`, `expiresAt`, `usedAt?`, `createdAt`, `@@index([userId])`).
  **`@default(true)` is deliberate and must carry a schema comment:** `prisma db push` fills existing rows with `true`, so **all pre-existing users are grandfathered** and never blocked; only `register()` writes `false` explicitly (AC5). Google sign-ups inherit `true`.

### B. Sign-up controls

- [x] **AC2 [error-path]:** Disposable domains blocked. `api/src/modules/auth/utils/email-policy.ts` exports `isDisposableEmail(email): boolean`, backed by the maintained **`disposable-email-domains-js`** package (CC0, updated 2026-05; its exact export API is **(TBC)** — wrap it so the source is swappable). It matches the domain **and its parent domains** (`x.mailinator.com` → blocked) and consults a small local `EXTRA_BLOCKED_DOMAINS` array in the same file. `register()` calls it **before** any DB write; a match throws HTTP 400 `{ code: 'DISPOSABLE_EMAIL_NOT_ALLOWED', message: 'Please use a permanent email address — temporary inboxes aren\'t supported.' }` and creates no Organization, User or token.
  Do **not** use the `disposable-email-domains` package — last published 2022.

- [x] **AC3 [edge-case]:** Alias normalization. `email-policy.ts` exports `normalizeEmail(email): string`: lower-case and trim; for every domain strip a `+suffix` from the local part; for `gmail.com` and `googlemail.com` also remove all dots from the local part and map the domain to `gmail.com`. Examples that must hold: `John.Doe+promo@GMail.com` → `johndoe@gmail.com`; `j.o.h.n.doe@googlemail.com` → `johndoe@gmail.com`; `jane+x@company.com` → `jane@company.com`; `jane.smith@company.com` → unchanged.

- [x] **AC4 [idempotency]:** One account per real inbox. `register()` rejects with the existing `ConflictException('User already exists')` (HTTP 409) when a user exists with `email = dto.email` **or** `emailNormalized = normalizeEmail(dto.email)`. The created user stores `emailNormalized`. In `googleLogin()`, the lookup by email also checks `emailNormalized`, so a Google sign-in for `johndoe@gmail.com` **links** to an existing local `john.doe@gmail.com` account instead of creating a second user (and never hits the unique constraint); the new-user branch stores `emailNormalized`.
  The stored `email` (used for login and sending) is always the address as typed — normalization is only for duplicate detection.

### C. Verification flow

- [x] **AC5 [happy-path]:** Send on register. `register()` creates the user with `emailVerified: false`, then (inside try/catch that swallows errors — registration still returns 201) creates an `EmailVerificationToken` (`rawToken = crypto.randomBytes(32).toString('hex')`, only `this.hashToken(rawToken)` stored, `expiresAt = now + 24h`) and calls `EmailService.send()` once with `to` = user email, subject containing "verify", and a body link `{frontendUrl}/auth/verify-email?token={rawToken}`. `register()` and `login()` responses include `user.emailVerified`.

- [x] **AC6 [session-expiry]:** Verify endpoint. `POST /api/v1/auth/verify-email` `{ token }`: a matching, unused, unexpired token → HTTP 200 `{ verified: true, userId }`, sets `User.emailVerified = true`, `emailVerifiedAt = now`, `token.usedAt = now`. Unknown, expired or used token → HTTP 400, no mutation.

- [x] **AC7 [idempotency]:** Resend endpoint. `POST /api/v1/auth/resend-verification` (JWT; 401 otherwise): already verified → 200 `{ alreadyVerified: true }`, no token, no email. Unverified → delete that user's unused tokens, create a new one, send once, 200 `{ sent: true }` regardless of send outcome.

### D. The gate — verification protects AI spend, not login

- [x] **AC8 [security]:** `EmailVerifiedGuard`. `api/src/common/guards/email-verified.guard.ts` reads `req.user.id`, loads `emailVerified` **fresh from the DB** (never from the JWT or client), and throws HTTP 403 `{ code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email address to generate designs.' }` when it is `false`. It is applied **after** `AuthGuard('jwt')` on exactly these cost-bearing routes:
  - `POST /infographics/generate` (`infographics.controller.ts`)
  - `POST /infographics/generations` (`generations.controller.ts` → `generateFromChat`)
  - `POST /infographics/generations/:id/regenerate`
  - `POST /infographics/generations/:id/compose`
  - `POST /infographics/generations/extractions` (`extractions.controller.ts` — LLM call)
  A blocked request consumes no credit and makes no provider call. Login, templates, My Designs, account, the editor, onboarding (US-LAUNCH-016) and all GET routes stay open to unverified users.

- [x] **AC9 [happy-path]:** Gate UX. In `client/src/lib/queryClient.ts`, when an `ApiError` is thrown with `code === 'EMAIL_NOT_VERIFIED'`, a `window` event `buildographic:email-verification-required` is dispatched (the error is still thrown to the caller). `client/src/components/auth/EmailVerificationRequiredDialog.tsx`, mounted once in `App.tsx` inside `AuthProvider`, opens on that event showing "Verify your email to start generating", the user's email address, a **Resend verification email** button (calls AC7; shows "Sent — check your inbox" on `sent`/`alreadyVerified`) and a **Close** button. Opening it twice does not stack dialogs.

- [x] **AC10 [happy-path]:** Banner + verify page. `EmailVerificationBanner` renders between `<AppHeader />` and `<main>` in `AppLayoutWithHeader` when `user.emailVerified === false`, with text including "verify your email" and a **Resend verification email** button; it renders `null` when `emailVerified` is `true` or `undefined`. Public route `/auth/verify-email` renders `VerifyEmailPage`: reads `token` via `useSearch()`, calls AC6 on mount; success shows "verified" and — if `localStorage.auth_user.id === response.userId` — calls `AuthProvider.login({ ...user, emailVerified: true }, token)` so the banner disappears, then offers a button to `/templates` (logged in) or `/auth` (not); 400/network error shows an invalid/expired state prompting sign-in to resend; no `token` param → error state without an API call. Both render without horizontal overflow at 375px (and the page at 1440px).

### E. Rate limits that actually see the client

- [x] **AC11 [security]:** Proxy-aware tracker. `server/index.ts`'s `/api/v1` proxy sets `xfwd: true`. `api/src/common/guards/proxy-aware-throttler.guard.ts` extends `ThrottlerGuard` and overrides `getTracker(req)`: split `x-forwarded-for` on commas (trimmed); with `TRUSTED_PROXY_HOPS = Number(process.env.TRUSTED_PROXY_HOPS ?? 1)`, if the list has ≥ `hops` entries return `list[list.length - hops]`, otherwise `req.ip`. It replaces the `ThrottlerGuard` in `AppModule`'s `APP_GUARD` factory. `.env.example` documents `TRUSTED_PROXY_HOPS` (local dev = `1`, Railway = **(TBC) likely `2`** — Railway edge + Express; confirm on staging by logging the header once, see TC-18). Client-supplied leading XFF entries therefore cannot pick the tracked IP.

- [x] **AC12 [rate-limit]:** Email-endpoint limits. Using `@Throttle` on `auth.controller.ts`: `POST /auth/register` **5 per hour** per tracked IP; `POST /auth/resend-verification` **3 per hour**; `POST /auth/forgot-password` **5 per hour** (sends email — same abuse class; decorator only, no service change). Exceeding returns HTTP 429. Other routes keep the global default.

### F. Internal test accounts (added 2026-09-18 — T7)

> **Why this exists.** The gate in AC8 and the limits in AC12 broke this repo's own test suite: 12 E2E specs
> register `e2e-*-${Date.now()}@test.local` and then call a gated route (they now get 403), and a full run
> registers 12+ accounts from one CI IP (429 after the 5th). `npx playwright test` defaults to **staging**,
> so this hits a deployed environment. Unit and integration tests are unaffected (mock-based / direct Prisma).

- [x] **AC14 [security]:** `email-policy.ts` exports `isInternalTestEmail(email): boolean`, true only when the
  address's domain **exactly equals** one entry of `process.env.INTERNAL_TEST_EMAIL_DOMAINS` (comma-separated,
  trimmed, lower-cased). When the variable is unset or empty the function is always false — **production
  behaves exactly as it does without this feature**. The decision is made server-side from the submitted email
  alone: no request header, query parameter or body flag can select it, and no parent-domain or suffix matching
  is performed (`evil-test.local` must not match an allowlisted `test.local`). Every bypass logs once at `warn`
  with the address and the reason, so any use in a real environment is visible in logs.

- [x] **AC15 [security]:** An allowlisted address changes exactly three behaviours in `register()`, and nothing
  else: (a) the AC2 disposable check is skipped; (b) the user is created with `emailVerified: true` and
  `emailVerifiedAt = now`, so no `EmailVerificationToken` is created and `EmailService.send()` is not called;
  (c) the AC4 duplicate check still runs unchanged. It does **not** bypass authentication, `EmailVerifiedGuard`,
  credit metering, `assertCanGenerate`, the monthly plan limit, or the global 100/min throttle. `login()`,
  `verifyEmail()`, `resendVerification()` and `googleLogin()` are untouched by the allowlist.

- [x] **AC16 [rate-limit]:** `ProxyAwareThrottlerGuard` overrides `shouldSkip(context)` to return true only when
  the request is a `POST` to `/auth/register`, `/auth/resend-verification` or `/auth/forgot-password` **and**
  `isInternalTestEmail(request.body?.email)` is true. A malformed or absent body, a non-allowlisted address, or
  any other route falls through to normal throttling. With `INTERNAL_TEST_EMAIL_DOMAINS` unset, `shouldSkip`
  never returns true on this path.

- [ ] **AC17 [happy-path]:** `.env.example` and the epic's `ENV.yaml` document `INTERNAL_TEST_EMAIL_DOMAINS`
  with the per-environment policy: local/CI `test.local`; staging `test.local` plus a domain you control;
  **production empty**. `scripts/seed-test-users.mjs` (new, mirroring `scripts/ensure-payment-test-user.mjs`)
  creates or updates the fixed `TEST_USER_EMAIL` account directly against the database with
  `emailVerified: true`, so production smoke tests **log in** as a deliberately seeded account and never
  register. Wired as `npm run seed:test-users`. A full `npx playwright test` run against a target whose API has
  `INTERNAL_TEST_EMAIL_DOMAINS=test.local` completes without a 403 from the gate or a 429 from the sign-up limit.
  *Implementation note (2026-09-18):* documentation and the script are written and the script loads, resolves
  `normalizeEmail` and reaches the database; it runs as `npm run seed:test-users` (`npx tsx scripts/seed-test-users.mjs`
  — tsx is needed so the `.mjs` entry point can import the TypeScript `normalizeEmail` rather than re-implement it).
  **Unchecked deliberately:** the seed write (MV-014-13) and the full Playwright run (MV-014-10) have not been executed —
  the T1 schema has not been `prisma db push`-ed to the dev database, so `User.emailNormalized` does not exist yet
  and the script currently fails with `P2022` against it. Re-run both after the push.

### G. Tests

- [x] **AC13 [null-input]:** Unit tests (mock-based) — including the empty/absent-input branches (missing `token`, absent `x-forwarded-for`, unknown token):
  - `api/tests/auth/email-policy.spec.ts`: all four AC3 examples; `isDisposableEmail('a@mailinator.com')` and `('a@x.mailinator.com')` → true; `('a@gmail.com')` → false.
  - `api/tests/auth/email-verification.spec.ts`: (a) register with a disposable domain → 400 `DISPOSABLE_EMAIL_NOT_ALLOWED`, `organization.create` and `user.create` never called; (b) register where `findFirst` matches on `emailNormalized` → 409; (c) register success → `user.create` data has `emailVerified: false` and `emailNormalized`, `emailVerificationToken.create` gets a 64-char hex `tokenHash` and ~24h `expiresAt`, `EmailService.send` called once; (d) token create throws → register still returns user + token; (e) verifyEmail valid → user + token updated, returns `{ verified: true, userId }`; (f) expired / used / unknown → `BadRequestException`, no update; (g) resend when verified → `{ alreadyVerified: true }`, no send; (h) resend when unverified → `deleteMany`, `create`, send once; (i) googleLogin where only `emailNormalized` matches → `user.update` (link), `user.create` not called.
  - `api/tests/common/email-verified.guard.spec.ts`: `emailVerified: false` → `ForbiddenException` with `code: 'EMAIL_NOT_VERIFIED'`; `true` → `true`; the guard reads Prisma, not `req.user`.
  - `api/tests/common/proxy-aware-throttler.spec.ts`: XFF `'6.6.6.6, 1.2.3.4, 10.0.0.1'` with hops 2 → `'1.2.3.4'`; hops 1 → `'10.0.0.1'`; no header → `req.ip`.

- [x] **AC18 [null-input]:** Unit tests for the allowlist (mock-based), extending the existing specs:
  - `email-policy.spec.ts`: `INTERNAL_TEST_EMAIL_DOMAINS` unset/empty → `isInternalTestEmail()` false for every input including `a@test.local`; set to `test.local` → `a@test.local` true, `a@evil-test.local` false, `a@sub.test.local` false, `a@TEST.LOCAL` true (case-insensitive), `''`/`undefined`/`'not-an-email'` false.
  - `email-verification.spec.ts`: allowlisted register → `user.create` data has `emailVerified: true`, `emailVerificationToken.create` NOT called, `EmailService.send` NOT called, and a duplicate allowlisted address still throws 409.
  - `proxy-aware-throttler.spec.ts`: `shouldSkip` true for `POST /auth/register` with an allowlisted body email; false for the same route with a normal address, false for an allowlisted address on a non-auth route, false when the body is absent, and false for every case when the env var is unset.

---

## Out of Scope

- **Blocking login, the editor, templates or onboarding** for unverified users — only the five AI-spend routes in AC8 are gated.
- **Backfilling `emailNormalized`** for existing users (possible duplicates would violate the unique index). Aliases of *pre-existing* accounts are therefore not detected; new-vs-new is.
- **MX/DNS lookups** on the email domain, CAPTCHA (e.g. Turnstile), device fingerprinting, per-IP free-credit caps, phone OTP — revisit only if abuse data justifies it.
- **Rate limits on `login`, `reset-password` or `verify-email`** beyond the global default (now meaningful thanks to AC11).
- **Blocking disposable domains on Google OAuth** — Google accounts aren't disposable in practice.
- **Automated list refresh** beyond bumping the npm dependency.
- **API-key (B2B) generation paths** — not JWT routes; unaffected.
- Any change to `PasswordResetToken`, `forgotPassword()`/`resetPassword()` logic or their DTOs (AC12 adds a controller decorator only).
- Email-change re-verification; showing the banner on `/editor` or `/usage`; a "check your inbox" interstitial after registration.
- Suppressing a call site's own error toast when the AC9 dialog opens (possible duplicate message is accepted).
- **Any allowlist bypass beyond the three behaviours in AC15** — no "test mode" flag, no header- or param-driven bypass, no exemption from credits, plan limits or the guard itself.
- **Rewriting the 12 E2E specs' registration helpers** — with `INTERNAL_TEST_EMAIL_DOMAINS=test.local` set on the target API they pass unchanged; only add assertions if a spec actively contradicts the new behaviour.
- **Deleting or rotating seeded test accounts**, and any CI pipeline change to run `seed:test-users` automatically — the script is provided; wiring it into CI is ops work.

---

## Engineering / PR

- **Branch:** `feat/launch/us-launch-014-signup-verification-gate`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/prisma/schema.prisma` — User fields + `EmailVerificationToken`
  - `package.json` / `package-lock.json` — add `disposable-email-domains-js`
  - `api/src/modules/auth/utils/email-policy.ts` — NEW: `normalizeEmail`, `isDisposableEmail`, `EXTRA_BLOCKED_DOMAINS`
  - `api/src/modules/auth/services/auth.service.ts` — register checks + verification send; `verifyEmail`; `resendVerification`; googleLogin normalized lookup
  - `api/src/modules/auth/controllers/auth.controller.ts` — `verify-email`, `resend-verification`; `@Throttle` on register / resend / forgot-password
  - `api/src/modules/auth/dto/auth.dto.ts` — `VerifyEmailDto`
  - `api/src/common/guards/email-verified.guard.ts` — NEW
  - `api/src/common/guards/proxy-aware-throttler.guard.ts` — NEW
  - `api/src/app.module.ts` — use proxy-aware guard in `APP_GUARD`
  - `server/index.ts` — `xfwd: true` on the `/api/v1` proxy
  - `api/src/modules/infographics/controllers/infographics.controller.ts`, `generations.controller.ts`, `extractions.controller.ts` — apply `EmailVerifiedGuard`
  - `.env.example` — `TRUSTED_PROXY_HOPS`
  - `shared/schema.ts` — `emailVerified?: boolean` on `LegacyUser`
  - `client/src/lib/queryClient.ts` — dispatch event on `EMAIL_NOT_VERIFIED`
  - `client/src/components/auth/EmailVerificationRequiredDialog.tsx` — NEW
  - `client/src/components/ui/EmailVerificationBanner.tsx` — NEW
  - `client/src/pages/auth/VerifyEmailPage.tsx` — NEW
  - `client/src/App.tsx` — route, banner, dialog mount
  - `api/tests/auth/email-policy.spec.ts`, `api/tests/auth/email-verification.spec.ts`, `api/tests/common/email-verified.guard.spec.ts`, `api/tests/common/proxy-aware-throttler.spec.ts` — NEW

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: Buildographic (code name InfographicAI) — NestJS API (port 3001) behind an Express proxy (port 5000) + React/Vite.
Stack: NestJS 11, Prisma 6, React 18, Wouter (never React Router), Tailwind v3 + shadcn/ui, React Query. See CLAUDE.md.

Story: US-LAUNCH-014 — Sign-up verification gate + abuse controls.
Goal: stop disposable / duplicate-alias sign-ups from spending free AI credits. Verification gates AI-spend routes only,
never login or browsing. Existing users are grandfathered.

Verified facts (2026-09-14):
- auth.service.ts register(): findUnique by email → ConflictException('User already exists'); bcrypt; creates a NEW
  Organization (free, monthlyLimit 3) unless dto.organizationId; prisma.user.create select {id,email,name,organizationId};
  returns { user, token }. login() returns user {id,email,name,organizationId}. googleLogin(): branches googleId match /
  email match (update links Google) / neither (create org + user). hashToken(raw) and frontendUrl() helpers exist
  (used by forgotPassword/resetPassword). EmailService already injected: send({to,subject,html?,text?}) never throws.
- PasswordResetToken model in schema.prisma is the token pattern to mirror.
- app.module.ts: ThrottlerModule.forRoot({ throttlers: [{ name:'default', ttl:60000, limit:100 }] }) and an APP_GUARD
  factory returning new ThrottlerGuard(options, storage, reflector).
- server/index.ts: app.use('/api/v1', createProxyMiddleware({ target:'http://localhost:3001/api/v1', changeOrigin:true,
  pathRewrite... })) — NO xfwd. api/src/main.ts sets no trust proxy. So NestJS sees every client as localhost.
- Cost routes (all @UseGuards(AuthGuard('jwt'))): infographics.controller POST 'generate';
  generations.controller POST '' (generateFromChat), POST ':id/regenerate', POST ':id/compose';
  extractions.controller POST ''.
- Typed error codes already flow to the client: payments.controller throws { code:'BETA_MODE_ACTIVE' };
  client/src/lib/queryClient.ts ApiError(message, status, code) is thrown from throwIfResNotOk.
- JWT strategy sets req.user.id.
- npm: use 'disposable-email-domains-js' (maintained, CC0). NOT 'disposable-email-domains' (stale since 2022).
  Inspect its dist/index.d.ts for the actual export before wiring.

Implement per the ACs in STORY.md, in this order:
T1 schema — emailVerified Boolean @default(true) WITH a comment explaining grandfathering; emailVerifiedAt; emailNormalized
   String? @unique; EmailVerificationToken. npx prisma generate --schema=api/prisma/schema.prisma
T2 email-policy.ts + email-policy.spec.ts (pure functions first; tests from AC3/AC13 examples)
T3 auth.service/controller/dto — AC2, AC4, AC5, AC6, AC7 (+ email-verification.spec.ts). In register, run the disposable
   check and the email/emailNormalized duplicate check (prisma.user.findFirst({ where: { OR: [...] } })) BEFORE creating
   the org. In googleLogin, extend the email lookup to OR emailNormalized; set emailNormalized on create.
T4 EmailVerifiedGuard (+ spec) and apply to the five routes: @UseGuards(AuthGuard('jwt'), EmailVerifiedGuard).
   Throw new ForbiddenException({ code:'EMAIL_NOT_VERIFIED', message:'Please verify your email address to generate designs.' }).
T5 ProxyAwareThrottlerGuard (+ spec): protected async getTracker(req) per AC11; swap into APP_GUARD factory;
   server/index.ts xfwd: true; .env.example TRUSTED_PROXY_HOPS. @Throttle({ default: { limit, ttl } }) on register (5/3600000),
   resend-verification (3/3600000), forgot-password (5/3600000).
T6 client — shared/schema.ts LegacyUser.emailVerified?; queryClient.ts event dispatch; EmailVerificationRequiredDialog;
   EmailVerificationBanner; VerifyEmailPage; App.tsx (route '/auth/verify-email' BEFORE '/auth', banner in
   AppLayoutWithHeader, dialog mounted once inside AuthProvider).

Out of Scope — do NOT: gate login/editor/templates/onboarding; backfill emailNormalized; add MX checks, CAPTCHA,
fingerprinting or OTP; throttle login/reset/verify; change PasswordResetToken or forgot/reset service logic;
touch API-key paths; touch files outside the Primary files list.

Rules: prisma generate after schema change · npm run check && npm run test:unit before done ·
report files changed, ACs ✅, test output. api/ edits need a full dev-server restart to test manually.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-LAUNCH-014-01 | Unit | P0 | happy-path: `User` gains `emailVerified Boolean @default(true)`, `ema… | 🔲 | |
| TC-LAUNCH-014-02 | Unit | P0 | error-path: Disposable domains blocked. exports `isDisposableEmail(em… | 🔲 | |
| TC-LAUNCH-014-03 | Unit | P1 | edge-case: Alias normalization. `email-policy.ts` exports `normalize… | 🔲 | |
| TC-LAUNCH-014-04 | Unit | P1 | idempotency: One account per real inbox. `register()` rejects with the… | 🔲 | |
| TC-LAUNCH-014-05 | Unit | P0 | happy-path: Send on register. `register()` creates the user with `ema… | 🔲 | |
| TC-LAUNCH-014-06 | Unit | P1 | session-expiry: Verify endpoint. `{ token }`: a matching, unused, unexpir… | 🔲 | |
| TC-LAUNCH-014-07 | Unit | P1 | idempotency: Resend endpoint. (JWT; 401 otherwise): already verified →… | 🔲 | |
| TC-LAUNCH-014-08 | Unit | P1 | security: `EmailVerifiedGuard`. reads `req.user.id`, loads `emailVe… | 🔲 | |
| TC-LAUNCH-014-09 | Unit | P0 | happy-path: Gate UX. In , when an `ApiError` is thrown with `code ===… | 🔲 | |
| TC-LAUNCH-014-10 | Unit | P0 | happy-path: Banner + verify page. `EmailVerificationBanner` renders b… | 🔲 | |
| TC-LAUNCH-014-11 | Unit | P1 | security: Proxy-aware tracker. 's proxy sets `xfwd: true`. extends … | 🔲 | |
| TC-LAUNCH-014-12 | Unit | P1 | rate-limit: Email-endpoint limits. Using `@Throttle` on `auth.control… | 🔲 | |
| TC-LAUNCH-014-13 | Unit | P1 | security: `email-policy.ts` exports `isInternalTestEmail(email): bo… | 🔲 | |
| TC-LAUNCH-014-14 | Unit | P1 | security: An allowlisted address changes exactly three behaviours i… | 🔲 | |
| TC-LAUNCH-014-15 | Unit | P1 | rate-limit: `ProxyAwareThrottlerGuard` overrides `shouldSkip(context)… | 🔲 | |
| TC-LAUNCH-014-16 | Unit | P0 | happy-path: `.env.example` and the epic's `ENV.yaml` document `INTERN… | 🔲 | |
| TC-LAUNCH-014-17 | Unit | P1 | null-input: Unit tests (mock-based) — including the empty/absent-inpu… | 🔲 | |
| TC-LAUNCH-014-18 | Unit | P1 | null-input: Unit tests for the allowlist (mock-based), extending the … | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

> The table above is **generated** by `orion tc-rows` from the typed ACs and is rewritten on every
> `harden` run — one Unit row per AC, scenario text truncated. The authored scenarios below (manual
> and browser-level checks the generator cannot derive) live in their own section so they survive
> re-hardening. Run both.

---

## Manual Verification Plan (authored — not generated)

| MV ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| MV-014-01 | Manual | P0 | Register with a real 10minutemail / mailinator address on localhost → friendly "permanent email" error; no Organization, User or token row created (AC2) | 🔲 | |
| MV-014-02 | Manual | P0 | Register `me+test@gmail.com` after `me@gmail.com` exists (both created under this story) → 409 (AC4) | 🔲 | |
| MV-014-03 | Manual | P0 | New unverified user can log in, onboard, browse templates and open the editor; clicking Generate → "Verify your email" dialog, usage count unchanged, no provider call in API logs (AC8/AC9) | ⚠️ | **API half verified 2026-09-19.** `POST /infographics/generations` and `.../extractions` as a fresh unverified account both return `403 {"code":"EMAIL_NOT_VERIFIED"}` — which also proves T5b end-to-end. The **browser half (AC9 dialog) is still unverified** — needs a UI pass. |
| MV-014-04 | Manual | P0 | Open the `[DEV EMAIL]` verify link in the same browser → success state; banner disappears without re-login; Generate now works (AC6/AC10) | ⚠️ | **API half verified 2026-09-19.** `POST /auth/verify-email` → `200 {verified:true,userId}`; re-using the same token → `400` (single-use holds); `login()` then returns `emailVerified: true` and the gated route no longer 403s. **Browser half (page + banner clearing) still unverified.** |
| MV-014-05 | Manual | P0 | A user created **before** this story logs in and generates → no banner, no gate (grandfathering, AC1) | ✅ | **Verified 2026-09-19** against the dev DB after `prisma db push`: 112 users, `emailVerified=true` for 112, `false` for 0, 0 token rows. No existing user was locked out. |
| MV-014-06 | Manual | P0 | **Staging:** log `x-forwarded-for` once; set `TRUSTED_PROXY_HOPS` so the tracker equals your real public IP; 6th register within an hour → 429, while a different network still registers (AC11/AC12) | 🔲 | |
| MV-014-07 | Manual | P1 | Compose ("Make Editable") and Regenerate as an unverified user → 403 dialog, no credit charged (AC8) | 🔲 | |
| MV-014-08 | Manual | P2 | `RESEND_API_KEY` set + real inbox → verification email arrives, link verifies, generation unlocks (AC5) | 🔲 | |
| MV-014-09 | Manual | P2 | Banner at 375px and VerifyEmailPage at 375/1440px — no horizontal overflow (AC10) | 🔲 | |
| MV-014-10 | Manual | P0 | With `INTERNAL_TEST_EMAIL_DOMAINS=test.local` on the local API, a full `npx playwright test` against localhost completes with no 403 from the gate and no 429 from the sign-up limit (AC17) | 🔲 | |
| MV-014-11 | Manual | P0 | **Security:** with the variable UNSET, registering `a@test.local` behaves like any other address — unverified, token created, email sent, throttled after 5/h (AC14) | 🔲 | Not run — needs a second dev-server boot with the variable unset. |
| MV-014-12 | Manual | P0 | **Security:** with `INTERNAL_TEST_EMAIL_DOMAINS=test.local`, registering `a@evil-test.local` and `a@sub.test.local` gets NO bypass (unverified + throttled), and a `warn` log line appears only for genuine allowlist hits (AC14) | ✅ | **Verified 2026-09-19.** Registered the same local-part at four domains: `evil-test.local` → `emailVerified=false`; `sub.test.local` → `false`; `example.com` → `false`; `test.local` → `true`. Exactly one `WARN [AuthService] Internal-test bypass applied…` line, for the `test.local` hit only. Exact-match holds; no suffix/parent widening. |
| MV-014-13 | Manual | P1 | `npm run seed:test-users` creates the `TEST_USER_EMAIL` account with `emailVerified: true`; that account can log in and generate without ever registering through the API (AC17) | ✅ | **Verified 2026-09-19.** Seed run twice → same `id`/`org`, `emailVerified=true`, no duplicate (idempotent); it adopted the pre-existing `payment.automation@local.test`. Login proven two ways: `POST /auth/login` → 200 with `emailVerified: true`, and `e2e/us-ai-040` (5 passed, 24.3s) logs in as that account through the UI and browses `/templates` normally. Generation itself deliberately not run (real provider spend). |
| MV-014-14 | Manual | P0 | **Production policy:** confirm `INTERNAL_TEST_EMAIL_DOMAINS` is absent from the Railway production environment before/after deploy (`railway variables --environment production`) (AC14) | 🔲 | |
| MV-014-15 | Auto (E2E) | P1 | Targeted Playwright run against localhost shows no regression on the auth surface this story touched | ✅ | **Verified 2026-09-19** with `PLAYWRIGHT_BASE_URL=http://localhost:5000` (the default points at staging — must be overridden). Run three times (`--repeat-each=3`) at 4.31 GB free: **`us-launch-003-password-reset` 12/12 passed** (4 tests × 3; a 5th is `test.skip` in source, `[BLOCKED-UNTIL-DEPLOY]`), including the forgot-password form submitted 3× without tripping the new 5/h cap. That is the surface this story changed, and it is stable. The 12 register-then-generate specs were excluded on purpose: each spends real GPT-4o/Ideogram credit. **Correction:** an earlier single re-run led me to record these failures as "memory starvation, not a defect" — the 3× repeat disproved that (see MV-014-16). |
| MV-014-16 | Auto (E2E) | P2 | `us-ai-040-template-preview-tags` stability — **not** part of this story's surface, tracked here because it was run alongside | ⚠️ | **Flaky: 7/15 passed across 3 repeats (2026-09-19), at 4.31 GB free — memory is not the cause.** Every failure is in the `beforeEach` `ensureLoggedIn` hook, and every failure snapshot shows `/auth` with empty fields: a full reload dropped the session. This is the `redirect_to_auth` race the spec's own comment documents ("made these tests fail intermittently while the app worked fine by hand") — a pre-login 401 sets the flag, `useRedirectToAuthOnLoad` consumes it on the next full load and bounces back to `/auth`. The hook clears the flag once, but a second late 401 re-arms it. **Not attributable to US-LAUNCH-014 on the evidence available:** our only change on that path (`queryClient.ts`) is additive and fires solely on `EMAIL_NOT_VERIFIED`; the 401 branch is byte-identical to `main`. **Unproven either way** — the decisive test is running this spec against `main` in a separate worktree + second dev server. Filed as [[BL-31]]. |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded (generated TC table **and** the Manual Verification Plan)
- [ ] `npm run check` passes (0 new TypeScript errors)
- [ ] `npm run test:unit` passes (no regressions)
- [ ] `npx prisma generate` run; `prisma db push` applied to staging — confirm existing users read `emailVerified = true` afterwards
- [ ] `TRUSTED_PROXY_HOPS` set on Railway staging + production after MV-014-06 confirms the value
- [ ] Manual flow verified (MV-014-01, -03, -04, -05, -06 minimum)
- [ ] PR merged (PR #_____)
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-07-25 · Re-scoped: 2026-09-14 (soft verification → verify-before-generate + abuse controls)*
