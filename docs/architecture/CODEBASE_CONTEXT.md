# InfographicAI — Codebase Context Document

> **Purpose**: Permanent reference for AI assistants and developers. Describes architecture, tech stack, module structure, data models, auth/payment flows, key file paths, and known issues.
> **Last updated**: 2026-02-27

---

## 1. Product Overview

**InfographicAI** is a real-estate-focused infographic SaaS platform.

- Real estate agents upload property data (address, price, photos) via a conversational AI chat interface.
- The AI (OpenAI + Ideogram) generates branded marketing infographics (listings, sold announcements, open-house flyers, market reports, agent cards).
- Users manage, save, and export designs via a Fabric.js canvas editor.
- Monetized via RazorPay subscriptions (primary, INR), with Stripe as secondary.
- Multi-tenant: each user belongs to an **Organization** that holds the plan tier and monthly generation limits.

**MVP Status**: ~93% complete. Core flows (auth, generation, editor, billing) are operational. Zero automated tests exist.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (React 18)                       │
│   Vite SPA · wouter routing · React Query · Zustand · Radix UI  │
└───────────────────────────┬─────────────────────────────────────┘
                            │  HTTP (port 5000)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│            Express Proxy Server  (server/index.ts)               │
│   • Serves Vite dev/build                                        │
│   • Proxies /api/* → NestJS API on :3001                         │
│   • Express sessions + Google OAuth callback (legacy routes)     │
└───────────────────────────┬─────────────────────────────────────┘
                            │  HTTP :3001
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  NestJS API  (api/src/)                          │
│   • JWT + Google OAuth + API-key auth (Passport)                 │
│   • Global rate limiting: 100 req/60s (ThrottlerModule)         │
│   • Swagger docs at /api/docs                                    │
│   • Socket.io for real-time generation progress                  │
│   ┌──────────┬──────────┬──────────┬──────────┬──────────────┐  │
│   │   auth   │payments  │infograph │templates │ conversations│  │
│   │          │          │   ics    │          │              │  │
│   └──────────┴──────────┴──────────┴──────────┴──────────────┘  │
│   ┌──────────┬──────────┬──────────┐                            │
│   │ designs  │  users   │ ai-gen   │                            │
│   └──────────┴──────────┴──────────┘                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │  Prisma ORM
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              PostgreSQL Database                                  │
│   12 models: User, Organization, Subscription, Payment,          │
│   Invoice, Infographic, Template, Conversation, Message,         │
│   Extraction, UsageRecord, ApiKey                                │
└─────────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼──────────────────┐
          ▼                 ▼                  ▼
    ┌──────────┐     ┌──────────┐       ┌──────────┐
    │ OpenAI   │     │Ideogram  │       │ RazorPay │
    │ GPT-4o   │     │ Image    │       │ / Stripe │
    └──────────┘     └──────────┘       └──────────┘
```

---

## 3. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | React | 18.3.1 |
| Build tool | Vite | 6.x |
| Routing | wouter | 3.3.5 |
| Server state | @tanstack/react-query | 5.60.5 |
| Client state | Zustand | 5.0.2 |
| Forms | react-hook-form | 7.55.0 |
| UI components | Radix UI (full suite) | latest |
| Styling | Tailwind CSS | 3.4.17 |
| Animation | framer-motion | 11.13.1 |
| Charts | Recharts | 2.15.2 |
| Canvas editor | Fabric.js | (via custom wrapper) |
| Proxy server | Express | 4.x |
| API framework | NestJS | 11.1.6 |
| ORM | Prisma | 6.19.1 |
| Database | PostgreSQL | 15+ |
| Auth | Passport.js (JWT + Google + API key) | NestJS v11 |
| WebSockets | Socket.io (via NestJS Gateway) | 4.x |
| Schema validation | Zod | 3.24.2 |
| Payment primary | RazorPay | SDK 2.9.6 |
| Payment secondary | Stripe | SDK 20.1.0 |
| AI text/chat | OpenAI GPT-4o | SDK 6.3.0 |
| AI image | Ideogram API | (REST, no SDK) |
| Notifications | Sonner (toast) | latest |

---

## 4. Module Map

| Module | Path | Responsibility |
|--------|------|----------------|
| `auth` | `api/src/modules/auth/` | Registration, login, JWT, Google OAuth, API-key strategy |
| `payments` | `api/src/modules/payments/` | Subscriptions, webhooks, payment history, usage analytics |
| `infographics` | `api/src/modules/infographics/` | Infographic generation, prompt extraction, usage limits |
| `ai-generation` | `api/src/modules/ai-generation/` | OpenAI orchestration, Ideogram image calls, BullMQ queue |
| `designs` | `api/src/modules/designs/` | Save/load Fabric.js canvas JSON, export |
| `templates` | `api/src/modules/templates/` | Seed data, template filtering by category/property type |
| `conversations` | `api/src/modules/conversations/` | AI chat sessions, message history |
| `users` | `api/src/modules/users/` | Profile CRUD, plan limits enforcement |

### Module File Layout (payments as example)
```
api/src/modules/payments/
├── controllers/
│   ├── payments.controller.ts        # REST endpoints: subscribe, verify, cancel, history
│   └── usage-analytics.controller.ts # GET /analytics endpoints
├── services/
│   ├── payments.service.ts           # Core business logic (710 lines)
│   ├── usage-analytics.service.ts   # Monthly usage, cost breakdown, CSV export
│   └── subscription-storage.service.ts # DB read/write for subscriptions
├── dto/
│   └── payments.dto.ts
└── payments.module.ts
```

---

## 5. Database Model Summary

### User
```
id, email, password (bcrypt), googleId
name, phone, role (OWNER/MEMBER/ADMIN)
organizationId → Organization
razorpayCustomerId, stripeCustomerId, paddleCustomerId
createdAt, updatedAt
```

### Organization
```
id, name, slug
planTier (FREE|SOLO|TEAM|BROKERAGE|API_STARTER|API_GROWTH|API_ENTERPRISE)
monthlyLimit (int), activeSubscriptionId
brandColors (JSON), logoUrl
razorpayCustomerId, stripeCustomerId, paddleCustomerId
```

### Subscription
```
id, userId, organizationId
provider (RAZORPAY|STRIPE|PADDLE|PAYPAL)
providerSubscriptionId, providerPlanId, providerCustomerId
status (ACTIVE|PAST_DUE|CANCELLED|HALTED|PAUSED|EXPIRED)
planTier, billingPeriod (MONTHLY|ANNUAL)
amount (paise/cents), currency
currentPeriodStart, currentPeriodEnd
cancelAtPeriodEnd (bool), cancelledAt
createdAt, updatedAt
```

### Payment
```
id, userId, organizationId, subscriptionId
provider, providerPaymentId, amount, currency
status (PENDING|AUTHORIZED|CAPTURED|REFUNDED|FAILED)
signature, errorCode, errorDescription
method (card/netbanking/upi/wallet)
createdAt, updatedAt
```

### Infographic
```
id, userId, organizationId
propertyData (JSON), imageUrl
aiModel, status (pending|processing|completed|failed)
errorMessage, prompt (text)
→ UsageRecord (1:1)
createdAt, updatedAt
```

### UsageRecord
```
id, userId, organizationId, infographicId
creditsUsed, costUsd
aiModel, month (YYYY-MM)
createdAt
```

### Other Models
- **Invoice** — issued/paid invoices with URLs
- **Template** — seed templates with categories and property type filters
- **Conversation** — AI chat sessions with isFavorite, propertyType, priceRange
- **Message** — individual messages in a conversation (role: user/assistant)
- **Extraction** — property data extracted from prompts, with confidence score
- **ApiKey** — org-scoped API keys with lastUsedAt

---

## 6. Auth Flows

### 6.1 JWT Local Auth
```
POST /api/v1/auth/register
  body: { email, password, name, organizationName? }
  → Creates User + Organization (FREE tier)
  → Returns { accessToken (JWT), user }

POST /api/v1/auth/login
  body: { email, password }
  → Validates password (bcrypt.compare)
  → Returns { accessToken, user }

All protected routes: Authorization: Bearer <JWT>
JWT payload: { sub: userId, email, organizationId, role }
```

### 6.2 Google OAuth
```
GET /api/v1/auth/google
  → Redirects to Google consent screen

GET /api/v1/auth/google/callback
  → Exchanges code for profile
  → Upserts User (creates org on first signup)
  → Returns JWT same as local auth
```

### 6.3 API Key Auth
```
Header: x-api-key: <key>
→ ApiKey model lookup → org context injected
→ Applies to programmatic/API tier users
```

---

## 7. Payment Flow

```
1. User clicks plan CTA on /pricing
   → GET /api/v1/payments/provider-info  (returns RAZORPAY + key_id)
   → POST /api/v1/payments/create-subscription
      body: { planTier, billingPeriod }
      → Creates Subscription record (status=PENDING) ⚠️ PT-04
      → Calls RazorPay API: razorpay.subscriptions.create()
      → Returns { subscriptionId, shortUrl?, key_id }

2. Frontend opens RazorPay JS widget (not redirect)
   → User completes payment with test card 5267 3181 8797 5449

3. On success, RazorPay fires onSuccess callback
   → POST /api/v1/payments/verify
      body: { razorpay_subscription_id, razorpay_payment_id, razorpay_signature }
      → Validates HMAC signature
      → Updates Payment record

4. RazorPay sends webhook
   POST /api/webhooks/razorpay (Express proxy forwards)
   or POST /api/v1/webhooks/razorpay (NestJS direct)
   Events handled:
   ├── subscription.activated  → Subscription.status = ACTIVE, Org.planTier updated
   ├── subscription.charged    → Payment record created (CAPTURED)
   ├── subscription.cancelled  → Subscription.status = CANCELLED, Org downgraded
   └── payment.failed          → Payment record (FAILED)

5. User sees "Payment Successful" toast
   → Account > Billing shows updated plan + next billing date
```

### Known Payment Issues
| ID | Status | Description |
|----|--------|-------------|
| PT-03 | PENDING | Previous subscription not cancelled when upgrading plan |
| PT-04 | PENDING | Subscription marked ACTIVE before webhook (before payment completes) |
| PT-05 | VERIFY | TEAM plan shows ₹1 instead of ₹6,999 in RazorPay modal |
| PT-06 | DEFERRED | BROKERAGE plan IDs not configured in env |

---

## 8. Key File Reference Table

### Backend — API (NestJS)

| Domain | File | Notes |
|--------|------|-------|
| App root | `api/src/main.ts` | Bootstrap, CORS, Swagger |
| App module | `api/src/app.module.ts` | Module imports, ThrottlerModule |
| DB module | `api/src/database/database.module.ts` | PrismaService provider |
| Prisma schema | `api/prisma/schema.prisma` | All 12 models |
| Auth service | `api/src/modules/auth/services/auth.service.ts` | register, login, googleLogin |
| Auth controller | `api/src/modules/auth/controllers/auth.controller.ts` | REST endpoints |
| JWT strategy | `api/src/modules/auth/strategies/jwt.strategy.ts` | Token validation |
| Google strategy | `api/src/modules/auth/strategies/google.strategy.ts` | OAuth |
| Payments service | `api/src/modules/payments/services/payments.service.ts` | 710 lines, all billing logic |
| Payments controller | `api/src/modules/payments/controllers/payments.controller.ts` | REST endpoints |
| Usage analytics | `api/src/modules/payments/services/usage-analytics.service.ts` | 222 lines |
| Webhook handler | `api/src/modules/payments/controllers/payments.controller.ts` | `/webhooks/razorpay` |
| Infographics service | `api/src/modules/infographics/services/infographics.service.ts` | generate(), usage limits |
| Generations service | `api/src/modules/infographics/services/generations.service.ts` | AI orchestration |
| Generation gateway | `api/src/modules/infographics/gateways/generation-progress.gateway.ts` | Socket.io |
| Designs service | `api/src/modules/designs/services/designs.service.ts` | Canvas save/load |
| Templates data | `api/src/modules/templates/data/templates.data.ts` | Seed template objects |
| Users service | `api/src/modules/users/users.service.ts` | PLAN_USER_LIMITS, CRUD |

### Backend — Express Proxy (server/)

| File | Notes |
|------|-------|
| `server/index.ts` | Entry point, Vite + Express setup |
| `server/routes.ts` | Express routes, proxy to NestJS |
| `server/payments/providers/razorpay.provider.ts` | RazorPay SDK wrapper |
| `server/payments/providers/stripe.provider.ts` | Stripe SDK wrapper |
| `server/payments/providers/payment-provider.factory.ts` | Provider selection |
| `server/payments/config.ts` | Payment plan config |

### Frontend (client/src/)

| Domain | File | Notes |
|--------|------|-------|
| App root | `client/src/App.tsx` | Routes, providers |
| API client | `client/src/lib/api.ts` | Axios instance, all API calls |
| Auth page | `client/src/pages/AuthPage.tsx` | Login/register forms |
| Landing | `client/src/pages/LandingPage.tsx` | Public landing |
| Pricing | `client/src/pages/PricingPage.tsx` | Plan cards + RazorPay trigger |
| Editor | `client/src/components/editor/` | Fabric.js canvas, tools |
| Save dialog | `client/src/components/editor/SaveDialog.tsx` | Save/export |
| Templates page | `client/src/components/pages/TemplatesPage.tsx` | Browse templates |
| My Designs | `client/src/components/pages/MyDesignsPage.tsx` | Saved designs |
| Account page | `client/src/components/pages/AccountPage.tsx` | Tabs: billing, usage, security |
| Billing screen | `client/src/components/account/BillingScreen.tsx` | Current plan, cancel |
| Usage screen | `client/src/components/account/UsageScreen.tsx` | Usage bars |
| Security screen | `client/src/components/account/SecurityScreen.tsx` | Password, 2FA |
| Subscription card | `client/src/components/payment/SubscriptionCard.tsx` | Plan display |
| Payment history | `client/src/components/payment/PaymentHistory.tsx` | Invoice list |
| App header | `client/src/components/navigation/AppHeader.tsx` | Nav bar |
| User profile menu | `client/src/components/UserProfileDropdown.tsx` | Avatar menu |
| Usage dashboard | `client/src/pages/UsageDashboardPage.tsx` | Charts + history |

### Config & Scripts

| File | Notes |
|------|-------|
| `.env.example` | All required env vars (see §9) |
| `package.json` | Root-level scripts and dependencies |
| `scripts/run-payment-automated-tests.js` | API-level payment smoke tests |
| `scripts/verify-payment-prerequisites.js` | Env validation before testing |
| `docs/PAYMENT_TEST_CHECKLIST.md` | Manual payment test guide |
| `docs/ISSUES_REPORT.md` | Known bugs and PT-series issues |

---

## 9. Development Status & Known Issues

### PT-series Issues (from ISSUES_REPORT.md)
| ID | Status | Impact | Description |
|----|--------|--------|-------------|
| PT-01 | ✅ FIXED | High | RazorPay shortUrl redirect broke checkout; switched to JS widget |
| PT-02 | ✅ FIXED | High | `VITE_RAZORPAY_KEY_ID` was placeholder value |
| PT-03 | PENDING | High | Old subscription not cancelled when upgrading plan; orphaned ACTIVE subscriptions in DB |
| PT-04 | PENDING | High | Subscription status set to ACTIVE before webhook confirms payment; users get plan access before paying |
| PT-05 | VERIFY | Medium | TEAM plan displays ₹1 instead of ₹6,999 in RazorPay modal |
| PT-06 | DEFERRED | Low | BROKERAGE plan IDs not configured (plan exists in code, not in RazorPay dashboard) |

### Other Known Gaps
- Zero automated tests (unit, integration, E2E)
- `AppearanceScreen.tsx` exists but not linked in account navigation
- Drizzle ORM schema (`drizzle.config.ts`) is legacy / coexists with Prisma — not actively used
- `server/` (Express) and `api/` (NestJS) payment logic is partially duplicated

---

## 10. Environment Variables Reference

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `PORT` | ✅ | Express server port (default: 5000) |
| `API_PORT` | ✅ | NestJS API port (default: 3001) |
| `BASE_URL` | ✅ | Full URL of Express server |
| `CLIENT_URL` | ✅ | Frontend URL for CORS |
| `NODE_ENV` | ✅ | `development` or `production` |
| `JWT_SECRET` | ✅ | Random base64 string (32+ bytes) |
| `SESSION_SECRET` | ✅ | Random base64 string (64+ bytes) |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth app credential |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth app credential |
| `GOOGLE_CALLBACK_URL` | ✅ | Must match Google Console config |
| `OPENAI_API_KEY` | ✅ | GPT-4o for chat and text |
| `IDEOGRAM_API_KEY` | ✅ | Image generation |
| `RAZORPAY_KEY_ID` | ✅ | From RazorPay dashboard |
| `RAZORPAY_KEY_SECRET` | ✅ | From RazorPay dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | ✅ | For webhook HMAC validation |
| `VITE_RAZORPAY_KEY_ID` | ✅ | Frontend key (same as KEY_ID) |
| `RAZORPAY_PLAN_SOLO_MONTHLY` | ✅ | Plan ID from RazorPay dashboard |
| `RAZORPAY_PLAN_SOLO_ANNUAL` | ✅ | Plan ID from RazorPay dashboard |
| `RAZORPAY_PLAN_TEAM_MONTHLY` | ✅ | Plan ID from RazorPay dashboard |
| `RAZORPAY_PLAN_TEAM_ANNUAL` | ✅ | Plan ID from RazorPay dashboard |
| `RAZORPAY_PLAN_BROKERAGE_MONTHLY` | ⚠️ PT-06 | Not yet configured |
| `RAZORPAY_SUBSCRIPTION_START_BUFFER_SECONDS` | optional | Default: 900 (15 min buffer) |
| `STRIPE_ENABLED` | optional | Set `true` to enable Stripe |
| `STRIPE_SECRET_KEY` | if Stripe | Stripe secret |
| `STRIPE_WEBHOOK_SECRET` | if Stripe | Stripe webhook signing secret |

---

## 11. Running the Application

```bash
# Install all dependencies
npm install

# Start both servers (Express :5000 + NestJS :3001)
npm run dev          # or ./start-both.sh on Linux/Mac

# Start NestJS API only
npm run api

# Database operations
npx prisma db push          # Sync schema to DB (no migration history)
npx prisma studio           # Visual DB browser

# Payment smoke tests (requires running app)
npm run test:payment

# Verify environment
node scripts/verify-payment-prerequisites.js
```

**Port Summary:**
- `5000` — Express proxy + Vite (browser entry point)
- `3001` — NestJS API (internal, proxied via `/api/*`)
