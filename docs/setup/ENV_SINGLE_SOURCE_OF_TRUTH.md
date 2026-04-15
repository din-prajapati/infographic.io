# .env as Single Source of Truth

This guide explains how to use your `.env` file as the single source of truth across Replit and other AI IDEs like Cursor.

---

## Overview

The project uses environment variables for configuration. To avoid duplication and sync issues:

1. **`.env` file** - Your local source of truth (not committed to git)
2. **Replit Secrets** - Where sensitive values are stored for deployment
3. **AI IDEs** - Read from `.env` automatically

---

## Setup Instructions

### Step 1: Create Your .env File

```bash
cp .env.example .env
```

Edit `.env` with your actual values.

### Step 2: Sync to Replit Secrets

For secrets (API keys, passwords), add them to Replit:

1. Click the **lock icon** (Secrets) in the left sidebar
2. Add each secret variable:

| Variable | Type | Notes |
|----------|------|-------|
| `OPENAI_API_KEY` | Secret | Required for AI Chat |
| `IDEOGRAM_API_KEY` | Secret | Required for image generation |
| `RAZORPAY_KEY_ID` | Secret | RazorPay public key |
| `RAZORPAY_KEY_SECRET` | Secret | RazorPay private key |
| `RAZORPAY_WEBHOOK_SECRET` | Secret | For webhook verification |
| `JWT_SECRET` | Secret | For auth tokens |
| `SESSION_SECRET` | Secret | For session management |

### Step 3: Set Non-Secret Environment Variables

For non-sensitive config, you can add to Replit's environment:

Option A: Use the Secrets tab (works for all variables)

Option B: Add to `.replit` file:
```toml
[env]
NODE_ENV = "development"
PORT = "5000"
API_PORT = "3001"
```

---

## For Cursor / Other AI IDEs

Your `.env` file works automatically:

1. Keep `.env` in project root
2. It's already in `.gitignore`
3. AI tools will read from it

---

## Variable Categories

### Database (Auto-set by Replit)
- `DATABASE_URL` - Automatically set when you create a Replit DB
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

### AI Services (Must Add)
- `OPENAI_API_KEY` - Get from https://platform.openai.com/api-keys
- `IDEOGRAM_API_KEY` - Get from https://ideogram.ai/api

### Payment - RazorPay (Must Add)
- `RAZORPAY_KEY_ID` - From RazorPay Dashboard > Settings > API Keys
- `RAZORPAY_KEY_SECRET` - From RazorPay Dashboard
- `RAZORPAY_WEBHOOK_SECRET` - After setting up webhook
- `RAZORPAY_PLAN_*` - Plan IDs from RazorPay Products > Plans

### Payment - Stripe (Optional)
- `STRIPE_SECRET_KEY` - From Stripe Dashboard
- `STRIPE_PUBLISHABLE_KEY` - From Stripe Dashboard
- `STRIPE_WEBHOOK_SECRET` - From Stripe Webhooks

### Frontend Variables
For client-side variables, prefix with `VITE_`:
- `VITE_RAZORPAY_KEY_ID` - Add to `client/.env`

---

## Quick Commands

### View current environment:
```bash
env | grep -E "(OPENAI|RAZORPAY|STRIPE|DATABASE)" | sort
```

### Export .env to current shell:
```bash
export $(grep -v '^#' .env | xargs)
```

### Run the sync script:
```bash
./scripts/sync-env.sh
```

---

## Best Practices

1. **Never commit `.env`** - Already in `.gitignore`
2. **Use `.env.example`** - Template without real values
3. **Match Replit Secrets to .env** - Keep them in sync manually
4. **Use VITE_ prefix** - For any client-side variables
5. **Separate dev/prod** - Use `.env.development.example` and `.env.production.example` as templates
