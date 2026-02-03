# Multi-Provider Payment Integration - Copy-Paste Setup Guide

This document provides a complete step-by-step guide to copy this payment integration module into your project.

## What You Get

- **Multi-provider support**: RazorPay (India/INR) + Stripe (International/USD-EUR)
- **Feature flag control**: Enable/disable Stripe with a single environment variable
- **Currency-based routing**: Automatic provider selection based on customer location
- **Webhook handling**: Pre-built webhook processors for both providers
- **In-memory storage**: Ready-to-use fallback storage when no database exists
- **Fully documented**: Regional strategy, activation guides, and API reference

## Files to Copy

### Core Payment Module
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

### Routes & API Integration
```
server/
├── routes.ts (payment endpoints + webhooks)
├── index.ts (raw body parsing for webhooks)
└── storage.ts (interface definitions)
```

### Frontend Components
```
client/src/
├── pages/pricing-page.tsx (currency toggle + payment UI)
├── lib/queryClient.ts (API request helper)
└── index.html (Stripe.js + RazorPay script)
```

### Documentation
```
PAYMENT_INTEGRATION_README.md
COPY_PASTE_SETUP.md (this file)
```

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install razorpay stripe
```

### 2. Copy Payment Files

Copy the entire `server/payments/` directory to your project's `server/` directory.

### 3. Update Routes

Add this to your routes.ts (already included if you copied from this project):

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

### 4. Configure Environment Variables

#### For RazorPay (Always Required)
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

#### For Stripe (Optional - Enable When Ready)
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

### 5. Update Frontend Components

Replace your pricing page with `client/src/pages/pricing-page.tsx` which includes:
- Currency toggle (INR/USD)
- Provider detection
- Automatic routing to correct checkout

### 6. Configure Webhooks

#### RazorPay Webhooks
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

#### Stripe Webhooks (When Enabled)
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

### 7. Test Locally

```bash
npm run dev
```

1. Navigate to `/pricing`
2. Toggle between INR and USD
3. Verify provider badge changes
4. Test payment flow:
   - INR → RazorPay checkout
   - USD → Stripe checkout (if enabled)

## API Endpoints

### Provider Info
```
GET /api/payments/provider-info?currency=USD&region=US
→ { provider: "STRIPE", stripeEnabled: true, stripePublishableKey: "pk_..." }
```

### Create Subscription
```
POST /api/payments/create-subscription
{
  "planTier": "SOLO",
  "currency": "INR",
  "region": "IN"
}
→ { 
  provider: "RAZORPAY", 
  shortUrl: "https://rzp.io/i/...",
  subscription: {...}
}
```

### With Stripe
```
POST /api/payments/create-subscription
{
  "planTier": "TEAM",
  "currency": "USD"
}
→ { 
  provider: "STRIPE", 
  checkoutUrl: "https://checkout.stripe.com/...",
  subscription: {...}
}
```

## Regional Payment Strategy

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

## Troubleshooting

### "STRIPE_ENABLED not recognized"
Make sure you've set the environment variable:
```env
STRIPE_ENABLED=false  # or true
```

### "Stripe checkout returning error"
Check that:
1. STRIPE_SECRET_KEY is set
2. Stripe prices exist in your dashboard
3. Webhook signature secret is configured

### "RazorPay shortUrl is undefined"
Ensure RazorPay plan IDs are configured and valid:
```env
RAZORPAY_PLAN_SOLO=plan_xxxxx
```

### Webhook signature verification failing
1. Verify webhook secrets are set correctly
2. For Stripe: Use raw body parsing (already configured in index.ts)
3. For RazorPay: Check webhook secret in dashboard matches environment

## Customization

### Add a New Provider
1. Create `server/payments/providers/newprovider.provider.ts`
2. Implement `IPaymentProvider` interface
3. Update `PaymentProviderFactory.getProvider()`
4. Add to webhook event mapping in routes.ts

### Add New Plan Tier
1. Add to `PLAN_CONFIG` in `shared/schema.ts`
2. Create provider plan IDs
3. Update environment variable names
4. Update pricing page UI

### Use with Database
Replace `PaymentStorage` in `subscription.service.ts` with your database implementation.

## Production Checklist

- [ ] Use `STRIPE_ENABLED=false` for development/testing
- [ ] Set all required environment variables
- [ ] Configure webhook URLs in provider dashboards
- [ ] Test both RazorPay and Stripe flows
- [ ] Verify webhook signature verification works
- [ ] Use HTTPS for production webhooks
- [ ] Monitor webhook logs for errors
- [ ] Set up payment reconciliation process
- [ ] Configure monitoring/alerts for failed payments

## Support

For detailed documentation, see:
- `PAYMENT_INTEGRATION_README.md` - Full API reference and architecture
- Stripe documentation: https://stripe.com/docs
- RazorPay documentation: https://razorpay.com/docs
