# Quick Merge Steps - Payment Integration

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
npm install @stripe/stripe-js stripe
```

### Step 2: Copy Your Replit Code

#### Frontend Code (Copy to Cursor):
1. **Stripe Client** → `src/lib/payment/stripe.ts`
   - Replace the `getStripe()` function with your Replit code
   
2. **Checkout Functions** → `src/lib/payment/checkout.ts`
   - Replace `createCheckoutSession()` with your Replit checkout code
   - Replace `getCustomerPortalUrl()` with your Replit portal code

3. **Subscription Functions** → `src/lib/payment/subscriptions.ts`
   - Replace all functions with your Replit subscription management code

4. **Types** → `src/lib/payment/types.ts`
   - Add your TypeScript types from Replit

#### Backend Code (Choose One):

**Option A: Keep Backend in Replit**
- Update `VITE_API_URL` in `.env.local` to point to your Replit backend
- Ensure CORS is configured in Replit backend

**Option B: Move Backend to Cursor**
- Copy API routes to `src/api/payment/` folder
- Set up Express server or use Vite SSR

### Step 3: Set Environment Variables

Create `.env.local` file:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
VITE_API_URL=https://your-replit-app.repl.co
```

### Step 4: Update API URLs

If your Replit backend uses different endpoints, update:
- `src/lib/payment/checkout.ts` - Checkout endpoint
- `src/lib/payment/subscriptions.ts` - Subscription endpoints

### Step 5: Test

```bash
npm run dev
```

1. Go to Account → Billing
2. Click "Upgrade Plan"
3. Test checkout flow

## 📋 Checklist

- [ ] Dependencies installed
- [ ] Stripe keys added to `.env.local`
- [ ] Replit code copied to payment files
- [ ] API URLs updated (if different)
- [ ] CORS configured in Replit backend
- [ ] Test checkout flow
- [ ] Test customer portal
- [ ] Test subscription status

## 🔧 Common Fixes

### CORS Error
Add to your Replit backend:
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-domain.com']
}));
```

### Environment Variables Not Loading
- Restart dev server: `npm run dev`
- Check `.env.local` is in project root
- Variables must start with `VITE_` for Vite

### API Calls Failing
- Check `VITE_API_URL` is correct
- Verify backend is running
- Check network tab in browser console

## 📁 File Structure Created

```
src/
├── lib/
│   ├── payment/
│   │   ├── stripe.ts          ← Copy your Stripe init here
│   │   ├── checkout.ts        ← Copy your checkout code here
│   │   ├── subscriptions.ts  ← Copy your subscription code here
│   │   └── types.ts           ← Copy your types here
│   └── usage.ts               ← Usage tracking (ready to use)
├── components/
│   └── payment/
│       ├── PricingModal.tsx   ← Pricing UI (ready to use)
│       └── CheckoutButton.tsx ← Checkout button (ready to use)
└── components/account/
    └── BillingScreen.tsx       ← Updated to use real payment
```

## 🎯 What's Already Done

✅ Payment folder structure created
✅ Stripe client placeholder created
✅ Checkout functions placeholder created
✅ Subscription management placeholder created
✅ Usage tracking system implemented
✅ PricingModal component created
✅ CheckoutButton component created
✅ BillingScreen updated to use real payment functions
✅ TypeScript types defined

## 🔄 What You Need to Do

1. Copy your Replit payment code to the placeholder files
2. Update API endpoints if different
3. Add environment variables
4. Test!

## 💡 Tips

- Start with test mode Stripe keys
- Use Stripe test cards: `4242 4242 4242 4242`
- Check browser console for errors
- Use Network tab to debug API calls
- Test webhooks with Stripe CLI locally

