# 🚀 Complete Setup Guide - Environment & Configuration

> **Purpose:** Comprehensive guide for environment setup, configuration, and secrets management  
> **Last Updated:** January 2025  
> **Status:** MVP Ready

---

## 📋 Table of Contents

1. [Environment Files Structure](#environment-files-structure)
2. [Environment Variables Configuration](#environment-variables-configuration)
3. [Environment Variables Status & Checklist](#environment-variables-status--checklist)
4. [Secrets Management](#secrets-management)
5. [Quick Start Prompts](#quick-start-prompts)
6. [Payment Integration Setup](#payment-integration-setup)

---

## 📁 Environment Files Structure

### Which Files Are Needed?

#### ✅ **Root Folder (Backend Configuration)**

**Required:**
- `.env` - Main backend environment file (already exists)
  - Contains: Database URL, API keys, secrets
  - Used by: NestJS backend, Prisma
  - Location: Root directory

**Optional:**
- `.env.production` - Production-specific overrides
  - Only needed if you want separate production values
  - Alternative: Use system environment variables on your hosting platform
  - NestJS loads this first, then falls back to `.env`

**Templates (committed to git):**
- `.env.example` - Template showing required variables

#### ✅ **Client Folder (Frontend Configuration)**

**Required:**
- `client/.env.development` - Development environment (already created)
  - Contains: Development API URLs, public keys
  - Used by: Vite during development

**Optional:**
- `client/.env.production` - Production environment (already created)
  - Contains: Production API URLs, public keys
  - Used by: Vite during production build

**Templates (committed to git):**
- `client/.env.example` - Template showing required variables

#### ❌ **API Folder (NOT Needed)**

**Do NOT create:**
- `api/.env` - ❌ Removed to avoid conflicts
- `api/.env.production` - ❌ Not needed

**Why?**
- We removed `api/.env` earlier because it conflicted with root `.env`
- NestJS is configured to load from root `.env` only
- Having both caused Prisma conflicts

### File Structure

```
project-root/
├── .env                    ✅ Main backend config (gitignored)
├── .env.example            ✅ Template (committed)
├── .env.production         ⚠️  Optional production overrides (gitignored)
│
├── client/
│   ├── .env.development    ✅ Development config (gitignored)
│   ├── .env.production     ✅ Production config (gitignored)
│   └── .env.example        ✅ Template (committed)
│
└── api/
    └── (no .env files)     ✅ Correct - use root .env instead
```

### How NestJS Loads Environment Variables

Based on `api/src/app.module.ts`:

1. **Production mode**: Tries `.env.production` first, then `.env`
2. **Development mode**: Uses `.env`
3. **System variables**: Always take precedence (if `ignoreEnvFile: true`)

### Recommendation

#### For Development:
- ✅ Use root `.env` (already exists)
- ✅ Use `client/.env.development` (already created)

#### For Production:
- **Option A**: Use root `.env` with production values
- **Option B**: Create root `.env.production` with production values
- **Option C**: Set environment variables on hosting platform (recommended)

**Best Practice**: Use system environment variables on your hosting platform (Vercel, Heroku, Railway) instead of `.env.production` files. This is more secure and easier to manage.

### Summary

**You need:**
- ✅ Root `.env` (already exists)
- ✅ `client/.env.development` (already created)
- ✅ `client/.env.production` (already created)

**You DON'T need:**
- ❌ `api/.env` files (removed to avoid conflicts)
- ❌ Root `.env.production` (optional, use system env vars instead)

The `.gitignore` entries for `api/.env` are there to ensure they stay ignored if accidentally created, but you should NOT create them.

---

## ⚙️ Environment Variables Configuration

### Architecture Overview

#### Frontend (Client)
- **Location**: `client/` directory
- **Build-time variables**: Variables prefixed with `VITE_` are bundled into the JavaScript at build time
- **Public exposure**: All `VITE_*` variables are exposed to the browser (never include secrets!)
- **Files**: `client/.env.development`, `client/.env.production`

#### Backend (API)
- **Location**: `api/` directory (NestJS)
- **Runtime variables**: Loaded when the server starts
- **Private**: All variables are server-side only (can include secrets)
- **Files**: Root `.env` or system environment variables

### Frontend Environment Variables

#### Development (`client/.env.development`)
```env
VITE_API_URL=http://localhost:3001
VITE_API_BASE=/api/v1
VITE_CLIENT_URL=http://localhost:5173
VITE_RAZORPAY_KEY_ID=rzp_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### Production (`client/.env.production`)
```env
VITE_API_URL=https://api.yourdomain.com
VITE_API_BASE=/api/v1
VITE_CLIENT_URL=https://app.yourdomain.com
VITE_RAZORPAY_KEY_ID=rzp_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### Available Frontend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Full API server URL (for cross-origin) | `https://api.yourdomain.com` |
| `VITE_API_BASE` | API base path (for same-origin) | `/api/v1` |
| `VITE_CLIENT_URL` | Frontend application URL | `https://app.yourdomain.com` |
| `VITE_RAZORPAY_KEY_ID` | RazorPay publishable key | `rzp_test_...` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` |

### Backend Environment Variables

#### Root `.env` File
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Server Configuration
API_PORT=3001
NODE_ENV=development
BASE_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

# Authentication
JWT_SECRET=your-secret-key-change-in-production

# AI Service API Keys (SECRET!)
OPENAI_API_KEY=sk-proj-...
IDEOGRAM_API_KEY=...
GOOGLE_API_KEY=...

# Payment Provider Secrets (SECRET!)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RAZORPAY_PLAN_SOLO=plan_xxxxx
RAZORPAY_PLAN_TEAM=plan_xxxxx
RAZORPAY_PLAN_BROKERAGE=plan_xxxxx

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_ENABLED=false
STRIPE_PLAN_SOLO=price_xxxxx
STRIPE_PLAN_TEAM=price_xxxxx
STRIPE_PLAN_BROKERAGE=price_xxxxx
```

### Deployment Scenarios

#### Scenario 1: Separate Domains (Recommended)

**Frontend**: `https://app.yourdomain.com`  
**API**: `https://api.yourdomain.com`

**Frontend `.env.production`**:
```env
VITE_API_URL=https://api.yourdomain.com
VITE_API_BASE=/api/v1
```

**Backend `.env.production`**:
```env
BASE_URL=https://api.yourdomain.com
CLIENT_URL=https://app.yourdomain.com
```

#### Scenario 2: Same Domain, Different Paths

**Frontend**: `https://yourdomain.com`  
**API**: `https://yourdomain.com/api`

**Frontend `.env.production`**:
```env
VITE_API_URL=  # Empty - use relative paths
VITE_API_BASE=/api/v1
```

**Backend**: No CORS needed (same origin)

#### Scenario 3: Cloud Platform Deployment

##### Vercel (Frontend)
Set environment variables in Vercel dashboard:
```bash
VITE_API_URL=https://api.yourdomain.com
VITE_RAZORPAY_KEY_ID=rzp_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

##### Heroku/Railway/Render (Backend)
Set environment variables via CLI or dashboard:
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
RAZORPAY_KEY_SECRET=...
```

### How It Works

#### Frontend API Calls

The `client/src/lib/api.ts` file uses a helper function `getApiUrl()` that:
- Uses full URL (`VITE_API_URL + VITE_API_BASE + path`) when `VITE_API_URL` is set (cross-origin)
- Uses relative path (`VITE_API_BASE + path`) when `VITE_API_URL` is empty (same-origin)

#### Development Proxy

During development, Vite proxies `/api/*` requests to the backend server configured in `VITE_API_URL`.

#### CORS Configuration

The backend (`api/src/main.ts`) uses `CLIENT_URL` environment variable to configure CORS:
- Allows requests from the frontend domain
- Enables credentials for authenticated requests

### Security Best Practices

#### ✅ Safe to Expose (Frontend)
- API URLs
- Publishable payment provider keys (`VITE_RAZORPAY_KEY_ID`, `VITE_STRIPE_PUBLISHABLE_KEY`)
- Feature flags
- Public configuration

#### ❌ Never Expose (Frontend)
- Secret API keys (`RAZORPAY_KEY_SECRET`, `STRIPE_SECRET_KEY`)
- Database URLs
- JWT secrets
- Any credentials or tokens

### Setup Instructions

1. **Copy example files**:
   ```bash
   cp .env.example .env
   cp client/.env.example client/.env.development
   ```

2. **Fill in your values**:
   - Update `.env` with your database and API keys
   - Update `client/.env.development` with your frontend configuration

3. **For production**:
   - Create `client/.env.production` with production URLs
   - Set environment variables on your hosting platform

### Troubleshooting

#### Frontend can't connect to API
- Check `VITE_API_URL` is set correctly
- Verify CORS is configured on backend (`CLIENT_URL`)
- Check browser console for CORS errors

#### Environment variables not loading
- Ensure variable names start with `VITE_` for frontend
- Restart dev server after changing `.env` files
- Check file is in correct location (`client/.env.development`)

#### Prisma conflicts
- Remove `api/.env` if it conflicts with root `.env`
- Use only root `.env` for backend variables

---

## ✅ Environment Variables Status & Checklist

### Variables with Values (From .env.example.backup)

| Variable | Status | Notes |
|----------|--------|-------|
| `DATABASE_URL` | ✅ SET | Neon PostgreSQL connection string |
| `PGDATABASE` | ✅ SET | Database name: neondb |
| `PGHOST` | ✅ SET | Neon host |
| `PGPORT` | ✅ SET | Port: 5432 |
| `PGUSER` | ✅ SET | Database user |
| `PGPASSWORD` | ✅ SET | Database password |
| `SESSION_SECRET` | ✅ SET | Session encryption secret |
| `OPENAI_API_KEY` | ✅ SET | OpenAI API key configured |
| `IDEOGRAM_API_KEY` | ✅ SET | Ideogram API key configured |
| `GOOGLE_API_KEY` | ✅ SET | Google API key configured |

### Variables That Need Attention

| Variable | Status | Action Required |
|----------|--------|----------------|
| `JWT_SECRET` | ⚠️ COMMAND | Currently contains command `openssl rand -base64 32` instead of actual value. **Run the command to generate a secure secret.** |

### Missing Variables (Payment Providers)

#### RazorPay Configuration
- `RAZORPAY_KEY_ID` - Missing
- `RAZORPAY_KEY_SECRET` - Missing
- `RAZORPAY_WEBHOOK_SECRET` - Missing
- `RAZORPAY_PLAN_SOLO` - Missing
- `RAZORPAY_PLAN_TEAM` - Missing
- `RAZORPAY_PLAN_BROKERAGE` - Missing
- `RAZORPAY_PLAN_API_STARTER` - Missing
- `RAZORPAY_PLAN_API_GROWTH` - Missing

**Action:** Get these from https://dashboard.razorpay.com/app/keys

#### Stripe Configuration
- `STRIPE_SECRET_KEY` - Missing
- `STRIPE_PUBLISHABLE_KEY` - Missing
- `STRIPE_WEBHOOK_SECRET` - Missing
- `STRIPE_PLAN_SOLO` - Missing
- `STRIPE_PLAN_TEAM` - Missing
- `STRIPE_PLAN_BROKERAGE` - Missing
- `STRIPE_PLAN_API_STARTER` - Missing
- `STRIPE_PLAN_API_GROWTH` - Missing

**Action:** Get these from https://dashboard.stripe.com/apikeys (if using Stripe)

### Optional Variables (Have Defaults)

These variables have defaults and are optional:
- `PORT` - Default: 5000
- `API_PORT` - Default: 3001
- `NODE_ENV` - Default: development
- `BASE_URL` - Default: http://localhost:5000
- `CLIENT_URL` - Default: http://localhost:5173
- `STRIPE_ENABLED` - Default: false

### Immediate Actions Required

1. **Fix JWT_SECRET:**
   ```powershell
   # Generate a secure JWT secret
   openssl rand -base64 32
   # Then update .env file with the generated value
   ```

2. **Add Payment Provider Keys (if using payments):**
   - RazorPay: Get from https://dashboard.razorpay.com/app/keys
   - Stripe: Get from https://dashboard.stripe.com/apikeys

3. **Create Payment Plans:**
   - Create subscription plans in RazorPay/Stripe dashboards
   - Add plan IDs to `.env` file

### Summary

- **Total Variables:** ~30+
- **Configured:** 10 ✅
- **Needs Fix:** 1 ⚠️ (JWT_SECRET)
- **Missing (Payment):** 16 ❌ (Optional - only if using payments)
- **Optional:** 6 (have defaults)

---

## 🔍 Database Connection Troubleshooting

### Common Issues

#### Issue: Prisma Commands Fail with P1001 Error

**Error Message:**
```
Error: P1001: Can't reach database server at `ep-lingering-frost-afktjhej.c-2.us-west-2.aws.neon.tech:5432`
```

**Root Cause:**
The Neon database server is unreachable. This typically happens because:

1. **Neon Auto-Pause** (Most Common) - Neon automatically pauses databases after periods of inactivity
2. **Network/Firewall Issues** - Connection blocked by firewall or network configuration
3. **Invalid/Expired Connection String** - Database endpoint may have changed

### Solutions

#### Solution 1: Wake Up Neon Database (Most Likely Fix)

1. **Visit Neon Console:**
   - Go to https://console.neon.tech/
   - Log in to your account
   - Find your project with database `neondb`

2. **Check Database Status:**
   - Look for "Paused" or "Active" status
   - If paused, click "Resume" or "Wake Up"

3. **Wait for Activation:**
   - Database wake-up takes 5-30 seconds
   - You'll see status change to "Active"

4. **Retry Connection:**
   ```powershell
   node check-db-connection.js
   ```

#### Solution 2: Verify Connection String

1. **Get Fresh Connection String:**
   - In Neon Console, go to your database
   - Click "Connection Details" or "Connection String"
   - Copy the new connection string

2. **Update .env File:**
   ```env
   DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
   ```

3. **Test Connection:**
   ```powershell
   node check-db-connection.js
   ```

#### Solution 3: Check Network/Firewall

If database is active but still unreachable:

1. **Verify Internet Connection:**
   ```powershell
   Test-NetConnection ep-lingering-frost-afktjhej.c-2.us-west-2.aws.neon.tech -Port 5432
   ```

2. **Check Firewall:**
   - Ensure port 5432 is not blocked
   - Check corporate firewall/VPN settings

#### Solution 4: Use Neon's Connection Pooler (Recommended)

Neon provides a connection pooler that's more reliable:

1. **In Neon Console:**
   - Go to Connection Details
   - Look for "Pooled connection" option
   - Use the pooled connection string instead

2. **Update .env:**
   ```env
   DATABASE_URL="postgresql://user:password@ep-xxx-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require"
   ```

### Quick Diagnostic Commands

#### Test Database Connection
```powershell
node check-db-connection.js
```

#### Test Prisma Commands (without DB connection)
```powershell
# These work without database:
npx prisma format --schema=api/prisma/schema.prisma
npx prisma generate --schema=api/prisma/schema.prisma

# These require database:
npx prisma migrate status --schema=api/prisma/schema.prisma
npx prisma migrate dev --name migration_name --schema=api/prisma/schema.prisma
```

#### Check Environment Variables
```powershell
# PowerShell
Get-Content .env | Select-String "DATABASE_URL"

# Or check if loaded:
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL ? 'SET' : 'NOT SET')"
```

### Prevention

To prevent auto-pause in Neon:

1. **Use Connection Pooler** - More reliable, stays active longer
2. **Set Up Keep-Alive** - Configure periodic connections
3. **Upgrade Plan** - Some Neon plans don't auto-pause

### Current Database Info

- **Provider:** Neon (Serverless PostgreSQL)
- **Host:** `ep-lingering-frost-afktjhej.c-2.us-west-2.aws.neon.tech`
- **Database:** `neondb`
- **Region:** US West 2 (Oregon)
- **Status:** Likely paused (needs wake-up)

### Next Steps

1. ✅ Visit https://console.neon.tech/ and check database status
2. ✅ Wake up database if paused
3. ✅ Run `node check-db-connection.js` to verify connection
4. ✅ Once connected, run Prisma migrations:
   ```powershell
   npx prisma migrate dev --name add_conversations_and_extractions --schema=api/prisma/schema.prisma
   ```

---

## 📖 Complete Environment Variables Reference

This section provides a comprehensive reference of all environment variables used in the codebase.

### Summary

**Total Variables Found:** 30+  
- **Required:** 1 (DATABASE_URL - but app can run without it)
- **Optional:** 29+

### Environment Variables by Category

#### 🔴 Database Configuration

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `DATABASE_URL` | Yes* | None | `server/db.ts`, `server/index.ts` | PostgreSQL connection string. App throws error if not set, but can be bypassed for basic features. |

*Required for database features, but app can run without it for basic functionality.

#### 🟢 Server Configuration

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `PORT` | No | `5000` | `server/index.ts` | Express server port (serves both API and frontend) |
| `API_PORT` | No | `3001` | `api/src/main.ts`, `server/index.ts` | NestJS API server port |
| `BASE_URL` | No | `http://localhost:5000` | `server/routes.ts`, `server/payments/services/subscription.service.ts` | Base URL for webhooks and redirects |
| `CLIENT_URL` | No | `http://localhost:5173` | `api/src/main.ts` | Client URL for CORS configuration |
| `NODE_ENV` | No | `development` | Various | Environment mode (development/production) |

#### 🔐 Authentication & Security

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `JWT_SECRET` | No | `'infographic-jwt-secret'` | `api/src/modules/auth/strategies/jwt.strategy.ts`, `api/src/modules/auth/auth.module.ts`, `server/index.ts` | JWT secret key for token signing. **Should be changed in production.** |
| `SESSION_SECRET` | No | None | `server/index.ts` | Session encryption secret |

#### 🤖 AI Services

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `OPENAI_API_KEY` | No | None | `api/src/modules/ai-generation/services/openai.service.ts`, `server/index.ts` | OpenAI API key for AI features. App runs in demo mode without it. |
| `IDEOGRAM_API_KEY` | No | `''` | `api/src/modules/ai-generation/services/ideogram.service.ts`, `server/index.ts` | Ideogram API key for image generation |
| `GOOGLE_API_KEY` | No | None | Various | Google API key |
| `DEMO_MODE` | No | `'false'` | `api/src/modules/ai-generation/services/infographic.processor.ts`, `api/src/modules/ai-generation/services/ai-orchestrator.service.ts`, `server/index.ts` | Demo mode flag (`'true'` or `'false'`) |

#### 💳 RazorPay Configuration (India)

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `RAZORPAY_KEY_ID` | No | `''` | `server/payments/providers/razorpay.provider.ts`, `server/routes.ts`, `server/payments/providers/payment-provider.factory.ts` | RazorPay public key ID |
| `RAZORPAY_KEY_SECRET` | No | `''` | `server/payments/providers/razorpay.provider.ts`, `server/payments/providers/payment-provider.factory.ts` | RazorPay private key secret |
| `RAZORPAY_WEBHOOK_SECRET` | No | None | `server/routes.ts` | RazorPay webhook signature secret |
| `RAZORPAY_PLAN_SOLO` | No | `'plan_solo'` | `server/payments/services/subscription.service.ts` | RazorPay plan ID for Solo tier |
| `RAZORPAY_PLAN_TEAM` | No | `'plan_team'` | `server/payments/services/subscription.service.ts` | RazorPay plan ID for Team tier |
| `RAZORPAY_PLAN_BROKERAGE` | No | `'plan_brokerage'` | `server/payments/services/subscription.service.ts` | RazorPay plan ID for Brokerage tier |
| `RAZORPAY_PLAN_API_STARTER` | No | `'plan_api_starter'` | `server/payments/services/subscription.service.ts` | RazorPay plan ID for API Starter tier |
| `RAZORPAY_PLAN_API_GROWTH` | No | `'plan_api_growth'` | `server/payments/services/subscription.service.ts` | RazorPay plan ID for API Growth tier |

#### 🌍 Stripe Configuration (International)

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `STRIPE_ENABLED` | No | `undefined` | `server/payments/providers/stripe.provider.ts` | Feature flag (`'true'` to enable Stripe) |
| `STRIPE_SECRET_KEY` | No | `''` | `server/payments/providers/stripe.provider.ts` | Stripe secret key (sk_test_... or sk_live_...) |
| `STRIPE_PUBLISHABLE_KEY` | No | `''` | `server/payments/providers/stripe.provider.ts`, `server/routes.ts` | Stripe publishable key (pk_test_... or pk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | No | `''` | `server/payments/providers/stripe.provider.ts`, `server/routes.ts` | Stripe webhook signature secret |
| `STRIPE_PLAN_SOLO` | No | `''` | `server/payments/services/subscription.service.ts` | Stripe Price ID for Solo tier |
| `STRIPE_PLAN_TEAM` | No | `''` | `server/payments/services/subscription.service.ts` | Stripe Price ID for Team tier |
| `STRIPE_PLAN_BROKERAGE` | No | `''` | `server/payments/services/subscription.service.ts` | Stripe Price ID for Brokerage tier |
| `STRIPE_PLAN_API_STARTER` | No | `''` | `server/payments/services/subscription.service.ts` | Stripe Price ID for API Starter tier |
| `STRIPE_PLAN_API_GROWTH` | No | `''` | `server/payments/services/subscription.service.ts` | Stripe Price ID for API Growth tier |

#### 🎨 Frontend Variables (VITE_*)

These variables are exposed to the browser. Only use public keys here.

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `VITE_API_URL` | No | None | `client/src/lib/api.ts` | Full API server URL (for cross-origin) |
| `VITE_API_BASE` | No | `/api/v1` | `client/src/lib/api.ts` | API base path (for same-origin) |
| `VITE_CLIENT_URL` | No | `http://localhost:5173` | Various | Frontend application URL |
| `VITE_RAZORPAY_KEY_ID` | No | None | `client/src/pages/PricingPage.tsx` | RazorPay public key for frontend (safe to expose) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | No | None | Referenced in docs | Stripe publishable key for frontend (safe to expose) |
| `VITE_ENABLE_STRIPE` | No | `false` | Various | Feature flag for Stripe in frontend |
| `VITE_ENABLE_ANALYTICS` | No | `true` | Various | Analytics feature flag |

#### 🔧 Optional Payment Providers

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `PADDLE_API_KEY` | No | None | `server/payments/providers/payment-provider.factory.ts` | Paddle API key |
| `PADDLE_WEBHOOK_SECRET` | No | None | `server/routes.ts` | Paddle webhook secret |
| `PAYPAL_CLIENT_ID` | No | None | `server/payments/providers/payment-provider.factory.ts` | PayPal client ID |
| `PAYPAL_CLIENT_SECRET` | No | None | `server/payments/providers/payment-provider.factory.ts` | PayPal client secret |

### Code Locations

#### Backend (Node.js/Express)
- `server/index.ts` - Server startup, NestJS process spawning
- `server/db.ts` - Database connection
- `server/routes.ts` - Payment routes, webhook handling
- `server/payments/providers/razorpay.provider.ts` - RazorPay integration
- `server/payments/providers/stripe.provider.ts` - Stripe integration
- `server/payments/providers/payment-provider.factory.ts` - Payment provider factory
- `server/payments/services/subscription.service.ts` - Subscription service

#### API (NestJS)
- `api/src/main.ts` - API server startup
- `api/src/modules/auth/strategies/jwt.strategy.ts` - JWT authentication
- `api/src/modules/auth/auth.module.ts` - Auth module configuration
- `api/src/modules/ai-generation/services/openai.service.ts` - OpenAI service
- `api/src/modules/ai-generation/services/ideogram.service.ts` - Ideogram service
- `api/src/modules/ai-generation/services/infographic.processor.ts` - Infographic processor
- `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` - AI orchestrator

#### Frontend (React/Vite)
- `client/src/pages/PricingPage.tsx` - Pricing page with RazorPay integration
- `client/src/lib/api.ts` - API client

### Verification Checklist

#### ✅ Variables Found in Code
- [x] DATABASE_URL
- [x] PORT
- [x] API_PORT
- [x] BASE_URL
- [x] CLIENT_URL
- [x] NODE_ENV
- [x] JWT_SECRET
- [x] SESSION_SECRET
- [x] OPENAI_API_KEY
- [x] IDEOGRAM_API_KEY
- [x] GOOGLE_API_KEY
- [x] DEMO_MODE
- [x] RAZORPAY_KEY_ID
- [x] RAZORPAY_KEY_SECRET
- [x] RAZORPAY_WEBHOOK_SECRET
- [x] RAZORPAY_PLAN_SOLO
- [x] RAZORPAY_PLAN_TEAM
- [x] RAZORPAY_PLAN_BROKERAGE
- [x] RAZORPAY_PLAN_API_STARTER
- [x] RAZORPAY_PLAN_API_GROWTH
- [x] STRIPE_ENABLED
- [x] STRIPE_SECRET_KEY
- [x] STRIPE_PUBLISHABLE_KEY
- [x] STRIPE_WEBHOOK_SECRET
- [x] STRIPE_PLAN_SOLO
- [x] STRIPE_PLAN_TEAM
- [x] STRIPE_PLAN_BROKERAGE
- [x] STRIPE_PLAN_API_STARTER
- [x] STRIPE_PLAN_API_GROWTH
- [x] VITE_RAZORPAY_KEY_ID
- [x] VITE_STRIPE_PUBLISHABLE_KEY
- [x] VITE_ENABLE_STRIPE
- [x] VITE_ENABLE_ANALYTICS
- [x] PADDLE_API_KEY
- [x] PADDLE_WEBHOOK_SECRET
- [x] PAYPAL_CLIENT_ID
- [x] PAYPAL_CLIENT_SECRET

### Recommendations

1. **Create `.env.example`** with all variables documented above
2. **Add validation** for required variables on startup
3. **Document defaults** in code comments
4. **Add type safety** for environment variables (e.g., using zod)
5. **Separate** frontend and backend environment variables clearly
6. **Add** environment variable validation in `server/index.ts` startup

### Notes

1. **Security**: Never commit `.env` files to version control
2. **Defaults**: Most variables have defaults or the app handles missing values gracefully
3. **Frontend Variables**: Only `VITE_*` variables are accessible in browser code
4. **Payment Providers**: Multiple providers supported, but only RazorPay and Stripe are fully implemented
5. **Plan IDs**: Must be created in respective payment provider dashboards first
6. **Webhook Secrets**: Required for secure webhook signature verification

---

## 📊 Environment Variables Status Report

**Generated:** January 2025

### Summary

- **Total Variables in .env:** 33
- **✅ Configured:** 16
- **⚠️ Empty/Missing:** 16
- **🔴 Needs Fix:** 1 (JWT_SECRET contains command)
- **🔴 Critical:** 0 (all have defaults or are optional)

### ✅ Variables That Are Set

#### Database & Core
- ✅ `DATABASE_URL` - Neon PostgreSQL connection
- ✅ `PGDATABASE`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD` - PostgreSQL connection details
- ✅ `SESSION_SECRET` - Session encryption

#### Server Configuration
- ✅ `PORT` - Server port (default: 5000)
- ✅ `API_PORT` - API port (default: 3001)
- ✅ `BASE_URL` - Base URL for webhooks
- ✅ `CLIENT_URL` - Client URL
- ✅ `NODE_ENV` - Environment mode

#### AI Services
- ✅ `OPENAI_API_KEY` - OpenAI API key
- ✅ `IDEOGRAM_API_KEY` - Ideogram API key
- ✅ `GOOGLE_API_KEY` - Google API key

#### Authentication
- ⚠️ `JWT_SECRET` - **Contains command instead of actual value** (needs to be generated)

#### Payment Providers - Partial
- ✅ `STRIPE_ENABLED` - Stripe feature flag
- ✅ `RAZORPAY_PLAN_API_STARTER` - Set (but may be empty)
- ✅ `RAZORPAY_PLAN_API_GROWTH` - Set (but may be empty)
- ✅ `STRIPE_PLAN_API_STARTER` - Set (but may be empty)
- ✅ `STRIPE_PLAN_API_GROWTH` - Set (but may be empty)

### ⚠️ Empty or Missing Variables

#### 🔴 RazorPay Configuration (Required for RazorPay payments)

| Variable | Status | Action Required |
|----------|--------|----------------|
| `RAZORPAY_KEY_ID` | ❌ Empty | Get from https://dashboard.razorpay.com/app/keys |
| `RAZORPAY_KEY_SECRET` | ❌ Empty | Get from https://dashboard.razorpay.com/app/keys |
| `RAZORPAY_WEBHOOK_SECRET` | ❌ Empty | Generate in RazorPay dashboard under Webhooks |
| `RAZORPAY_PLAN_SOLO` | ❌ Empty | Create plan in RazorPay dashboard, then add plan ID |
| `RAZORPAY_PLAN_TEAM` | ❌ Empty | Create plan in RazorPay dashboard, then add plan ID |
| `RAZORPAY_PLAN_BROKERAGE` | ❌ Empty | Create plan in RazorPay dashboard, then add plan ID |
| `RAZORPAY_PLAN_API_STARTER` | ⚠️ Check | Verify if value is set or empty |
| `RAZORPAY_PLAN_API_GROWTH` | ⚠️ Check | Verify if value is set or empty |

**How to Get RazorPay Keys:**
1. Go to https://dashboard.razorpay.com/app/keys
2. Copy your **Key ID** (starts with `rzp_test_` or `rzp_live_`)
3. Copy your **Key Secret** (keep this secure!)
4. For webhook secret: Go to Settings → Webhooks → Add webhook → Copy secret

**How to Create RazorPay Plans:**
1. Go to https://dashboard.razorpay.com/app/plans
2. Create plans for each tier (Solo, Team, Brokerage, API Starter, API Growth)
3. Copy the Plan ID (starts with `plan_`)
4. Add to `.env` file

#### 🔴 Stripe Configuration (Required for Stripe payments)

| Variable | Status | Action Required |
|----------|--------|----------------|
| `STRIPE_SECRET_KEY` | ❌ Empty | Get from https://dashboard.stripe.com/apikeys |
| `STRIPE_PUBLISHABLE_KEY` | ❌ Empty | Get from https://dashboard.stripe.com/apikeys |
| `STRIPE_WEBHOOK_SECRET` | ❌ Empty | Generate in Stripe dashboard under Webhooks |
| `STRIPE_PLAN_SOLO` | ❌ Empty | Create price in Stripe dashboard, then add price ID |
| `STRIPE_PLAN_TEAM` | ❌ Empty | Create price in Stripe dashboard, then add price ID |
| `STRIPE_PLAN_BROKERAGE` | ❌ Empty | Create price in Stripe dashboard, then add price ID |
| `STRIPE_PLAN_API_STARTER` | ⚠️ Check | Verify if value is set or empty |
| `STRIPE_PLAN_API_GROWTH` | ⚠️ Check | Verify if value is set or empty |

**How to Get Stripe Keys:**
1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)
3. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
4. For webhook secret: Go to Developers → Webhooks → Add endpoint → Copy signing secret

**How to Create Stripe Prices:**
1. Go to https://dashboard.stripe.com/products
2. Create products for each tier
3. Add recurring prices (monthly/yearly)
4. Copy the Price ID (starts with `price_`)
5. Add to `.env` file

### 🎨 Frontend Variables Status

#### ✅ Client Environment File Exists
- ✅ `client/.env.development` exists

#### Frontend Variables Set:
- ✅ `VITE_API_URL=http://localhost:3001`
- ✅ `VITE_API_BASE=/api/v1`
- ✅ `VITE_CLIENT_URL=http://localhost:5173`
- ⚠️ `VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID` - **Placeholder value, needs real key**
- ⚠️ `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY` - **Placeholder value, needs real key**
- ✅ `VITE_ENABLE_STRIPE=false`
- ✅ `VITE_ENABLE_ANALYTICS=true`

#### ⚠️ Frontend Variables Needing Updates:
1. **`VITE_RAZORPAY_KEY_ID`** - Currently has placeholder `rzp_test_YOUR_KEY_ID`
   - Should match `RAZORPAY_KEY_ID` from root `.env`
   - Update in `client/.env.development`

2. **`VITE_STRIPE_PUBLISHABLE_KEY`** - Currently has placeholder `pk_test_YOUR_KEY`
   - Should match `STRIPE_PUBLISHABLE_KEY` from root `.env`
   - Update in `client/.env.development`

### 🔧 Immediate Actions Required

#### Priority 1: Payment Provider Setup (If Using Payments)

**For RazorPay:**
```bash
# 1. Get keys from RazorPay dashboard
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# 2. Create plans and get plan IDs
RAZORPAY_PLAN_SOLO=plan_xxxxx
RAZORPAY_PLAN_TEAM=plan_xxxxx
RAZORPAY_PLAN_BROKERAGE=plan_xxxxx
RAZORPAY_PLAN_API_STARTER=plan_xxxxx
RAZORPAY_PLAN_API_GROWTH=plan_xxxxx

# 3. Update frontend
# Edit client/.env.development
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx  # Same as RAZORPAY_KEY_ID
```

**For Stripe:**
```bash
# 1. Get keys from Stripe dashboard
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# 2. Create prices and get price IDs
STRIPE_PLAN_SOLO=price_xxxxx
STRIPE_PLAN_TEAM=price_xxxxx
STRIPE_PLAN_BROKERAGE=price_xxxxx
STRIPE_PLAN_API_STARTER=price_xxxxx
STRIPE_PLAN_API_GROWTH=price_xxxxx

# 3. Enable Stripe and update frontend
STRIPE_ENABLED=true
# Edit client/.env.development
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  # Same as STRIPE_PUBLISHABLE_KEY
```

#### Priority 2: Fix JWT_SECRET ⚠️ **URGENT**

**Current Issue**: `JWT_SECRET` contains a command instead of an actual value.

**Fix it now:**
```powershell
# Generate a secure JWT secret
openssl rand -base64 32

# Copy the output and update .env file:
# JWT_SECRET=<paste-generated-value-here>
```

**Or use PowerShell:**
```powershell
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
# Then add to .env: JWT_SECRET=$secret
```

#### Priority 3: Update Frontend Variables

After setting payment provider keys in root `.env`, update `client/.env.development`:
- `VITE_RAZORPAY_KEY_ID` should match `RAZORPAY_KEY_ID`
- `VITE_STRIPE_PUBLISHABLE_KEY` should match `STRIPE_PUBLISHABLE_KEY`

### 📝 Notes

1. **Payment Providers Are Optional**: The app can run without payment provider keys. Payment features will simply be disabled.

2. **Frontend Variables**: Only `VITE_*` variables are accessible in the browser. Never put secrets in frontend variables.

3. **Webhook Secrets**: Required for secure webhook signature verification. Generate these in your payment provider dashboards.

4. **Plan/Price IDs**: Must be created in respective payment provider dashboards first, then added to `.env`.

5. **Development vs Production**: 
   - Use test keys (`rzp_test_`, `sk_test_`, `pk_test_`) for development
   - Use live keys (`rzp_live_`, `sk_live_`, `pk_live_`) for production

### ✅ Next Steps

1. ✅ **Database**: Already configured
2. ✅ **AI Services**: Already configured  
3. ⚠️ **Payment Providers**: Set up RazorPay and/or Stripe if needed
4. ⚠️ **Frontend**: Update placeholder values in `client/.env.development`
5. ✅ **Core Services**: All essential variables are set

### 🔗 Useful Links

- **RazorPay Dashboard**: https://dashboard.razorpay.com/
- **Stripe Dashboard**: https://dashboard.stripe.com/
- **Environment Variables Reference**: See section above
- **Running the App**: See project README

---

## 🔄 Recovery Guide for .env.example

### What Happened

The `.env.example` file may have been overwritten when creating a new template file. The original file may have contained actual database connection values.

### Recovery Options

#### Option 1: Check Your Actual .env File

Your actual `.env` file (which should NOT be modified) may contain the real values. Check it:

```powershell
Get-Content .env | Select-String "DATABASE_URL"
```

#### Option 2: Check Neon Console

Based on database troubleshooting guide, you're using Neon PostgreSQL:
- **Console:** https://console.neon.tech/
- **Host:** `ep-lingering-frost-afktjhej.c-2.us-west-2.aws.neon.tech`
- **Database:** `neondb`

1. Log into Neon Console
2. Go to your project
3. Click "Connection Details"
4. Copy the connection string
5. Update `.env.example` with the actual values

#### Option 3: Check Other Locations

Check if you have the values stored elsewhere:
- Password manager (LastPass, 1Password, etc.)
- Notes/documentation files
- Email/chat history
- Other backup locations

#### Option 4: Reconstruct from Memory

If you remember parts of the connection string:
- Database provider: Neon PostgreSQL
- Host format: `ep-xxx-xxx-xxx.c-2.us-west-2.aws.neon.tech`
- Database name: `neondb` (or similar)
- You'll need: username, password, and exact host

### Restoring .env.example

Once you have your values, update `.env.example` with your actual connection string:

```env
DATABASE_URL=postgresql://username:password@ep-lingering-frost-afktjhej.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
```

### Prevention

To prevent this in the future:
1. **Use `.env` for real values** (already gitignored)
2. **Use `.env.example` for templates only** (safe to commit)
3. **Backup important files** before major changes
4. **Use version control** (git) to track changes

### Current Status

- ✅ `.env` file: **SAFE** (not modified, contains your real values)
- ❌ `.env.example`: **MAY BE OVERWRITTEN** (needs restoration)
- ✅ Backup created: `.env.example.backup` (if exists, contains the template)

### Next Steps

1. Check your `.env` file for the real DATABASE_URL
2. If not found, retrieve from Neon Console
3. Update `.env.example` with your actual values
4. Keep `.env.example` as a template (use `.env` for real values)

---

## 🔐 Secrets Management

### Multi-Platform Secret Management Strategy

#### Tiered Approach

```
┌─────────────────────────────────────────────┐
│  Tier 1: Cloud Secrets Manager             │
│  (AWS Secrets Manager / Azure Key Vault)   │
│  - Production secrets                      │
│  - Shared team secrets                     │
│  - Automatic rotation                      │
└─────────────────────────────────────────────┘
           ↓ (fallback)
┌─────────────────────────────────────────────┐
│  Tier 2: Platform-Native Secrets            │
│  (Replit Secrets, Vercel Env)              │
│  - Development environment                 │
│  - Platform-specific config                │
└─────────────────────────────────────────────┘
           ↓ (fallback)
┌─────────────────────────────────────────────┐
│  Tier 3: Local Development                  │
│  (.env file for Cursor)                    │
│  - Local development only                  │
│  - Never committed to git                  │
└─────────────────────────────────────────────┘
```

### Cloud Secrets Management Services

#### Comparison Matrix

| Service | Provider | Cost Model | Best For | Integration |
|---------|----------|------------|----------|-------------|
| **AWS Secrets Manager** | AWS | $0.40/secret/month + $0.05/10K API calls | AWS-hosted apps | Native AWS SDK |
| **Azure Key Vault** | Microsoft | $0.03/secret/month + API calls | Azure-hosted apps | Azure SDK |
| **Google Secret Manager** | Google Cloud | $0.06/secret/month + API calls | GCP-hosted apps | GCP SDK |
| **HashiCorp Vault** | Self-hosted/Cloud | Free (self-hosted) or $0.10/secret/month | Multi-cloud, enterprise | Universal API |
| **1Password Secrets Automation** | 1Password | $7/user/month | Teams, CI/CD | REST API |
| **Doppler** | Doppler | Free tier available | Multi-platform, developer-friendly | Universal SDK |

#### Cost Comparison (Example: 20 secrets, 100K operations/month)

- **AWS Secrets Manager:** ~$8.50/month
- **Azure Key Vault:** ~$0.66/month ⭐ **Most Cost-Effective**
- **Google Secret Manager:** ~$1.26/month
- **Doppler:** Free tier (3 projects) or $12/user/month

#### Recommendation

- **Small Projects:** Doppler (free tier) or platform-native secrets
- **Medium Projects:** Azure Key Vault (lowest cost)
- **Enterprise:** AWS Secrets Manager or HashiCorp Vault

### Current Setup (MVP)

- **Development (Cursor):** `.env` file (local, gitignored) ✅
- **Development (Replit):** Replit Secrets ✅
- **Production:** Platform environment variables (Vercel/Railway)

### Post-MVP Enhancement

- **Production:** Cloud Secrets Manager (AWS/Azure/GCP)
- **Staging:** Cloud Secrets Manager (separate environment)
- **Development:** Fallback to `.env` / Replit Secrets

### Security Best Practices

#### Do's ✅

1. **Use IAM Roles** - Prefer IAM roles over access keys when possible
2. **Enable Audit Logging** - Track all secret access
3. **Rotate Secrets Regularly** - Especially JWT_SECRET, SESSION_SECRET
4. **Use Least Privilege** - Grant minimum required permissions
5. **Encrypt at Rest & Transit** - Ensure encryption in all states
6. **Monitor Access Patterns** - Set up alerts for unusual access
7. **Separate Environments** - Different secrets for dev/staging/prod
8. **Use Secret Versioning** - Enable versioning for rollback capability

#### Don'ts ❌

1. **Never Commit Secrets** - `.env` files must be gitignored ✅
2. **Never Share in Chat/Email** - Use secure channels only
3. **Never Hardcode Secrets** - Always use environment variables
4. **Never Use Production Secrets in Dev** - Separate environments
5. **Never Store in `.replit` File** - Only defaults, not secrets
6. **Never Log Secrets** - Mask secrets in logs
7. **Never Use Default Secrets** - Change all default values

### File Structure

```
project-root/
├── .env                    # Local dev (gitignored) ✅
├── .env.example           # Template (committed) ✅
├── .env.backup.encrypted  # Encrypted backup (gitignored)
├── .env.replit            # Replit-specific (gitignored)
│
├── scripts/
│   ├── sync-secrets.sh    # Sync secrets across platforms
│   └── backup-secrets.sh  # Backup encryption script
│
├── api/src/config/
│   ├── secrets-manager.service.ts    # AWS implementation
│   ├── azure-keyvault.service.ts     # Azure implementation
│   ├── doppler.service.ts            # Doppler implementation
│   └── unified-secrets.service.ts   # Unified loader
│
└── docs/
    └── setup/COMPLETE_SETUP_GUIDE.md  # This document
```

### Secret Categories

#### Critical Secrets (Rotate Quarterly)
- `JWT_SECRET`
- `SESSION_SECRET`
- Database passwords
- Payment provider secrets

#### API Keys (Rotate Annually)
- `OPENAI_API_KEY`
- `IDEOGRAM_API_KEY`
- `GOOGLE_API_KEY`
- Payment provider keys

#### Configuration (Rotate As Needed)
- `DATABASE_URL`
- `BASE_URL`
- `CLIENT_URL`
- Plan IDs

### Implementation Checklist

#### Phase 1: Setup (Post-MVP)
- [ ] Choose cloud provider (AWS/Azure/GCP)
- [ ] Set up secrets manager account
- [ ] Create production secrets vault
- [ ] Configure IAM roles/permissions
- [ ] Install required SDKs

#### Phase 2: Implementation (Post-MVP)
- [ ] Create unified secrets loader service
- [ ] Implement cloud provider integration
- [ ] Add fallback to `.env` for local dev
- [ ] Add caching mechanism
- [ ] Add error handling and logging

#### Phase 3: Migration (Post-MVP)
- [ ] Migrate production secrets to cloud vault
- [ ] Update application configuration
- [ ] Test secret retrieval in all environments
- [ ] Set up monitoring/alerting
- [ ] Document secret locations

---

## ⚡ Quick Start Prompts for AI-Assisted IDEs

> **Copy-paste these prompts directly into Lovable.dev or Replit AI**

### 🎯 Project Setup (First Prompt)

```
Create a React + TypeScript + Tailwind CSS project for an infographic editor.

Project structure:
- React 18 + TypeScript
- Tailwind CSS v4
- React Router v6
- Zustand for state management
- Radix UI components (shadcn/ui style)
- Vite as build tool

Dependencies to install:
- react, react-dom, react-router-dom
- typescript, @types/react, @types/react-dom
- tailwindcss, autoprefixer, postcss
- @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-select, @radix-ui/react-tabs, @radix-ui/react-popover, @radix-ui/react-slider, @radix-ui/react-toggle, @radix-ui/react-tooltip
- zustand
- react-rnd
- html2canvas
- lucide-react
- sonner
- motion
- @stripe/stripe-js
- @supabase/supabase-js
- react-hook-form
- zod

Create package.json, tsconfig.json, tailwind.config.js, and vite.config.ts.
Set up folder structure: src/components, src/lib, src/hooks, src/types, src/styles.
```

### 💳 Stripe Payment Setup

#### Prompt 1: Stripe Client
```
Create a Stripe client utility:

File: src/lib/stripe.ts

Initialize Stripe with publishable key from environment variable VITE_STRIPE_PUBLISHABLE_KEY.

Functions needed:
1. loadStripe() - Initialize Stripe
2. createCheckoutSession(priceId: string) - Create checkout session for Pro plan ($19/month)
3. redirectToCheckout(sessionId: string) - Redirect to Stripe Checkout
4. getCustomerPortalUrl(customerId: string) - Get portal URL for subscription management

Handle errors gracefully. Add TypeScript types.
```

#### Prompt 2: Pricing Modal
```
Create a pricing modal component:

File: src/components/payment/PricingModal.tsx

Show Free vs Pro plan comparison:
- Free: $0/month, 5 exports/month, 10 saved designs, basic features
- Pro: $19/month, unlimited exports, unlimited designs, AI features, priority support

Features:
- Clean pricing table with feature comparison
- "Upgrade to Pro" button that opens Stripe Checkout
- Handle success/cancel URLs
- Show loading state during checkout
- Use Radix UI Dialog component
- Match design system: neutral colors, Inter font, clean layout
```

#### Prompt 3: Usage Tracking
```
Create usage tracking system:

File: src/lib/usage.ts

Functions:
- getUserPlan(): 'free' | 'pro'
- getExportCount(): number (exports this month)
- incrementExportCount(): void
- canExport(): boolean (free: max 5/month)
- getDesignCount(): number
- canSaveDesign(): boolean (free: max 10 designs)
- resetMonthlyUsage(): void (reset on new month)

Storage: Use LocalStorage for now.
Structure: { plan: 'free'|'pro', exportsThisMonth: number, periodStart: Date, designsCount: number }

Add TypeScript types. Handle edge cases.
```

### 🗄️ Supabase Backend Setup

#### Prompt 1: Supabase Client
```
Create Supabase client:

File: src/lib/supabase.ts

Initialize Supabase client with:
- VITE_SUPABASE_URL (environment variable)
- VITE_SUPABASE_ANON_KEY (environment variable)

Export client instance and helper functions:
- getCurrentUser()
- signIn(email, password)
- signUp(email, password)
- signOut()
- getSession()

Add TypeScript types. Handle errors.
```

#### Prompt 2: Database Schema
```
Create SQL migration for Supabase:

Tables needed:

1. users (extends auth.users)
   - id uuid primary key
   - email text
   - plan text ('free'|'pro')
   - stripe_customer_id text nullable
   - stripe_subscription_id text nullable
   - created_at timestamp
   - updated_at timestamp

2. designs
   - id uuid primary key
   - user_id uuid references users(id)
   - name text
   - thumbnail text
   - canvas_data jsonb
   - category text nullable
   - tags text[] nullable
   - is_template boolean default false
   - created_at timestamp
   - updated_at timestamp

3. usage_tracking
   - id uuid primary key
   - user_id uuid references users(id)
   - period_start date
   - exports_count integer default 0
   - designs_count integer default 0
   - created_at timestamp
   - updated_at timestamp

Add indexes, RLS policies, and triggers for updated_at.
```

### 🎨 Canvas System

#### Prompt 1: Canvas Store
```
Create Zustand store for canvas:

File: src/hooks/useCanvasStore.ts

State:
- elements: CanvasElement[]
- selectedElementIds: string[]
- canvasWidth: 1200
- canvasHeight: 800
- backgroundColor: '#FFFFFF'
- zoom: 1
- canvasPanX: 0
- canvasPanY: 0
- activeTool: 'select' | 'text' | 'image' | 'rectangle' | 'circle' | 'hand'
- history: { past: CanvasState[], future: CanvasState[] }

Actions:
- addElement(type: 'text'|'shape'|'image', props: Partial<CanvasElement>): string
- updateElement(id: string, updates: Partial<CanvasElement>): void
- deleteElement(id: string): void
- selectElement(id: string, multiSelect?: boolean): void
- clearSelection(): void
- setBackgroundColor(color: string): void
- setZoom(level: number): void
- setPan(x: number, y: number): void
- undo(): void
- redo(): void
- loadCanvas(data: CanvasData): void
- captureCanvasData(): CanvasData

Types:
- CanvasElement: { id: string, type: 'text'|'shape'|'image', x: number, y: number, width: number, height: number, ... }
- TextElement: extends CanvasElement with text properties
- ShapeElement: extends CanvasElement with shape properties
- ImageElement: extends CanvasElement with image properties

Add TypeScript types for everything.
```

### 📤 Export System

```
Create export functionality:

File: src/lib/canvasExport.ts

Function: exportToPNG(options?: ExportOptions): Promise<void>

Features:
1. Check usage limits before export (use lib/usage.ts)
2. If limit reached, show PricingModal
3. If allowed, proceed:
   - Deselect all elements
   - Capture canvas using html2canvas or native Canvas API
   - Apply options: resolution (1x, 2x, 3x), format (PNG/JPG), background
   - Convert to blob
   - Trigger download
   - Increment export count
   - Show success toast

Options:
- resolution: 1 | 2 | 3 (default: 2)
- format: 'png' | 'jpg' (default: 'png')
- background: 'white' | 'transparent' (default: 'white')
- filename?: string (default: 'design-{timestamp}')

Handle errors. Show loading state. Use existing toast system (sonner).
```

### 🚀 Deployment Prompt

```
Set up deployment configuration:

For Vercel:
1. Create vercel.json:
   - Build command: npm run build
   - Output directory: dist
   - Framework: vite

2. Environment variables needed:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - VITE_STRIPE_PUBLISHABLE_KEY
   - VITE_OPENAI_API_KEY (optional)

3. Add redirect rules for SPA:
   - All routes → /index.html

For Netlify:
1. Create netlify.toml with same settings
2. Add environment variables in dashboard

Create .env.example file with all variables (no values).
Add .env.local to .gitignore.
```

### 📝 Quick Copy Checklist

Use these prompts in order:

1. ✅ Project Setup
2. ✅ Stripe Client
3. ✅ Pricing Modal
4. ✅ Usage Tracking
5. ✅ Supabase Client
6. ✅ Database Schema
7. ✅ Canvas Store
8. ✅ Canvas Elements
9. ✅ Main Canvas Component
10. ✅ Toolbar Components
11. ✅ Save/Load System
12. ✅ Export System
13. ✅ Testing
14. ✅ Deployment

**Tip:** Copy each prompt one at a time, let AI complete it, then move to the next. Don't rush - let AI do the work! 🚀

---

## 💳 Payment Integration Setup

### Multi-Provider Payment Integration - Copy-Paste Setup Guide

This section provides a complete step-by-step guide to copy the payment integration module into your project.

### What You Get

- **Multi-provider support**: RazorPay (India/INR) + Stripe (International/USD-EUR)
- **Feature flag control**: Enable/disable Stripe with a single environment variable
- **Currency-based routing**: Automatic provider selection based on customer location
- **Webhook handling**: Pre-built webhook processors for both providers
- **In-memory storage**: Ready-to-use fallback storage when no database exists
- **Fully documented**: Regional strategy, activation guides, and API reference

### Files to Copy

#### Core Payment Module
```
server/payments/
├── interfaces/
│   └── payment-provider.interface.ts
├── providers/
│   ├── payment-provider.factory.ts
│   ├── razorpay.provider.ts
│   └── stripe.provider.ts
├── services/
│   └── subscription.service.ts
└── schemas/
    └── shared/schema.ts (payment-related exports)
```

#### Routes & API Integration
```
server/
├── routes.ts (payment endpoints + webhooks)
├── index.ts (raw body parsing for webhooks)
└── storage.ts (interface definitions)
```

#### Frontend Components
```
client/src/
├── pages/pricing-page.tsx (currency toggle + payment UI)
├── lib/queryClient.ts (API request helper)
└── index.html (Stripe.js + RazorPay script)
```

### Step-by-Step Setup

#### 1. Install Dependencies

```bash
npm install razorpay stripe
```

#### 2. Copy Payment Files

Copy the entire `server/payments/` directory to your project's `server/` directory.

#### 3. Update Routes

Add payment routes to your routes.ts (already included if you copied from this project):

```typescript
import { subscriptionService } from "./payments/services/subscription.service";
import { paymentProviderFactory } from "./payments/providers/payment-provider.factory";

// Payment routes
app.get('/api/payments/provider-info', ...)
app.post('/api/payments/create-subscription', ...)
app.get('/api/payments/subscription', ...)
app.post('/api/payments/update-plan', ...)
app.post('/api/payments/cancel', ...)
app.get('/api/payments/history', ...)

// Webhook handler
app.post('/api/webhooks/:provider', ...)
```

#### 4. Configure Environment Variables

##### For RazorPay (Always Required)
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx

# Plan IDs (optional - defaults provided)
RAZORPAY_PLAN_SOLO=plan_xxxxx
RAZORPAY_PLAN_TEAM=plan_xxxxx
RAZORPAY_PLAN_BROKERAGE=plan_xxxxx
RAZORPAY_PLAN_API_STARTER=plan_xxxxx
RAZORPAY_PLAN_API_GROWTH=plan_xxxxx
```

##### For Stripe (Optional - Enable When Ready)
```env
# Feature flag
STRIPE_ENABLED=false  # Change to 'true' when Stripe is configured

# API Keys (only needed when STRIPE_ENABLED=true)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Price IDs (optional - defaults provided)
STRIPE_PLAN_SOLO=price_xxxxx
STRIPE_PLAN_TEAM=price_xxxxx
STRIPE_PLAN_BROKERAGE=price_xxxxx
STRIPE_PLAN_API_STARTER=price_xxxxx
STRIPE_PLAN_API_GROWTH=price_xxxxx
```

#### 5. Update Frontend Components

Replace your pricing page with `client/src/pages/pricing-page.tsx` which includes:
- Currency toggle (INR/USD)
- Provider detection
- Automatic routing to correct checkout

#### 6. Configure Webhooks

##### RazorPay Webhooks
In RazorPay Dashboard → Settings → Webhooks:
```
URL: https://your-app.replit.app/api/webhooks/razorpay
Events:
  ✓ customer.subscription.created
  ✓ customer.subscription.updated
  ✓ customer.subscription.deleted
  ✓ invoice.paid
  ✓ invoice.payment_failed
```

##### Stripe Webhooks (When Enabled)
In Stripe Dashboard → Developers → Webhooks:
```
URL: https://your-app.replit.app/api/webhooks/stripe
Events:
  ✓ customer.subscription.created
  ✓ customer.subscription.updated
  ✓ customer.subscription.deleted
  ✓ invoice.payment_succeeded
  ✓ invoice.payment_failed
```

#### 7. Test Locally

```bash
npm run dev
```

1. Navigate to `/pricing`
2. Toggle between INR and USD
3. Verify provider badge changes
4. Test payment flow:
   - INR → RazorPay checkout
   - USD → Stripe checkout (if enabled)

### Regional Payment Strategy

| Location | Currency | Provider (STRIPE_ENABLED=false) | Provider (STRIPE_ENABLED=true) |
|----------|----------|----------------------------------|--------------------------------|
| India    | INR      | RazorPay                         | RazorPay                       |
| US       | USD      | RazorPay (fallback)              | **Stripe**                     |
| Europe   | EUR      | RazorPay (fallback)              | **Stripe**                     |
| Other    | Any      | RazorPay                         | RazorPay                       |

**Why?**
- **RazorPay for India**: Best local payment methods, lowest fees
- **Stripe for International**: Better card support, local payment methods in US/EU
- **Stripe is invite-only in India (2025)**: Use RazorPay as primary until access granted

### Troubleshooting

#### "STRIPE_ENABLED not recognized"
Make sure you've set the environment variable:
```env
STRIPE_ENABLED=false  # or true
```

#### "Stripe checkout returning error"
Check that:
1. STRIPE_SECRET_KEY is set
2. Stripe prices exist in your dashboard
3. Webhook signature secret is configured

#### "RazorPay shortUrl is undefined"
Ensure RazorPay plan IDs are configured and valid:
```env
RAZORPAY_PLAN_SOLO=plan_xxxxx
```

#### Webhook signature verification failing
1. Verify webhook secrets are set correctly
2. For Stripe: Use raw body parsing (already configured in index.ts)
3. For RazorPay: Check webhook secret in dashboard matches environment

### Production Checklist

- [ ] Use `STRIPE_ENABLED=false` for development/testing
- [ ] Set all required environment variables
- [ ] Configure webhook URLs in provider dashboards
- [ ] Test both RazorPay and Stripe flows
- [ ] Verify webhook signature verification works
- [ ] Use HTTPS for production webhooks
- [ ] Monitor webhook logs for errors
- [ ] Set up payment reconciliation process
- [ ] Configure monitoring/alerts for failed payments

---

## 🔄 Hybrid Cursor + Replit Setup

This project is configured to work seamlessly in both **Cursor (local development)** and **Replit (cloud deployment)**.

### Architecture Overview

```
┌──────────────────┐         ┌──────────────────┐
│   Cursor IDE     │         │     Replit       │
│   (Windows Dev)  │  ⟷     │  (Linux Deploy)  │
│                  │         │                  │
│  - Edit code     │         │  - Test/Deploy   │
│  - Local testing │         │  - PostgreSQL    │
│  - Git commits   │         │  - Production    │
└──────────────────┘         └──────────────────┘
```

### Key Configuration Files

| File | Purpose | Platform |
|------|---------|----------|
| `.replit` | Replit runner config | Replit only |
| `replit.nix` | Replit dependencies | Replit only |
| `package.json` | Cross-platform scripts | Both |
| `server/index.ts` | Unified server (Windows/Linux) | Both |
| `api/src/main.ts` | NestJS API server | Both |

### Running in Cursor (Windows)

#### Quick Start
```bash
npm run dev
```

This will:
- ✅ Start Express server on port 5000 (frontend + proxy)
- ✅ Auto-start NestJS API on port 3001
- ✅ Launch Vite dev server with HMR
- ✅ Open browser to http://localhost:5000

#### Manual Steps (if needed)
```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npm run prisma:generate

# 3. Start development server
npm run dev
```

### Running in Replit

#### Automatic Startup
Replit will automatically:
1. Install dependencies via `npm install`
2. Generate Prisma client
3. Start both servers via `npm run dev`
4. Expose port 5000 publicly

#### Environment Variables (Replit Secrets)
Add these in Replit Secrets (🔒 icon in left sidebar):
```
DATABASE_URL        → From Replit PostgreSQL
OPENAI_API_KEY      → Your OpenAI API key
IDEOGRAM_API_KEY    → Your Ideogram API key
JWT_SECRET          → Random secure string
```

### Cross-Platform Compatibility

#### Server Spawn Logic
The server automatically detects the platform:

```typescript
// server/index.ts
const isWindows = process.platform === 'win32';
const command = isWindows ? 'npx.cmd' : 'npx';

const nestProcess = spawn(command, ['tsx', 'src/main.ts'], {
  cwd: path.join(__dirname, '..', 'api'),
  shell: true  // Required for Windows
});
```

#### Database Connection
Graceful fallback when database is unavailable:

```typescript
// api/src/common/services/prisma.service.ts
async onModuleInit() {
  try {
    await this.$connect();
    this.isConnected = true;
    this.logger.log('✅ Database connected successfully');
  } catch (error) {
    this.isConnected = false;
    this.logger.warn('⚠️ Database connection failed - running in limited mode');
    // App continues without database
  }
}
```

### NPM Scripts (Cross-Platform)

| Script | Purpose | Works In |
|--------|---------|----------|
| `npm run dev` | Start dev servers | Both |
| `npm run build` | Build for production | Both |
| `npm start` | Start production | Both |
| `npm run check` | TypeScript check | Both |
| `npm run prisma:generate` | Generate Prisma client | Both |
| `npm run db:push` | Push DB schema | Both |

### Development Workflow

#### 1. Local Development (Cursor)
```bash
# Edit code in Cursor
git add .
git commit -m "feat: add new feature"
git push origin main
```

#### 2. Test in Replit
- Push changes to GitHub
- Replit auto-syncs via Git
- Click "Run" to test
- Check live preview

#### 3. Deploy
- Replit automatically deploys on run
- Public URL: `https://your-repl.repl.co`

### Troubleshooting

#### Issue: "tsx not found" in Cursor
**Solution**: Use `npx tsx` instead of `tsx`
```bash
# Server automatically handles this via:
const command = isWindows ? 'npx.cmd' : 'npx';
```

#### Issue: Port 5000 already in use (Windows)
**Solution**: Kill the process
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

#### Issue: Database connection failed
**Solution**: App runs without database
- Auth and infographic generation will be limited
- Some features require database setup
- Check `DATABASE_URL` in environment

#### Issue: Prisma client not generated
**Solution**: Run generation command
```bash
npm run prisma:generate
```

### Security Best Practices

#### Local Development (Cursor)
- ✅ Use `.env` file (gitignored)
- ✅ Never commit API keys
- ✅ Use dummy values for testing

#### Production (Replit)
- ✅ Use Replit Secrets for sensitive data
- ✅ Rotate JWT_SECRET regularly
- ✅ Enable rate limiting (already configured)
- ✅ Use environment-specific DATABASE_URL

### Platform Comparison

| Feature | Cursor (Local) | Replit (Cloud) |
|---------|----------------|----------------|
| **OS** | Windows 10/11 | Linux (NixOS) |
| **Node.js** | v20+ | v20 (managed) |
| **Database** | Optional | PostgreSQL 15 |
| **Hot Reload** | Yes (Vite HMR) | Yes |
| **Debugging** | Full VSCode tools | Console logs |
| **Speed** | Faster (local) | Network latency |
| **Access** | Localhost only | Public URL |
| **Cost** | Free | Free tier available |

### Recommended Workflow

1. **Develop in Cursor**
   - Fast iteration with local tools
   - Full debugging capabilities
   - Offline development

2. **Test in Replit**
   - Verify Linux compatibility
   - Test with real PostgreSQL
   - Share preview with team

3. **Deploy from Replit**
   - One-click deployment
   - Automatic HTTPS
   - Built-in monitoring

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5000 | React UI |
| API | http://localhost:3001 | NestJS REST API |
| API Docs | http://localhost:3001/api/docs | Swagger documentation |

### Environment Variables

#### Required for Full Functionality
```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-proj-...
IDEOGRAM_API_KEY=...
JWT_SECRET=your-secure-secret
```

#### Cursor (Local)
- Create `.env` file in project root
- Add variables listed above

#### Replit (Cloud)
- Add to Replit Secrets (🔒 icon)
- DATABASE_URL provided automatically
- Never commit secrets to Git

### Next Steps

1. ✅ **Development in Cursor**
   - Fast local development
   - Full debugging tools
   - Instant hot reload

2. ✅ **Testing in Replit**
   - Test Linux compatibility
   - Verify with real PostgreSQL
   - Share preview URLs

3. ✅ **Deploy from Replit**
   - One-click deployment
   - Automatic HTTPS
   - Production-ready

---

## 📚 Related Documentation

- **[RazorPay Setup Guide](../payments/RAZORPAY_SETUP_GUIDE.md)** - Complete RazorPay account setup
- **[RazorPay Webhook Setup Guide](../payments/RAZORPAY_WEBHOOK_SETUP_GUIDE.md)** - Webhook configuration
- **[Payment Integration Guide](../payments/PAYMENT_INTEGRATION.md)** - Full API reference and architecture

---

**Last Updated:** January 2025  
**Status:** MVP Ready
