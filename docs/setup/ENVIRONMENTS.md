# Environment Variable Matrix — InfographicAI

> **Purpose:** Single reference for every variable the app reads (`process.env.*` + `import.meta.env.VITE_*`).
> Each row states the value **shape** — never a real secret value.
>
> **Columns:**
> - **Variable** — exact key name
> - **Local** — shape used in `.env` on a developer workstation
> - **Staging** — shape on Railway staging environment
> - **Production** — shape on Railway production environment (not yet created)
> - **Per-env / Shared** — `per-env` means each environment MUST have its own distinct value; `shared` means all envs may use the same logical value
> - **Source** — where the value originates
> - **Notes** — separation policy or special behaviour

---

## Separation Policy Summary

| Concern | Policy |
|---------|--------|
| Google OAuth | Separate OAuth 2.0 client ID+secret per environment (Google Console → one app per env). Redirect URI must match exactly. |
| RazorPay keys | Test keys (`rzp_test_*`) for local + staging; live keys (`rzp_live_*`) for production only. |
| RazorPay plan IDs | Separate plans per environment — test plans on staging, live plans on production. |
| Webhook secrets | One secret per endpoint per environment. Never reuse across envs. |
| JWT / session secrets | Unique cryptographically-random value per environment (`openssl rand -base64 32`). |
| AI API keys | Ideally own key per environment to isolate usage/billing; sharing is acceptable for beta. |
| Sentry | One Sentry project with environment tags (`environment=staging`, `environment=production`). Both envs share the same DSN. |
| DATABASE_URL | One Neon project with separate branches per environment (`main` → production, `staging` branch → staging). |

---

## 1. Core / Server

| Variable | Local | Staging | Production | Per-env / Shared | Source | Notes |
|----------|-------|---------|------------|-----------------|--------|-------|
| `NODE_ENV` | `development` | `production` | `production` | per-env | hardcoded / Railway env | NestJS skips `.env` file when `NODE_ENV=production` AND `DATABASE_URL` is set |
| `PORT` | `5000` | `5000` | `5000` | shared | Railway / `.env` | Express proxy port |
| `API_PORT` | `3001` | `3001` | `3001` | shared | Railway / `.env` | NestJS port (internal, proxied) |
| `BASE_URL` | `http://localhost:5000` | `https://<staging-domain>` | `https://<prod-domain>` | per-env | `.env` / Railway | Used for absolute URLs (OAuth callbacks, webhook URLs) |
| `CLIENT_URL` | `http://localhost:5173` | `https://<staging-domain>` | `https://<prod-domain>` | per-env | `.env` / Railway | CORS allow-list; set to same host as BASE_URL in production |
| `DEMO_MODE` | `false` | `false` | `false` | per-env | `.env` / Railway | Set to `true` only on a dedicated demo instance; disables AI costs |

---

## 2. Database

| Variable | Local | Staging | Production | Per-env / Shared | Source | Notes |
|----------|-------|---------|------------|-----------------|--------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/neondb?sslmode=require` | Neon staging branch connection string | Neon production branch connection string | per-env | Neon dashboard → Connection Details | **Canonical DB config.** Use this on all environments. Neon provides it in Dashboard → Connection Details. |

> **PG\* pruned from `.env.example` in US-LAUNCH-009.** `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` are superseded by `DATABASE_URL`. They are still read in `api/src/common/ensure-database-url.ts:10-16` as a legacy fallback to build `DATABASE_URL` when absent. The code path is a no-op when `DATABASE_URL` is set. Code removal is deferred to a post-launch cleanup story. See the Removed Variables table below.

---

## 3. Authentication & Security

| Variable | Local | Staging | Production | Per-env / Shared | Source | Notes |
|----------|-------|---------|------------|-----------------|--------|-------|
| `JWT_SECRET` | unique random 32-byte base64 | unique random 32-byte base64 | unique random 32-byte base64 | per-env | `openssl rand -base64 32` | Never reuse across environments |

> **SESSION_SECRET removed:** Was in `.env.example` but is not read anywhere in `api/src` or `server`. Removed from `.env.example` in US-LAUNCH-009. If Express session middleware is added later, re-introduce it.

---

## 4. Google OAuth

| Variable | Local | Staging | Production | Per-env / Shared | Source | Notes |
|----------|-------|---------|------------|-----------------|--------|-------|
| `GOOGLE_CLIENT_ID` | `<local-oauth-client>.apps.googleusercontent.com` | `<staging-oauth-client>.apps.googleusercontent.com` | `<prod-oauth-client>.apps.googleusercontent.com` | per-env | Google Cloud Console → Credentials | Create a separate OAuth 2.0 Client ID per environment |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-<local-secret>` | `GOCSPX-<staging-secret>` | `GOCSPX-<prod-secret>` | per-env | Google Cloud Console | Keep per-env to scope revocation |
| `GOOGLE_CALLBACK_URL` | `http://localhost:5000/api/v1/auth/google/callback` | `https://<staging-domain>/api/v1/auth/google/callback` | `https://<prod-domain>/api/v1/auth/google/callback` | per-env | `.env` / Railway | Must match Authorized Redirect URI in Google Console exactly |
| `GOOGLE_API_KEY` | `AIza...` | `AIza...` | `AIza...` | per-env | Google Cloud Console | Optional. Legacy key, distinct from OAuth client. Set only if needed. |

---

## 5. AI Services

| Variable | Local | Staging | Production | Per-env / Shared | Source | Notes |
|----------|-------|---------|------------|-----------------|--------|-------|
| `OPENAI_API_KEY` | `sk-proj-...` | `sk-proj-...` | `sk-proj-...` | per-env (shared acceptable for beta) | OpenAI dashboard → API Keys | Used for GPT-4o (TEAM/BROKERAGE tier LLM step) |
| `IDEOGRAM_API_KEY` | `<ideogram-key>` | `<ideogram-key>` | `<ideogram-key>` | per-env (shared acceptable for beta) | Ideogram dashboard | Used for image generation (all consumer tiers) |
| `GEMINI_API_KEY` | `AI...` | `AI...` | `AI...` | per-env (shared acceptable for beta) | Google AI Studio → API Keys | Used for FREE/SOLO tier LLM step |

---

## 6. Observability — Sentry

| Variable | Local | Staging | Production | Per-env / Shared | Source | Notes |
|----------|-------|---------|------------|-----------------|--------|-------|
| `SENTRY_DSN` | `https://...@sentry.io/...` (or empty) | `https://...@sentry.io/...` | `https://...@sentry.io/...` | shared (same DSN, different `environment` tag) | Sentry project → Settings → Client Keys | NestJS backend DSN. Leave empty locally to skip Sentry. |
| `VITE_SENTRY_DSN` | empty or same DSN | same DSN as `SENTRY_DSN` | same DSN as `SENTRY_DSN` | shared | same Sentry project | React frontend DSN. Tag environment via `VITE_APP_BUILD` or explicit Sentry `environment` config. |

---

## 6a. Email — Resend (transactional)

| Variable | Local | Staging | Production | Per-env / Shared | Source | Notes |
|----------|-------|---------|------------|-----------------|--------|-------|
| `RESEND_API_KEY` | empty (console fallback) | `re_...` | `re_...` | per-env | Resend Dashboard → API Keys | **Optional.** When absent, `EmailService` logs the full message to console and never crashes (US-LAUNCH-002 AC3). Sending to real users requires the verified domain below. |
| `EMAIL_FROM` | empty (defaults to `noreply@example.com`) | `Buildographic <noreply@buildographic.com>` | `Buildographic <noreply@buildographic.com>` | shared | you choose; domain must be verified in Resend | Sending domain `buildographic.com` verified in Resend via SPF/DKIM DNS records (purchased 2026-07-17). Until verification, Resend only delivers from `onboarding@resend.dev` to the account owner's own inbox. |

---

## 7. Payments — RazorPay

| Variable | Local | Staging | Production | Per-env / Shared | Source | Notes |
|----------|-------|---------|------------|-----------------|--------|-------|
| `RAZORPAY_KEY_ID` | `rzp_test_*` | `rzp_test_*` | `rzp_live_*` | per-env | RazorPay Dashboard → Settings → API Keys | **Critical:** test key in non-production; live key only in production |
| `RAZORPAY_KEY_SECRET` | `<test-secret>` | `<test-secret>` | `<live-secret>` | per-env | RazorPay Dashboard | Never log or expose |
| `RAZORPAY_WEBHOOK_SECRET` | `<test-webhook-secret>` | `<staging-webhook-secret>` | `<prod-webhook-secret>` | per-env | Set in RazorPay Dashboard → Settings → Webhooks | One secret per webhook endpoint; never share across envs |
| `RAZORPAY_SUBSCRIPTION_START_BUFFER_SECONDS` | `900` | `900` | `900` | shared | `.env` / Railway | Seconds after "now" before subscription start; user must complete auth within this window |
| `RAZORPAY_PLAN_SOLO_MONTHLY` | `plan_test_...` | `plan_test_...` | `plan_live_...` | per-env | RazorPay Dashboard → Products → Plans | Primary lookup for SOLO monthly billing |
| `RAZORPAY_PLAN_SOLO_ANNUAL` | `plan_test_...` | `plan_test_...` | `plan_live_...` | per-env | RazorPay Dashboard | Primary lookup for SOLO annual billing |
| `RAZORPAY_PLAN_SOLO` | `plan_test_...` | `plan_test_...` | `plan_live_...` | per-env | RazorPay Dashboard | **Legacy fallback** — read by `payments.service.ts` when `_MONTHLY`/`_ANNUAL` keys are absent |
| `RAZORPAY_PLAN_TEAM_MONTHLY` | `plan_test_...` | `plan_test_...` | `plan_live_...` | per-env | RazorPay Dashboard | Primary lookup for TEAM monthly billing |
| `RAZORPAY_PLAN_TEAM_ANNUAL` | `plan_test_...` | `plan_test_...` | `plan_live_...` | per-env | RazorPay Dashboard | Primary lookup for TEAM annual billing |
| `RAZORPAY_PLAN_TEAM` | `plan_test_...` | `plan_test_...` | `plan_live_...` | per-env | RazorPay Dashboard | Legacy fallback |
| `RAZORPAY_PLAN_BROKERAGE_MONTHLY` | `plan_test_...` | `plan_test_...` | `plan_live_...` | per-env | RazorPay Dashboard | Not yet configured (PT-06 deferred) |
| `RAZORPAY_PLAN_BROKERAGE_ANNUAL` | `plan_test_...` | `plan_test_...` | `plan_live_...` | per-env | RazorPay Dashboard | Not yet configured |
| `RAZORPAY_PLAN_BROKERAGE` | `plan_test_...` | `plan_test_...` | `plan_live_...` | per-env | RazorPay Dashboard | Legacy fallback |
| `RAZORPAY_PLAN_API_STARTER` | `plan_test_...` | `plan_test_...` | `plan_live_...` | per-env | RazorPay Dashboard | API tier plan ID (monthly = annual = same key) |
| `RAZORPAY_PLAN_API_GROWTH` | `plan_test_...` | `plan_test_...` | `plan_live_...` | per-env | RazorPay Dashboard | API tier plan ID |
| `VITE_RAZORPAY_KEY_ID` | `rzp_test_*` | `rzp_test_*` | `rzp_live_*` | per-env | Same value as `RAZORPAY_KEY_ID` (Key ID only, no secret) | Exposed to browser for RazorPay checkout widget. Must match server-side Key ID. |

---

## 8. Payments — Stripe (optional, disabled by default)

| Variable | Local | Staging | Production | Per-env / Shared | Source | Notes |
|----------|-------|---------|------------|-----------------|--------|-------|
| `STRIPE_ENABLED` | `false` | `false` | `false` | shared | `.env` / Railway | Set to `true` only when Stripe integration is activated. Default: `false`. |
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_test_...` | `sk_live_...` | per-env | Stripe Dashboard → Developers → API Keys | Only read when `STRIPE_ENABLED=true` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | `pk_test_...` | `pk_live_...` | per-env | Stripe Dashboard | Exposed to frontend |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | `whsec_...` | `whsec_...` | per-env | Stripe Dashboard → Webhooks | One secret per endpoint |
| `STRIPE_PLAN_SOLO` | `price_test_...` | `price_test_...` | `price_live_...` | per-env | Stripe Dashboard → Products | Stripe price ID for SOLO plan |
| `STRIPE_PLAN_TEAM` | `price_test_...` | `price_test_...` | `price_live_...` | per-env | Stripe Dashboard | Stripe price ID for TEAM plan |
| `STRIPE_PLAN_BROKERAGE` | `price_test_...` | `price_test_...` | `price_live_...` | per-env | Stripe Dashboard | |
| `STRIPE_PLAN_API_STARTER` | `price_test_...` | `price_test_...` | `price_live_...` | per-env | Stripe Dashboard | |
| `STRIPE_PLAN_API_GROWTH` | `price_test_...` | `price_test_...` | `price_live_...` | per-env | Stripe Dashboard | |

---

## 9. Payments — Paddle & PayPal (dead-letter, follow-up required)

> **Status:** These keys are **still read in `server/` code** but are not actively configured on any environment. They are not removed in this story (docs-only). A follow-up code cleanup story must remove them from `server/payments/providers/payment-provider.factory.ts` and `server/routes.ts`.

| Variable | Local | Staging | Production | Per-env / Shared | Source | Notes |
|----------|-------|---------|------------|-----------------|--------|-------|
| `PADDLE_API_KEY` | — | — | — | per-env | Paddle Dashboard | **Dead letter.** Still read at `server/payments/providers/payment-provider.factory.ts:174`. Not configured. |
| `PADDLE_WEBHOOK_SECRET` | — | — | — | per-env | Paddle Dashboard | **Dead letter.** Still read at `server/routes.ts:58`. Not configured. |
| `PAYPAL_CLIENT_ID` | — | — | — | per-env | PayPal Developer Dashboard | **Dead letter.** Still read at `server/payments/providers/payment-provider.factory.ts:176`. Not configured. |
| `PAYPAL_CLIENT_SECRET` | — | — | — | per-env | PayPal Developer Dashboard | **Dead letter.** Not configured. |

> **Follow-up:** These are pruned from `.env.example` in US-LAUNCH-009. Code removal is deferred to a separate cleanup story. `grep -rn "PADDLE_\|PAYPAL_" server/` confirms the read locations.

---

## 10. Frontend (VITE_*)

> These are build-time variables injected by Vite. They must be set in a `client/.env*` file locally or as Railway environment variables in production.

| Variable | Local | Staging | Production | Per-env / Shared | Source | Notes |
|----------|-------|---------|------------|-----------------|--------|-------|
| `VITE_RAZORPAY_KEY_ID` | `rzp_test_*` | `rzp_test_*` | `rzp_live_*` | per-env | Same value as `RAZORPAY_KEY_ID` | Browser checkout widget; Key ID only (no secret) |
| `VITE_SENTRY_DSN` | empty or DSN | same DSN as `SENTRY_DSN` | same DSN as `SENTRY_DSN` | shared | Sentry project | Frontend error tracking |
| `VITE_API_BASE` | `/api/v1` | `/api/v1` | `/api/v1` | shared | `.env` / Railway | Override only when running against a remote API from local dev |
| `VITE_API_URL` | `http://localhost:3001` | `https://<staging-domain>` | `https://<prod-domain>` | per-env | `.env` / Railway | WebSocket/Socket.io base URL |
| `VITE_APP_BUILD` | `dev` or git sha | git sha / tag | git sha / tag | per-env | CI / Railway | Displayed in UI footer (UserProfileDropdown) |
| `VITE_E2E_GENERATION_POLL_ONLY` | `false` | `false` | `false` | per-env | `.env` / CI | Set to `true` only in E2E test runs to disable WebSocket and use polling |
| `VITE_STORAGE_PREFIX` | `infographicai` | `infographicai` | `infographicai` | shared | `.env` | localStorage key prefix; change only for multi-tenant deployments |

---

## Removed / Pruned Variables

The following variables were present in the previous `.env.example` and are removed in US-LAUNCH-009:

| Variable | Reason | Still in code? |
|----------|--------|----------------|
| `SESSION_SECRET` | Not read anywhere in `api/src` or `server` (grep confirms). Re-introduce if Express session middleware is added. | No |
| `PGHOST` | Superseded by `DATABASE_URL`. Legacy fallback still in `api/src/common/ensure-database-url.ts:10-16` — code removal is a follow-up story. Set `DATABASE_URL` directly. | Yes — follow-up |
| `PGPORT` | Same as `PGHOST`. Default 5432. | Yes — follow-up |
| `PGUSER` | Same as `PGHOST`. | Yes — follow-up |
| `PGPASSWORD` | Same as `PGHOST`. | Yes — follow-up |
| `PGDATABASE` | Same as `PGHOST`. Default `neondb`. | Yes — follow-up |
| `PADDLE_API_KEY` | Not configured on any environment; dead-letter code in `server/payments/providers/payment-provider.factory.ts:174`. | Yes — follow-up |
| `PADDLE_WEBHOOK_SECRET` | Dead-letter code in `server/routes.ts:58`. | Yes — follow-up |
| `PAYPAL_CLIENT_ID` | Dead-letter code in `server/payments/providers/payment-provider.factory.ts:176`. | Yes — follow-up |
| `PAYPAL_CLIENT_SECRET` | Same as `PAYPAL_CLIENT_ID`. | Yes — follow-up |

> **Follow-up required:** The "Yes — follow-up" entries above are pruned from `.env.example` but their read sites remain in `server/` or `api/src/common/`. A post-launch cleanup story must remove those code paths. This story (US-LAUNCH-009) is docs/config only and does not touch `.ts` files.

---

*Document created: 2026-07-12 — US-LAUNCH-009*
*Enumeration source: `grep -rhoE "process\.env\.[A-Z_0-9]+" api/src server client --include=*.ts --include=*.tsx | sort -u` + `import.meta.env.VITE_*` scan*
