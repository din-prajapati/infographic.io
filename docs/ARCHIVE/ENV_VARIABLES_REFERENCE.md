# Environment Variables Reference

This document lists all environment variables used in the codebase and their purposes.

## Summary

**Total Variables Found:** 30+
- **Required:** 1 (DATABASE_URL - but app can run without it)
- **Optional:** 29+

## Environment Variables by Category

### 🔴 Database Configuration

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `DATABASE_URL` | Yes* | None | `server/db.ts`, `server/index.ts` | PostgreSQL connection string. App throws error if not set, but can be bypassed for basic features. |

*Required for database features, but app can run without it for basic functionality.

### 🟢 Server Configuration

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `PORT` | No | `5000` | `server/index.ts` | Express server port (serves both API and frontend) |
| `API_PORT` | No | `3001` | `api/src/main.ts`, `server/index.ts` | NestJS API server port |
| `BASE_URL` | No | `http://localhost:5000` | `server/routes.ts`, `server/payments/services/subscription.service.ts` | Base URL for webhooks and redirects |

### 🔐 Authentication & Security

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `JWT_SECRET` | No | `'infographic-jwt-secret'` | `api/src/modules/auth/strategies/jwt.strategy.ts`, `api/src/modules/auth/auth.module.ts`, `server/index.ts` | JWT secret key for token signing. **Should be changed in production.** |

### 🤖 AI Services

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `OPENAI_API_KEY` | No | None | `api/src/modules/ai-generation/services/openai.service.ts`, `server/index.ts` | OpenAI API key for AI features. App runs in demo mode without it. |
| `IDEOGRAM_API_KEY` | No | `''` | `api/src/modules/ai-generation/services/ideogram.service.ts`, `server/index.ts` | Ideogram API key for image generation |
| `DEMO_MODE` | No | `'false'` | `api/src/modules/ai-generation/services/infographic.processor.ts`, `api/src/modules/ai-generation/services/ai-orchestrator.service.ts`, `server/index.ts` | Demo mode flag (`'true'` or `'false'`) |

### 💳 RazorPay Configuration (India)

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

### 🌍 Stripe Configuration (International)

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

### 🎨 Frontend Variables (VITE_*)

These variables are exposed to the browser. Only use public keys here.

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `VITE_RAZORPAY_KEY_ID` | No | None | `client/src/pages/PricingPage.tsx` | RazorPay public key for frontend (safe to expose) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | No | None | Referenced in docs | Stripe publishable key for frontend (safe to expose) |

### 🔧 Optional Payment Providers

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `PADDLE_API_KEY` | No | None | `server/payments/providers/payment-provider.factory.ts` | Paddle API key |
| `PADDLE_WEBHOOK_SECRET` | No | None | `server/routes.ts` | Paddle webhook secret |
| `PAYPAL_CLIENT_ID` | No | None | `server/payments/providers/payment-provider.factory.ts` | PayPal client ID |
| `PAYPAL_CLIENT_SECRET` | No | None | `server/payments/providers/payment-provider.factory.ts` | PayPal client secret |

## Code Locations

### Backend (Node.js/Express)
- `server/index.ts` - Server startup, NestJS process spawning
- `server/db.ts` - Database connection
- `server/routes.ts` - Payment routes, webhook handling
- `server/payments/providers/razorpay.provider.ts` - RazorPay integration
- `server/payments/providers/stripe.provider.ts` - Stripe integration
- `server/payments/providers/payment-provider.factory.ts` - Payment provider factory
- `server/payments/services/subscription.service.ts` - Subscription service

### API (NestJS)
- `api/src/main.ts` - API server startup
- `api/src/modules/auth/strategies/jwt.strategy.ts` - JWT authentication
- `api/src/modules/auth/auth.module.ts` - Auth module configuration
- `api/src/modules/ai-generation/services/openai.service.ts` - OpenAI service
- `api/src/modules/ai-generation/services/ideogram.service.ts` - Ideogram service
- `api/src/modules/ai-generation/services/infographic.processor.ts` - Infographic processor
- `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` - AI orchestrator

### Frontend (React/Vite)
- `client/src/pages/PricingPage.tsx` - Pricing page with RazorPay integration

## Verification Checklist

### ✅ Variables Found in Code
- [x] DATABASE_URL
- [x] PORT
- [x] API_PORT
- [x] BASE_URL
- [x] JWT_SECRET
- [x] OPENAI_API_KEY
- [x] IDEOGRAM_API_KEY
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
- [x] PADDLE_API_KEY
- [x] PADDLE_WEBHOOK_SECRET
- [x] PAYPAL_CLIENT_ID
- [x] PAYPAL_CLIENT_SECRET

### ⚠️ Variables Referenced But Not Found
- None found

### 📝 Recommendations

1. **Create `.env.example`** with all variables documented above
2. **Add validation** for required variables on startup
3. **Document defaults** in code comments
4. **Add type safety** for environment variables (e.g., using zod)
5. **Separate** frontend and backend environment variables clearly
6. **Add** environment variable validation in `server/index.ts` startup

## Example .env File Structure

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/infographic_db

# Server
PORT=5000
API_PORT=3001
BASE_URL=http://localhost:5000

# Auth
JWT_SECRET=your-secret-key-change-in-production

# AI Services
OPENAI_API_KEY=sk-your-key
IDEOGRAM_API_KEY=your-key
DEMO_MODE=false

# RazorPay
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
RAZORPAY_PLAN_SOLO=plan_xxx
RAZORPAY_PLAN_TEAM=plan_xxx
RAZORPAY_PLAN_BROKERAGE=plan_xxx
RAZORPAY_PLAN_API_STARTER=plan_xxx
RAZORPAY_PLAN_API_GROWTH=plan_xxx

# Stripe
STRIPE_ENABLED=false
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PLAN_SOLO=price_xxx
STRIPE_PLAN_TEAM=price_xxx
STRIPE_PLAN_BROKERAGE=price_xxx
STRIPE_PLAN_API_STARTER=price_xxx
STRIPE_PLAN_API_GROWTH=price_xxx

# Frontend
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

## Notes

1. **Security**: Never commit `.env` files to version control
2. **Defaults**: Most variables have defaults or the app handles missing values gracefully
3. **Frontend Variables**: Only `VITE_*` variables are accessible in browser code
4. **Payment Providers**: Multiple providers supported, but only RazorPay and Stripe are fully implemented
5. **Plan IDs**: Must be created in respective payment provider dashboards first
6. **Webhook Secrets**: Required for secure webhook signature verification

