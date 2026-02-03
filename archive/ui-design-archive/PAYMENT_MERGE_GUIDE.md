# Payment Integration Merge Guide

## Overview
This guide helps you merge payment integration code from Replit into your Cursor project to create a working MVP.

## Current State
- ✅ UI Components: `BillingScreen.tsx` exists with mockup UI
- ✅ Account Page: Integrated with billing section
- ❌ Payment Logic: Not implemented
- ❌ Backend API: Not set up
- ❌ Stripe Integration: Not configured

## Step-by-Step Merge Process

### Step 1: Identify Your Replit Payment Code Structure

Before merging, identify what you have in Replit:

**Frontend Code (React/TypeScript):**
- [ ] Stripe client initialization
- [ ] Checkout session creation
- [ ] Payment form components
- [ ] Subscription management UI
- [ ] Usage tracking logic

**Backend Code (Node.js/Express/Replit):**
- [ ] Stripe webhook handlers
- [ ] Checkout session creation endpoint
- [ ] Customer portal endpoint
- [ ] Subscription status endpoints
- [ ] Payment method management

**Configuration:**
- [ ] Stripe API keys (test/live)
- [ ] Environment variables
- [ ] Product/Price IDs

### Step 2: Set Up Project Structure

The project structure is now set up as follows:

```
src/
├── lib/
│   └── payment/
│       ├── stripe.ts          # Stripe client initialization
│       ├── checkout.ts        # Checkout session creation
│       ├── subscriptions.ts  # Subscription management
│       └── types.ts           # TypeScript types
├── components/
│   └── payment/
│       ├── PricingModal.tsx   # Pricing plans modal
│       ├── CheckoutButton.tsx  # Checkout button component
│       └── PaymentMethod.tsx   # Payment method display
├── api/                       # Backend API routes (if using Vite SSR or separate server)
│   └── payment/
│       ├── checkout.ts        # Create checkout session
│       ├── webhook.ts         # Stripe webhook handler
│       └── portal.ts          # Customer portal
└── hooks/
    └── usePayment.ts          # Payment hooks
```

### Step 3: Install Dependencies

Run these commands in your project:

```bash
# Stripe frontend SDK
npm install @stripe/stripe-js

# Stripe backend SDK (if you have a backend)
npm install stripe

# Additional utilities if needed
npm install @stripe/react-stripe-js  # If using Stripe Elements
```

### Step 4: Copy Replit Code to Project

#### 4.1 Frontend Code Migration

**From Replit → To Cursor:**

1. **Stripe Client** (`lib/payment/stripe.ts`)
   - Copy your `loadStripe` initialization
   - Copy checkout session creation functions
   - Copy customer portal functions

2. **Payment Components** (`components/payment/`)
   - Copy any payment form components
   - Copy checkout buttons
   - Copy subscription management UI

3. **Hooks** (`hooks/usePayment.ts`)
   - Copy any custom hooks for payment state
   - Copy subscription status hooks

#### 4.2 Backend Code Migration

**Option A: If using Replit as Backend**
- Keep backend in Replit
- Update frontend API calls to point to Replit backend URL
- Set up CORS properly

**Option B: If migrating Backend to Cursor**
- Copy API routes to `api/` folder
- Set up Vite SSR or separate Express server
- Update environment variables

### Step 5: Update Environment Variables

Create `.env.local` file (add to `.gitignore`):

```env
# Stripe Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...  # Backend only

# Replit Backend URL (if keeping backend in Replit)
VITE_API_URL=https://your-replit-app.repl.co

# Stripe Product/Price IDs
VITE_STRIPE_FREE_PLAN_PRICE_ID=price_...
VITE_STRIPE_PRO_PLAN_PRICE_ID=price_...
```

### Step 6: Integration Checklist

#### Frontend Integration

- [ ] Update `BillingScreen.tsx` to use real payment functions
- [ ] Replace mock data with API calls
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add success/error toasts
- [ ] Connect upgrade buttons to checkout flow
- [ ] Connect cancel subscription to customer portal

#### Backend Integration

- [ ] Set up checkout session endpoint
- [ ] Set up webhook endpoint (for subscription updates)
- [ ] Set up customer portal endpoint
- [ ] Set up subscription status endpoint
- [ ] Configure Stripe webhooks in Stripe Dashboard
- [ ] Test webhook locally using Stripe CLI

#### Usage Tracking

- [ ] Create `lib/usage.ts` for usage limits
- [ ] Track exports per month
- [ ] Track saved designs count
- [ ] Enforce limits based on plan
- [ ] Show usage in UI

### Step 7: Testing

#### Test Checklist

- [ ] Test checkout flow with Stripe test cards
- [ ] Test subscription upgrade
- [ ] Test subscription cancellation
- [ ] Test webhook events (subscription.created, subscription.updated, etc.)
- [ ] Test usage limits enforcement
- [ ] Test payment method updates
- [ ] Test error scenarios (declined cards, network errors)

#### Stripe Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

### Step 8: Common Issues & Solutions

#### Issue 1: CORS Errors
**Solution:** Ensure Replit backend has CORS configured:
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-production-domain.com']
}));
```

#### Issue 2: Environment Variables Not Loading
**Solution:** Restart dev server after adding `.env.local`:
```bash
npm run dev
```

#### Issue 3: Stripe Keys Not Working
**Solution:** 
- Verify keys are correct (test vs live)
- Check if keys are exposed in frontend (only publishable key should be)
- Regenerate keys if needed

#### Issue 4: Webhook Signature Verification Fails
**Solution:**
- Get webhook signing secret from Stripe Dashboard
- Verify signature in webhook handler
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/payment/webhook`

### Step 9: Quick Merge Template

If you want to quickly merge, follow this pattern:

1. **Copy Stripe initialization** from Replit → `src/lib/payment/stripe.ts`
2. **Copy checkout function** from Replit → `src/lib/payment/checkout.ts`
3. **Copy API endpoints** from Replit → `src/api/payment/` (or update URLs to point to Replit)
4. **Update BillingScreen** to call real functions instead of mocks
5. **Add environment variables** to `.env.local`
6. **Test with Stripe test mode**

### Step 10: Production Readiness

Before going live:

- [ ] Switch to Stripe live keys
- [ ] Update webhook endpoints in Stripe Dashboard
- [ ] Test with real payment (small amount)
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Add analytics tracking
- [ ] Set up email notifications for payments
- [ ] Review Stripe security best practices

## Need Help?

If you encounter issues:

1. Check the created files in `src/lib/payment/` and `src/components/payment/`
2. Compare with your Replit code structure
3. Ensure all imports are correct
4. Verify environment variables are set
5. Check browser console for errors
6. Check network tab for API call failures

## Next Steps

After merging:

1. Test thoroughly in test mode
2. Update usage tracking to enforce limits
3. Add subscription status checks throughout app
4. Implement proper error handling
5. Add loading states and user feedback
6. Set up monitoring and logging

