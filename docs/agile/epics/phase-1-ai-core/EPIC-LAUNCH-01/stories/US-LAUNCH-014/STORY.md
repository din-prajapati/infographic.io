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

- [ ] **AC9 [happy-path]:** Gate UX. In `client/src/lib/queryClient.ts`, when an `ApiError` is thrown with `code === 'EMAIL_NOT_VERIFIED'`, a `window` event `buildographic:email-verification-required` is dispatched (the error is still thrown to the caller). `client/src/components/auth/EmailVerificationRequiredDialog.tsx`, mounted once in `App.tsx` inside `AuthProvider`, opens on that event showing "Verify your email to start generating", the user's email address, a **Resend verification email** button (calls AC7; shows "Sent — check your inbox" on `sent`/`alreadyVerified`) and a **Close** button. Opening it twice does not stack dialogs.

- [ ] **AC10 [happy-path]:** Banner + verify page. `EmailVerificationBanner` renders between `<AppHeader />` and `<main>` in `AppLayoutWithHeader` when `user.emailVerified === false`, with text including "verify your email" and a **Resend verification email** button; it renders `null` when `emailVerified` is `true` or `undefined`. Public route `/auth/verify-email` renders `VerifyEmailPage`: reads `token` via `useSearch()`, calls AC6 on mount; success shows "verified" and — if `localStorage.auth_user.id === response.userId` — calls `AuthProvider.login({ ...user, emailVerified: true }, token)` so the banner disappears, then offers a button to `/templates` (logged in) or `/auth` (not); 400/network error shows an invalid/expired state prompting sign-in to resend; no `token` param → error state without an API call. Both render without horizontal overflow at 375px (and the page at 1440px).

### E. Rate limits that actually see the client

- [x] **AC11 [security]:** Proxy-aware tracker. `server/index.ts`'s `/api/v1` proxy sets `xfwd: true`. `api/src/common/guards/proxy-aware-throttler.guard.ts` extends `ThrottlerGuard` and overrides `getTracker(req)`: split `x-forwarded-for` on commas (trimmed); with `TRUSTED_PROXY_HOPS = Number(process.env.TRUSTED_PROXY_HOPS ?? 1)`, if the list has ≥ `hops` entries return `list[list.length - hops]`, otherwise `req.ip`. It replaces the `ThrottlerGuard` in `AppModule`'s `APP_GUARD` factory. `.env.example` documents `TRUSTED_PROXY_HOPS` (local dev = `1`, Railway = **(TBC) likely `2`** — Railway edge + Express; confirm on staging by logging the header once, see TC-18). Client-supplied leading XFF entries therefore cannot pick the tracked IP.

- [x] **AC12 [rate-limit]:** Email-endpoint limits. Using `@Throttle` on `auth.controller.ts`: `POST /auth/register` **5 per hour** per tracked IP; `POST /auth/resend-verification` **3 per hour**; `POST /auth/forgot-password` **5 per hour** (sends email — same abuse class; decorator only, no service change). Exceeding returns HTTP 429. Other routes keep the global default.

### F. Tests

- [ ] **AC13 [null-input]:** Unit tests (mock-based) — including the empty/absent-input branches (missing `token`, absent `x-forwarded-for`, unknown token):
  - `api/tests/auth/email-policy.spec.ts`: all four AC3 examples; `isDisposableEmail('a@mailinator.com')` and `('a@x.mailinator.com')` → true; `('a@gmail.com')` → false.
  - `api/tests/auth/email-verification.spec.ts`: (a) register with a disposable domain → 400 `DISPOSABLE_EMAIL_NOT_ALLOWED`, `organization.create` and `user.create` never called; (b) register where `findFirst` matches on `emailNormalized` → 409; (c) register success → `user.create` data has `emailVerified: false` and `emailNormalized`, `emailVerificationToken.create` gets a 64-char hex `tokenHash` and ~24h `expiresAt`, `EmailService.send` called once; (d) token create throws → register still returns user + token; (e) verifyEmail valid → user + token updated, returns `{ verified: true, userId }`; (f) expired / used / unknown → `BadRequestException`, no update; (g) resend when verified → `{ alreadyVerified: true }`, no send; (h) resend when unverified → `deleteMany`, `create`, send once; (i) googleLogin where only `emailNormalized` matches → `user.update` (link), `user.create` not called.
  - `api/tests/common/email-verified.guard.spec.ts`: `emailVerified: false` → `ForbiddenException` with `code: 'EMAIL_NOT_VERIFIED'`; `true` → `true`; the guard reads Prisma, not `req.user`.
  - `api/tests/common/proxy-aware-throttler.spec.ts`: XFF `'6.6.6.6, 1.2.3.4, 10.0.0.1'` with hops 2 → `'1.2.3.4'`; hops 1 → `'10.0.0.1'`; no header → `req.ip`.

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
| TC-LAUNCH-014-13 | Unit | P1 | null-input: Unit tests (mock-based) — including the empty/absent-inpu… | 🔲 | |

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
| MV-014-03 | Manual | P0 | New unverified user can log in, onboard, browse templates and open the editor; clicking Generate → "Verify your email" dialog, usage count unchanged, no provider call in API logs (AC8/AC9) | 🔲 | |
| MV-014-04 | Manual | P0 | Open the `[DEV EMAIL]` verify link in the same browser → success state; banner disappears without re-login; Generate now works (AC6/AC10) | 🔲 | |
| MV-014-05 | Manual | P0 | A user created **before** this story logs in and generates → no banner, no gate (grandfathering, AC1) | 🔲 | |
| MV-014-06 | Manual | P0 | **Staging:** log `x-forwarded-for` once; set `TRUSTED_PROXY_HOPS` so the tracker equals your real public IP; 6th register within an hour → 429, while a different network still registers (AC11/AC12) | 🔲 | |
| MV-014-07 | Manual | P1 | Compose ("Make Editable") and Regenerate as an unverified user → 403 dialog, no credit charged (AC8) | 🔲 | |
| MV-014-08 | Manual | P2 | `RESEND_API_KEY` set + real inbox → verification email arrives, link verifies, generation unlocks (AC5) | 🔲 | |
| MV-014-09 | Manual | P2 | Banner at 375px and VerifyEmailPage at 375/1440px — no horizontal overflow (AC10) | 🔲 | |

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
