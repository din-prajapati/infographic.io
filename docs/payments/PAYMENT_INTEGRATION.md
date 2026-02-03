# Payment Integration Guide

A comprehensive guide for multi-provider payment integration supporting RazorPay (India/INR) and Stripe (International/USD-EUR).

## Table of Contents

1. [Quick Start](#quick-start)
2. [Regional Payment Strategy](#regional-payment-strategy)
3. [Architecture Overview](#architecture-overview)
4. [Setup Guide](#setup-guide)
5. [RazorPay Integration](#razorpay-integration)
6. [Stripe Integration](#stripe-integration)
7. [API Reference](#api-reference)
8. [Frontend Components](#frontend-components)
9. [Webhook Handling](#webhook-handling)
10. [Testing Guide](#testing-guide)
11. [Production Deployment](#production-deployment)
12. [Adding New Providers](#adding-new-providers)

---

## Quick Start

### 1. Install Dependencies

```bash
npm install razorpay stripe
```

### 2. Set Environment Variables

**Backend:**
```env
# RazorPay (Primary for India)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx

# Stripe (International - when enabled)
STRIPE_ENABLED=false  # Set to 'true' when Stripe is configured
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Frontend:**
```env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx  # When Stripe enabled
```

### 3. Push Database Schema

```bash
npx prisma migrate dev
```

### 4. Configure Webhooks

**RazorPay Dashboard:**
- URL: `https://your-app.com/api/webhooks/razorpay`
- Events: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `payment.failed`

**Stripe Dashboard (when enabled):**
- URL: `https://your-app.com/api/webhooks/stripe`
- Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`

---

## Regional Payment Strategy

This module implements intelligent payment routing based on customer location and currency:

| Customer Location | Currency | Provider (STRIPE_ENABLED=false) | Provider (STRIPE_ENABLED=true) |
|------------------|----------|----------------------------------|--------------------------------|
| India            | INR      | RazorPay                         | RazorPay                       |
| US, Canada       | USD      | RazorPay (fallback)              | **Stripe**                     |
| Europe           | EUR/GBP  | RazorPay (fallback)              | **Stripe**                     |
| Australia/NZ     | AUD/NZD  | RazorPay (fallback)              | **Stripe**                     |
| Asia-Pacific     | Various  | RazorPay                         | RazorPay                       |
| Other            | Various  | RazorPay                         | RazorPay                       |

### Why This Strategy?

1. **RazorPay for India**: Best local payment methods (UPI, Netbanking, Wallets), lowest fees for INR transactions
2. **Stripe for International**: Better support for international cards, local payment methods in US/EU
3. **Feature Flag Control**: Enable Stripe only when you have access (invite-only in India as of 2025)

---

## Architecture Overview

### Provider-Agnostic Design

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend                              │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐     │
│  │ Pricing  │  │ Subscription │  │ Payment       │     │
│  │ Page     │  │ Card         │  │ History       │     │
│  └────┬─────┘  └──────┬───────┘  └───────┬───────┘     │
└───────┼───────────────┼──────────────────┼─────────────┘
        │               │                  │
        ▼               ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                    API Routes                            │
│  /api/payments/create-subscription                       │
│  /api/payments/subscription                              │
│  /api/webhooks/:provider                                 │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Subscription Service                        │
│  (Provider-agnostic business logic)                     │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│           Payment Provider Factory                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  RazorPay   │  │   Stripe    │  │   Paddle    │     │
│  │  Provider   │  │  Provider   │  │  Provider   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### Key Benefits

- **No Vendor Lock-in**: Switch providers in hours, not weeks
- **Regional Optimization**: Use best provider per region
- **Easy Testing**: Mock providers in unit tests
- **Gradual Migration**: Move users between providers gradually

---

## Setup Guide

### RazorPay Account Setup

1. Sign up at https://dashboard.razorpay.com/signup
2. Complete KYC verification
3. Generate API keys (Settings → API Keys)
4. Configure webhooks (Settings → Webhooks)

### Create Subscription Plans

In RazorPay Dashboard, create plans for each tier:

```
Products → Plans → Create Plan

Plan: Solo
Period: Monthly
Amount: ₹2,399
Currency: INR
```

Save the plan IDs and add to environment:

```env
RAZORPAY_PLAN_SOLO=plan_xxxxxxxxxxxxx
RAZORPAY_PLAN_TEAM=plan_xxxxxxxxxxxxx
RAZORPAY_PLAN_BROKERAGE=plan_xxxxxxxxxxxxx
```

---

## RazorPay Integration

### Implementation Details

The RazorPay provider implements the `IPaymentProvider` interface with:

- Customer management
- Subscription creation and management
- Payment verification
- Webhook signature verification
- Payment signature verification (for frontend)

### Frontend Integration

Add RazorPay script to `index.html`:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Usage Example

```typescript
const options = {
  key: import.meta.env.VITE_RAZORPAY_KEY_ID,
  subscription_id: subscriptionId,
  name: 'InfographicAI',
  description: 'Solo Plan Subscription',
  handler: async (response) => {
    // Payment successful
    await verifyPayment(response);
  },
};

const rzp = new (window as any).Razorpay(options);
rzp.open();
```

---

## Stripe Integration

### Important: Stripe India Status (2025)

As of 2025, **Stripe is invite-only in India**. This means:

- New Indian businesses cannot sign up directly
- You must request an invite through Stripe Sales
- Priority is given to businesses with international payment needs
- Expected to reopen to broader audience in H2 2025

### For India-Based Founders

**Option 1: Use RazorPay (Recommended)**
- RazorPay is fully operational in India
- Supports all local payment methods (UPI, cards, netbanking)
- This module is pre-configured to use RazorPay as the default

**Option 2: Request Stripe Invite**
1. Contact Stripe Sales with your business details
2. Emphasize international payment needs
3. Prepare: GSTIN, IEC code (for exports), registered business documents
4. Approval is not guaranteed and can take weeks/months

**Option 3: US LLC Route**
- Create a US LLC to access Stripe US
- Requires US business entity + US bank account
- Useful if you primarily serve US/EU customers

### Activating Stripe (When You Have Access)

#### Step 1: Get Stripe API Keys

1. Log in to https://dashboard.stripe.com
2. Navigate to Developers → API Keys
3. Copy your Publishable key (pk_test_xxx or pk_live_xxx)
4. Copy your Secret key (sk_test_xxx or sk_live_xxx)

#### Step 2: Configure Environment Variables

```env
# Enable Stripe feature flag
STRIPE_ENABLED=true

# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

#### Step 3: Create Stripe Products and Prices

In Stripe Dashboard:
1. Navigate to Products → Add Product
2. Create a product for each plan tier
3. Add recurring prices for each product
4. Copy the Price IDs (price_xxxxx)

```env
STRIPE_PRICE_SOLO=price_xxxxxxxxxxxxx
STRIPE_PRICE_TEAM=price_xxxxxxxxxxxxx
STRIPE_PRICE_BROKERAGE=price_xxxxxxxxxxxxx
```

#### Step 4: Configure Stripe Webhooks

1. Navigate to Developers → Webhooks
2. Add endpoint: `https://your-app.com/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the Webhook signing secret to STRIPE_WEBHOOK_SECRET

#### Step 5: Test the Integration

1. Restart your application
2. Navigate to /pricing
3. Toggle to USD currency
4. You should see "Powered by Stripe" badge
5. Complete a test subscription

### Feature Flag Behavior

| STRIPE_ENABLED | Behavior |
|----------------|----------|
| `false` (default) | All payments routed to RazorPay |
| `true` | USD/EUR → Stripe, INR → RazorPay |

---

## API Reference

### Create Subscription

```http
POST /api/payments/create-subscription
Content-Type: application/json
Authorization: Bearer <token>

{
  "planTier": "SOLO",
  "currency": "INR",
  "region": "IN"
}
```

Response:
```json
{
  "success": true,
  "subscription": { ... },
  "provider": "RAZORPAY",
  "shortUrl": "https://rzp.io/i/..."
}
```

### Get Current Subscription

```http
GET /api/payments/subscription
Authorization: Bearer <token>
```

### Cancel Subscription

```http
POST /api/payments/cancel
Authorization: Bearer <token>

{
  "immediate": false
}
```

### Get Payment History

```http
GET /api/payments/history
Authorization: Bearer <token>
```

### Verify Payment (Frontend Callback)

```http
POST /api/payments/verify

{
  "razorpayPaymentId": "pay_xxxxx",
  "razorpaySubscriptionId": "sub_xxxxx",
  "razorpaySignature": "xxxxx"
}
```

---

## Frontend Components

### PricingPage

Full-featured pricing page with:
- Plan cards with features list
- RazorPay checkout integration
- Stripe checkout integration (when enabled)
- Loading states and error handling

### SubscriptionCard

Display current subscription status with:
- Plan details
- Usage meter
- Billing period information
- Upgrade/cancel options

### PaymentHistory

Transaction history table showing:
- Payment date
- Amount
- Status
- Payment method
- Invoice links

---

## Webhook Handling

### Supported Events

| Event | Action |
|-------|--------|
| `subscription.activated` | Update status to ACTIVE |
| `subscription.charged` | Create payment record, reset usage |
| `subscription.cancelled` | Downgrade to FREE plan |
| `payment.failed` | Record failed payment |

### Webhook Security

All webhooks are verified using HMAC-SHA256:

```typescript
verifyWebhookSignature(webhookBody, signature, secret): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(webhookBody)
    .digest('hex');
  return expectedSignature === signature;
}
```

### Idempotency

Duplicate webhooks are handled gracefully:

```typescript
const existingPayment = await db.query.payments.findFirst({
  where: eq(payments.externalPaymentId, paymentId)
});
if (existingPayment) return; // Already processed
```

---

## Testing Guide

### Test Mode

Use test API keys from provider dashboards:

**RazorPay:**
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=test_xxxxx
```

**Stripe:**
```env
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### Test Card Numbers

**RazorPay:**
- Success: `4111 1111 1111 1111`
- Failure: `4000 0000 0000 0002`

**Stripe:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

### Test UPI

Use `success@razorpay` for successful UPI payments in RazorPay test mode.

### Webhook Testing

1. **Local Development**: Use ngrok
   ```bash
   ngrok http 5000
   ```

2. **Configure in Dashboard**: Use ngrok URL

3. **Send Test Webhook**: Use provider dashboard's test webhook feature

---

## Production Deployment

### Pre-Launch Checklist

- [ ] Switch to Live API keys
- [ ] Update webhook URL to production domain
- [ ] Test with small real payment
- [ ] Verify webhook secret is set
- [ ] Enable HTTPS
- [ ] Configure rate limiting

### Environment Variables

```env
# Production
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=live_xxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxx
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx

STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
```

### Webhook Configuration

Update webhook URL:
```
https://your-production-domain.com/api/webhooks/razorpay
https://your-production-domain.com/api/webhooks/stripe
```

---

## Adding New Providers

### Step 1: Create Provider Class

```typescript
export class NewProvider implements IPaymentProvider {
  getProviderName(): PaymentProviderType {
    return 'NEWPROVIDER';
  }
  
  async createCustomer(email: string, name: string): Promise<CustomerResponse> {
    // Implement using provider SDK
  }
  
  // ... implement all interface methods
}
```

### Step 2: Register in Factory

```typescript
private getProviderByType(provider: PaymentProviderType): IPaymentProvider {
  switch (provider) {
    case 'RAZORPAY': return this.razorpayProvider;
    case 'STRIPE': return this.stripeProvider;
    case 'NEWPROVIDER': return this.newProvider; // Add case
  }
}
```

### Step 3: Add Region Routing

```typescript
private getProviderByRegion(region: string): IPaymentProvider {
  if (['US', 'CA'].includes(region)) {
    return this.newProvider;
  }
  return this.razorpayProvider;
}
```

---

## File Structure

```
server/
├── payments/
│   ├── interfaces/
│   │   └── payment-provider.interface.ts  # Provider contract
│   ├── providers/
│   │   ├── razorpay.provider.ts           # RazorPay implementation
│   │   ├── stripe.provider.ts             # Stripe implementation
│   │   └── payment-provider.factory.ts    # Provider selection
│   ├── services/
│   │   └── subscription.service.ts        # Business logic
│   └── index.ts                           # Module exports
└── routes.ts                              # API endpoints

client/
├── src/
│   ├── components/
│   │   └── payments/
│   │       ├── SubscriptionCard.tsx
│   │       ├── PaymentHistory.tsx
│   │       └── index.ts
│   └── pages/
│       └── pricing-page.tsx
└── index.html                             # Payment scripts
```

---

## Troubleshooting

### Common Issues

1. **"RAZORPAY_KEY_ID is required"**
   - Ensure environment variables are set correctly
   - Restart the server after adding env vars

2. **Webhook signature verification failed**
   - Check webhook secret is correct
   - Ensure raw body is passed to verification

3. **Subscription not created**
   - Verify plan ID exists in provider dashboard
   - Check customer ID is valid

4. **Payment modal not opening**
   - Ensure checkout.js is loaded in index.html
   - Check VITE_RAZORPAY_KEY_ID is set

### Debug Mode

Enable logging:
```typescript
console.log('Webhook received:', event.event);
console.log('Provider:', providerName);
```

---

## Support

- RazorPay Documentation: https://razorpay.com/docs/
- Stripe Documentation: https://stripe.com/docs
- API Reference: See individual provider documentation
- Test Credentials: See provider dashboards

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Architecture:** Provider-Agnostic with RazorPay and Stripe Support

