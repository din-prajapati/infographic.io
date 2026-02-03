# 🔧 RazorPay Account Setup Guide - Step by Step

> **Purpose:** Complete step-by-step guide for setting up RazorPay test account, API keys, and subscription plans  
> **For:** MVP Launch - Task 1.1  
> **Time Required:** 30-45 minutes  
> **Last Updated:** January 2025

---

## 📋 Prerequisites

- Business email address
- Indian mobile number (for account verification)
- Business name (can be your name for individual accounts)
- Access to email inbox for verification

---

## 🚀 Step 1: Create RazorPay Account

### Step 1.1: Sign Up

1. **Navigate to RazorPay Signup:**
   - Go to: https://dashboard.razorpay.com/signup
   - Click "Sign Up" button (top-right corner)

2. **Fill Registration Form:**
   - **Email:** Enter your business email address
   - **Password:** Create a strong password (min 8 characters)
   - **Business Name:** Enter your business name (e.g., "InfographicAI" or your company name)
   - **Mobile Number:** Enter Indian mobile number (required for verification)
   - **Accept Terms:** Check "I agree to RazorPay Terms and Conditions"
   - Click "Sign Up" button

3. **Verify Email:**
   - Check your email inbox
   - Look for email from RazorPay (subject: "Verify your RazorPay account")
   - Click "Verify Email" button in email
   - You'll be redirected to RazorPay dashboard

4. **Complete Business Details (Optional for Test Mode):**
   - **Business Type:** Select one:
     - Individual/Sole Proprietor
     - Partnership Firm
     - Private Limited Company
     - Public Limited Company
     - LLP (Limited Liability Partnership)
   - **Business Name:** Enter your business name
   - **PAN Number:** Enter PAN (optional for test mode)
   - **Business Address:** Enter complete address
   - Click "Continue"

   **Note:** For MVP testing, you can skip full KYC verification. KYC is required only for live payments. Test mode works without KYC.

---

## 🔑 Step 2: Access Test Mode & Generate API Keys

### Step 2.1: Switch to Test Mode

1. **Access Dashboard:**
   - After login, you'll see RazorPay Dashboard
   - Look for "Test Mode" toggle in top-right corner (next to your profile)

2. **Enable Test Mode:**
   - Click "Test Mode" toggle to switch ON
   - Test Mode badge should appear in header (orange/yellow badge)
   - **Important:** All transactions in Test Mode are simulated and don't charge real money

### Step 2.2: Generate API Keys

1. **Navigate to API Keys:**
   - Click "Settings" in left sidebar
   - Click "API Keys" under Settings section
   - You'll see two sections:
     - **Test Mode Keys** (for testing)
     - **Live Mode Keys** (for production - will be empty initially)

2. **Generate Test Mode Keys:**
   - In "Test Mode Keys" section, click "Generate Keys" button
   - A modal will appear with:
     - **Key ID** (starts with `rzp_test_`)
     - **Key Secret** (long alphanumeric string)
   - **⚠️ CRITICAL:** Copy both keys immediately!
   - **Key Secret is shown only once** - if you lose it, you'll need to regenerate

3. **Copy Keys Securely:**
   - **Key ID Format:** `rzp_test_xxxxxxxxxxxxx`
     - Example: `rzp_test_1DP5mmOlF5G5ag`
   - **Key Secret Format:** `xxxxxxxxxxxxxxxxxxxxxxxx` (32+ characters)
     - Example: `D3bK8vQ2mN5pR7sT9uW1xY3zA5bC7dE`
   - Save both keys in:
     - Password manager (recommended)
     - Encrypted file
     - Secure notes app
   - **⚠️ NEVER commit these keys to Git!**

---

## 💰 Step 3: Create Subscription Plans

### ⚠️ Important: Currency Limitation for RazorPay Subscription Plans

**RazorPay Subscription Plans only support INR (Indian Rupees) currency.**

- ✅ **Supported:** INR (₹) - Indian Rupees
- ❌ **Not Supported:** USD, EUR, GBP, or other international currencies for subscription plans
- 📝 **Note:** If you need multi-currency support, consider using Stripe for non-INR currencies (see [Payment Integration Guide](payments/PAYMENT_INTEGRATION.md))

**Why INR only?** RazorPay is primarily designed for Indian businesses. Subscription plans are restricted to INR to ensure compliance with Indian payment regulations and banking requirements.

### ⚠️ Important: User Limit Enforcement Status

**User limits per plan tier are currently NOT enforced in the codebase.**

- ✅ **Usage limits** (infographics/month) are enforced
- ❌ **User limits** (team members) are NOT enforced
- 📝 **Note:** See [User Limit Enforcement Gap](USER_LIMIT_ENFORCEMENT_GAP.md) for implementation details

**Current Status:**
- Team Plan advertises "5 users" but currently allows unlimited users
- Implementation required for MVP launch (see implementation guide)

### Plan Configuration Reference

Based on your `PLAN_CONFIG` in `shared/schema.ts`:

| Plan Tier     | Monthly Price | Annual Price (15% off) | Usage Limit | User Limit      | Currency |
| ------------- | ------------- | ---------------------- | ----------- | --------------- | -------- |
| **SOLO**      | ₹2,999        | ₹30,588                | 50/month    | 1 user          | INR      |
| **TEAM**      | ₹6,999        | ₹71,388                | 200/month   | 5 users         | INR      |
| **BROKERAGE** | ₹24,999       | ₹254,988               | 1000/month  | Unlimited users | INR      |

### Step 3.1: Create SOLO Plan (Monthly)

1. **Navigate to Plans:**
   - Click "Products" in left sidebar
   - Click "Plans" submenu
   - Click "Create Plan" button (top-right, blue button)

2. **Fill Plan Details:**
   - **Plan Name:** `SOLO Monthly`
   - **Description:** `Solo Plan - 50 infographics per month`
   - **Amount:** `2999` (RazorPay accepts rupees, not paise)
   - **Currency:** 
     - **⚠️ Important:** Only `INR` (Indian Rupees) is available for subscription plans
     - Select `INR` from the currency dropdown
     - If you don't see INR or see other currencies, ensure you're creating a **Subscription Plan** (not a Payment Link)
     - **Note:** RazorPay subscription plans do not support USD, EUR, or other international currencies
   - **Interval:** Select `monthly` from dropdown
   - **Billing Period:** `1` (1 month)
   - Click "Create Plan" button

3. **Copy Plan ID:**
   - After creation, you'll see Plan Details page
   - **Plan ID** is displayed (starts with `plan_`)
   - Plan ID format: `plan_xxxxxxxxxxxxx`
   - Example: `plan_Nnnnnnnnnnnnnn`
   - **Copy this Plan ID** - you'll need it for environment variables

### Step 3.2: Create SOLO Plan (Annual) - Optional

**Note:** You can create annual plans or handle annual billing in your application logic. For MVP, monthly plans are sufficient.

1. **Create Annual Plan:**
   - Click "Create Plan" again
   - **Plan Name:** `SOLO Annual`
   - **Description:** `Solo Plan - Annual billing with 15% discount`
   - **Amount:** `30588` (₹2,999 × 12 months × 0.85 discount = ₹30,588)
   - **Currency:** 
     - Select `INR` from dropdown (only option available for subscription plans)
     - **Reminder:** Subscription plans only support INR currency
   - **Interval:** Select `yearly` from dropdown
   - **Billing Period:** `12` (12 months)
   - Click "Create Plan"
   - Copy Plan ID (optional - can use same plan with different billing logic)

### Step 3.3: Create TEAM Plan (Monthly)

1. **Create TEAM Monthly Plan:**
   - Click "Create Plan"
   - **Plan Name:** `TEAM Monthly`
   - **Description:** `Team Plan - 200 infographics/month, 5 users`
   - **Amount:** `6999` (₹6,999)
   - **Currency:** 
     - Select `INR` from dropdown (only option for subscription plans)
   - **Interval:** `monthly`
   - **Billing Period:** `1`
   - Click "Create Plan"
   - **Copy Plan ID** - save it!

### Step 3.4: Create TEAM Plan (Annual) - Optional

1. **Create TEAM Annual Plan:**
   - Click "Create Plan"
   - **Plan Name:** `TEAM Annual`
   - **Description:** `Team Plan - Annual billing with 15% discount, 200 infographics/month, 5 users`
   - **Amount:** `71388` (₹6,999 × 12 × 0.85 = ₹71,388)
   - **Currency:** 
     - Select `INR` from dropdown (only option for subscription plans)
   - **Interval:** `yearly`
   - **Billing Period:** `12`
   - Click "Create Plan"
   - Copy Plan ID (optional)

### Step 3.5: Create BROKERAGE Plan (Monthly)

1. **Create BROKERAGE Monthly Plan:**
   - Click "Create Plan"
   - **Plan Name:** `BROKERAGE Monthly`
   - **Description:** `Brokerage Plan - 1000 infographics/month, unlimited users`
   - **Amount:** `24999` (₹24,999)
   - **Currency:** 
     - Select `INR` from dropdown (only option for subscription plans)
   - **Interval:** `monthly`
   - **Billing Period:** `1`
   - Click "Create Plan"
   - **Copy Plan ID** - save it!

### Step 3.6: Create BROKERAGE Plan (Annual) - Optional

1. **Create BROKERAGE Annual Plan:**
   - Click "Create Plan"
   - **Plan Name:** `BROKERAGE Annual`
   - **Description:** `Brokerage Plan - Annual billing with 15% discount, 1000 infographics/month, unlimited users`
   - **Amount:** `254988` (₹24,999 × 12 × 0.85 = ₹254,988)
   - **Currency:** 
     - Select `INR` from dropdown (only option for subscription plans)
   - **Interval:** `yearly`
   - **Billing Period:** `12`
   - Click "Create Plan"
   - Copy Plan ID (optional)

---

## ⚙️ Step 4: Configure Environment Variables

### Step 4.1: Backend Environment Variables

Create or update `.env` file in project root:

```env
# RazorPay API Keys (Test Mode)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# RazorPay Plan IDs (from Step 3)
RAZORPAY_PLAN_SOLO=plan_xxxxxxxxxxxxx
RAZORPAY_PLAN_TEAM=plan_xxxxxxxxxxxxx
RAZORPAY_PLAN_BROKERAGE=plan_xxxxxxxxxxxxx

# RazorPay Webhook Secret (will be configured in Task 1.2)
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx
```

**Replace placeholders with actual values:**
- `rzp_test_xxxxxxxxxxxxx` → Your actual Key ID
- `xxxxxxxxxxxxxxxxxxxxxxxx` → Your actual Key Secret
- `plan_xxxxxxxxxxxxx` → Your actual Plan IDs

### Step 4.2: Frontend Environment Variables

Create or update `client/.env` file:

```env
# RazorPay Public Key (Test Mode)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

**Note:** Frontend only needs Key ID (public key), not the secret.

### Step 4.3: Verify Environment Variables

1. **Restart Development Server:**
   ```bash
   # Stop current server (Ctrl+C)
   # Restart server
   npm run dev
   ```

2. **Check Console Logs:**
   - Look for any "Missing environment variable" errors
   - Verify keys are loaded (don't log actual keys!)
   - Check for any RazorPay initialization errors

3. **Test API Connection:**
   - Try accessing pricing page: `http://localhost:5000/pricing`
   - Check browser console for any RazorPay errors
   - Verify RazorPay script loads correctly

---

## 📊 Quick Reference: Plan IDs Summary

After completing Step 3, you should have these Plan IDs:

| Plan Tier | Monthly Plan ID | Annual Plan ID (Optional) | Monthly Price | Annual Price (15% off) | Usage Limit | User Limit      |
| --------- | --------------- | ------------------------- | ------------- | ---------------------- | ----------- | --------------- |
| SOLO      | `plan_xxxxx`    | `plan_xxxxx`              | ₹2,999        | ₹30,588                | 50/month    | 1 user          |
| TEAM      | `plan_xxxxx`    | `plan_xxxxx`              | ₹6,999        | ₹71,388                | 200/month   | 5 users         |
| BROKERAGE | `plan_xxxxx`    | `plan_xxxxx`              | ₹24,999       | ₹254,988               | 1000/month  | Unlimited users |

**Save this table with your actual Plan IDs!**

---

## ✅ Verification Checklist

Before proceeding to Task 1.1 Step 2 (Test Checkout Flow), verify:

- [ ] ✅ RazorPay test account created and logged in
- [ ] ✅ Test Mode enabled (toggle in top-right shows "Test Mode")
- [ ] ✅ API Keys generated and copied:
  - [ ] Key ID (starts with `rzp_test_`)
  - [ ] Key Secret (long alphanumeric string)
- [ ] ✅ All 3 monthly plans created:
  - [ ] SOLO Monthly Plan (Plan ID copied)
  - [ ] TEAM Monthly Plan (Plan ID copied)
  - [ ] BROKERAGE Monthly Plan (Plan ID copied)
- [ ] ✅ Environment variables set:
  - [ ] Backend `.env` file updated with all keys and plan IDs
  - [ ] Frontend `.env` file updated with `VITE_RAZORPAY_KEY_ID`
- [ ] ✅ Server restarted to load new environment variables
- [ ] ✅ No errors in console logs about missing keys
- [ ] ✅ Pricing page loads without errors

**✅ Ready to proceed to Step 2: Test Checkout Flow**

---

## 📋 Extended Configuration Summary (Multi-Product, Trial, Webhooks, Plan Changes)

This section summarizes step-by-step configuration for **multiple products under one organization**, **plan names with product prefix**, **creating subscriptions under plans**, **14-day trial**, **webhook setup for multiple products**, and **handling pricing/discount changes** (plans are immutable). Use it alongside the main steps above without replacing them.

### 1. Multiple Products Under Same Organization

| Aspect | Approach |
|--------|----------|
| **Razorpay account** | One account per organization (one KYC, one set of API keys). |
| **Products (e.g. Product A, B)** | Represented by **different plans** in the same account. Use a **product prefix** in plan names (e.g. `InfographicAI - SOLO Monthly`, `ReportBuilder - SOLO Monthly`). |
| **Per-product app** | Same `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`; each app uses **only its own plan IDs** via env vars (e.g. Product A app: `RAZORPAY_PLAN_SOLO=plan_xxx`; Product B app: `RAZORPAY_PLAN_SOLO=plan_yyy`). |
| **Identification** | In webhooks or reports, map `plan_id` → product (or use plan name prefix). |

**Step-by-step (multi-product):** Complete Steps 1–2 above once. In Step 3, create all plans for all products with a clear name prefix per product. Copy each Plan ID and set the appropriate env vars per app (each app gets only the plan IDs for its product). Configure one webhook URL (see below); in the handler, use `plan_id` to determine which product the event belongs to.

### 2. Plan Names With Product Prefix – Summary Table

Use this naming pattern in Razorpay so plans are clearly tied to a product: **`{ProductName} - {Tier} {Interval}`**.

| # | Plan Name (Razorpay) | Description | Amount (INR) | Currency | Interval | Billing Period | Trial (at subscription) | Env Var (Plan ID) |
|---|---------------------|-------------|--------------|----------|----------|---------------|-------------------------|-------------------|
| 1 | **InfographicAI - SOLO Monthly** | Solo - 50 infographics/month | 2999 | INR | monthly | 1 | 14 days optional | `RAZORPAY_PLAN_SOLO` |
| 2 | **InfographicAI - SOLO Annual** | Solo - Annual 15% off | 30588 | INR | yearly | 12 | 14 days optional | (optional) |
| 3 | **InfographicAI - TEAM Monthly** | Team - 200/month, 5 users | 6999 | INR | monthly | 1 | 14 days optional | `RAZORPAY_PLAN_TEAM` |
| 4 | **InfographicAI - TEAM Annual** | Team - Annual 15% off | 71388 | INR | yearly | 12 | 14 days optional | (optional) |
| 5 | **InfographicAI - BROKERAGE Monthly** | Brokerage - 1000/month, unlimited users | 24999 | INR | monthly | 1 | 14 days optional | `RAZORPAY_PLAN_BROKERAGE` |
| 6 | **InfographicAI - BROKERAGE Annual** | Brokerage - Annual 15% off | 254988 | INR | yearly | 12 | 14 days optional | (optional) |

For a second product, use a different prefix (e.g. `ReportBuilder - SOLO Monthly`) and store that product’s plan IDs in that product’s app env only.

### 3. Creating Subscriptions Under a Plan

A **subscription** is always created **under one plan** (one `plan_id`).

- **Dashboard:** Products → Subscriptions / Subscription Links → Create Subscription Link → **Select Plan** (e.g. InfographicAI - SOLO Monthly) → set start date, total cycles, optional upfront/trial → create. The link creates a subscription under that plan when the customer pays.
- **API:** (1) Create customer: `POST /v1/customers`. (2) Create subscription: `POST /v1/subscriptions` with `plan_id`, `customer_id`, `total_count`, `quantity`, optional `start_at`, `customer_notify`. Use the `plan_id` from your env (e.g. `RAZORPAY_PLAN_SOLO`). Response includes `subscription_id` and `short_url` for checkout.
- **App flow:** Backend resolves plan_id from env by tier → creates subscription via provider → frontend opens Razorpay Checkout with `subscription_id` and `key`; after payment, webhooks (e.g. `subscription.activated`) confirm the subscription under that plan.

### 4. 14-Day Trial Period

Trial is **not** a plan field; it is set when **creating the subscription**.

- **Dashboard (Subscription Link):** Set **Start date** to 14 days from today. Billing starts at that date; the period before it is the trial.
- **API (Create Subscription):** Set `start_at` = current Unix timestamp + (14 × 24 × 60 × 60) (14 days in seconds). Same plan is used; the subscription’s first charge date is 14 days later.

No separate “trial plan” is required; use the same plan (e.g. InfographicAI - SOLO Monthly) with a future `start_at`.

### 5. Webhook Configuration for Multiple Products

- **Option A (recommended):** One webhook URL (e.g. `https://your-app.com/api/webhooks/razorpay`). Subscribe to: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `payment.failed`. Use **one** `RAZORPAY_WEBHOOK_SECRET`. In the handler, read `payload.subscription.entity.plan_id` (or equivalent) and maintain a **plan_id → product** mapping to update the correct product’s data.
- **Option B:** One webhook URL per product (e.g. `.../api/webhooks/razorpay?product=infographic_ai`). Each URL has its own secret in the Dashboard. Backend identifies product from the query parameter and verifies with the corresponding secret.

See [RazorPay Webhook Setup Guide](RAZORPAY_WEBHOOK_SETUP_GUIDE.md) for URL, events, and secret setup.

### 6. Editing Plans – Not Supported; How to Handle Pricing and Discounts

**Razorpay plans cannot be edited or deleted** (Dashboard or API). Once a plan is created, name, amount, period, and interval are fixed.

| Goal | What to do instead |
|------|---------------------|
| **Change price** | Create a **new plan** with the new amount (and name if desired). Use it for **new** subscriptions (update env with new plan_id). For **existing** subscribers, use **Update Subscription**: `PATCH /v1/subscriptions/:id` with `plan_id` = new plan and `schedule_change_at` = `"now"` or `"cycle_end"` (and optionally `customer_notify: true`). |
| **Apply discount** | Use **Offers** (Dashboard: Subscriptions → Offers). Create an offer (percentage or flat, redemption type, validity). Get **offer_id**. When creating a subscription, pass `offer_id`; or for an existing subscription, `PATCH /v1/subscriptions/:id` with `offer_id` and `schedule_change_at`. |
| **Change plan name/structure** | Create a new plan; point new subscriptions to it; optionally migrate existing subscriptions via Update Subscription as above. |

**Update Subscription API (reference):** `PATCH /v1/subscriptions/:id` with body e.g. `{ "plan_id": "plan_xxx", "schedule_change_at": "cycle_end", "customer_notify": true }` or `{ "offer_id": "offer_xxx", "schedule_change_at": "cycle_end", "customer_notify": true }`.

### 7. Domestic vs International Payments

- **Domestic (INR):** Subscription plans are INR-only. Use the plans and steps above.
- **International:** Enable international payments (e.g. foreign cards) via Razorpay support if needed. Subscription **plans** remain INR-only. For non-INR recurring, use Stripe when `STRIPE_ENABLED=true` (see [Payment Integration Guide](payments/PAYMENT_INTEGRATION.md)).

---

## 🌍 Multi-Currency Support (Alternative Solutions)

### If You Need Non-INR Currency Support

Since RazorPay subscription plans only support INR, here are your options:

#### Option 1: Use Stripe for International Currencies

Your application already supports Stripe integration for USD, EUR, GBP, CAD, and AUD:

1. **Set up Stripe Account:**
   - Create account at https://stripe.com
   - Generate API keys
   - Configure in your application

2. **Create Plans in Stripe:**
   - Create subscription plans in Stripe Dashboard
   - Use USD, EUR, or other supported currencies
   - Plans will automatically route to Stripe based on currency

3. **Application Routing:**
   - Your `PaymentProviderFactory` automatically routes:
     - INR → RazorPay
     - USD/EUR/GBP/CAD/AUD → Stripe (when enabled)
   - See [Payment Integration Guide](payments/PAYMENT_INTEGRATION.md) for details

#### Option 2: Convert Prices to INR

If you want to use RazorPay exclusively:

1. **Calculate INR equivalent:**
   - Use current exchange rates
   - Convert USD/EUR prices to INR
   - Create plans with INR amounts

2. **Display in User's Currency:**
   - Show prices in user's preferred currency on frontend
   - Convert at checkout to INR for RazorPay
   - Use exchange rate APIs for real-time conversion

#### Option 3: Contact RazorPay Support

- Reach out to RazorPay support for:
  - Future multi-currency support timeline
  - Enterprise solutions for international payments
  - Alternative payment methods

**Reference:** [RazorPay Documentation](https://razorpay.com/docs)

---

## 🎯 Recommended Way to Create Plans & Subscriptions for SaaS

For **SaaS products**, this is the most convenient and recommended approach.

### Plans – Create in the Razorpay Dashboard

- **Where:** Dashboard → **Products** (or **Payment products**) → **Subscriptions** → **Plans** → **Create plan**.
- **Why:** One-time setup, no code. You define each tier (name, amount, interval), copy **Plan IDs**, and add them to your app env (e.g. `RAZORPAY_PLAN_SOLO`, `RAZORPAY_PLAN_TEAM`).
- **For multiple products:** Use a clear naming pattern (e.g. `ProductName - SOLO Monthly`) and create all plans in the same account; each app uses only its plan IDs from env.

**Convenience:** High – visual, quick, and easy to correct before going live. Use the API for plans only if you automate provisioning or have many products.

### Subscriptions – Create via API from Your App

- **Flow:** User selects a plan on your pricing page → your backend calls Razorpay **Create subscription** API with `plan_id` (from env) and `customer_id` (create or fetch via API) → Razorpay returns `subscription_id` and `short_url` → your frontend opens **Razorpay Checkout** with that `subscription_id` → user pays → webhooks (`subscription.activated`, etc.) update your DB.
- **Why:** Fully automated, tied to your user/customer_id, no manual steps per signup, scales with your product, and matches the flow in this guide and [Payment Integration Guide](payments/PAYMENT_INTEGRATION.md).

**Convenience:** Best for SaaS – one implementation, then every signup is handled in-app.

### When to Use What

| Method | Plans | Subscriptions | Best for |
|--------|--------|----------------|----------|
| **Dashboard** | ✅ Recommended for initial setup (create all tiers, copy plan IDs) | ❌ Not for normal SaaS signups (too manual per customer) | Plan setup; one-off or support-driven signups via Subscription Link |
| **API from app** | Optional (e.g. multi-product automation) | ✅ Recommended for SaaS (create on "Subscribe" click) | All recurring signups from your product |
| **Subscription Link (Dashboard)** | N/A | ✅ Optional | Shareable link (e.g. "Start trial"), marketing page, or support creating a subscription without your app |

### Summary

- **Plans:** Create in the **Razorpay Dashboard** once per tier/product; copy Plan IDs into env.
- **Subscriptions:** Create via **API from your app** when the user clicks Subscribe; use **Subscription Links** from the dashboard only for special cases (shareable link, no-app signup).

This combination is the most convenient and recommended for SaaS: minimal manual work, clear ownership of plans and subscriptions, and a scalable signup and renewal flow.

---

## 🐛 Troubleshooting

### Issue: "Plan ID not found"

**Symptoms:**
- Error: "Plan not found" or "Invalid plan ID"
- Checkout fails to initialize

**Solutions:**
- ✅ Verify Plan ID is copied correctly (starts with `plan_`)
- ✅ Check Plan ID is from Test Mode (not Live Mode)
- ✅ Verify environment variable name matches exactly:
  - `RAZORPAY_PLAN_SOLO` (not `RAZORPAY_PLAN_SOLO_MONTHLY`)
- ✅ Restart server after adding environment variables
- ✅ Check Plan ID in RazorPay Dashboard → Products → Plans

### Issue: "Invalid API Key"

**Symptoms:**
- Error: "Invalid API key" or "Authentication failed"
- RazorPay checkout modal doesn't open

**Solutions:**
- ✅ Verify you're using Test Mode keys (starts with `rzp_test_`)
- ✅ Check Key ID and Key Secret are correct (no extra spaces)
- ✅ Ensure keys are from Test Mode section (not Live Mode)
- ✅ Verify environment variables are loaded correctly
- ✅ Check `.env` file is in correct location (project root)
- ✅ Verify frontend `.env` file has `VITE_RAZORPAY_KEY_ID`

### Issue: "Amount mismatch"

**Symptoms:**
- Payment fails with amount error
- Wrong amount displayed in checkout

**Solutions:**
- ✅ Remember: RazorPay Dashboard accepts amount in rupees
- ✅ ₹2,999 = enter `2999` (not `299900`)
- ✅ Verify plan amount matches your `PLAN_CONFIG`:
  - SOLO: `2999` (₹2,999) - 50 infographics/month, 1 user
  - TEAM: `6999` (₹6,999) - 200 infographics/month, 5 users
  - BROKERAGE: `24999` (₹24,999) - 1000 infographics/month, unlimited users
- ✅ Check currency is set to `INR` (only option for subscription plans)

### Issue: "Currency not supported" or "Cannot select USD/EUR"

**Symptoms:**
- Error: "Currency provided is not supported"
- Currency dropdown only shows INR
- Want to use USD or other currencies

**Solutions:**
- ✅ **This is expected behavior:** RazorPay subscription plans only support INR
- ✅ **For INR:** Continue with INR currency (default and only option)
- ✅ **For USD/EUR/GBP:** Use Stripe integration instead (see Multi-Currency Support section above)
- ✅ **Verify you're creating a Subscription Plan:**
  - Go to Products → Plans (not Payment Links)
  - Payment Links support multiple currencies, but Subscription Plans only support INR
- ✅ **Check your account type:**
  - Ensure you have an Indian RazorPay account
  - International accounts may have different limitations
- ✅ **Alternative:** Convert prices to INR and display in user's preferred currency on frontend

### Issue: "Webhook secret not configured"

**Note:** Webhook secret will be configured in Task 1.2. For now, you can leave `RAZORPAY_WEBHOOK_SECRET` empty or use a placeholder. It's only needed for webhook verification.

---

## 📝 Notes

### RazorPay Amount Format

- **Dashboard:** Accepts amount in rupees (e.g., `2999` for ₹2,999)
- **API:** Accepts amount in paise (smallest currency unit)
  - ₹1 = 100 paise
  - ₹2,999 = 299900 paise
- **For Plans:** Dashboard handles conversion automatically
- **For API Calls:** Use paise values (299900 for ₹2,999)

### Test Cards

RazorPay provides test cards for testing:

**Success Cards:**
- `4111 1111 1111 1111` - Visa (any CVV, any expiry)
- `5555 5555 5555 4444` - Mastercard

**Failure Cards:**
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 0069` - Expired card

**UPI Test:**
- Use `success@razorpay` for successful UPI payments

### Security Best Practices

- ✅ Never commit API keys to Git
- ✅ Use environment variables for all secrets
- ✅ Rotate keys periodically (especially after team member leaves)
- ✅ Use Test Mode keys for development
- ✅ Switch to Live Mode keys only for production
- ✅ Keep Key Secret secure (shown only once)

---

## 🔗 Useful Links

- **RazorPay Dashboard:** https://dashboard.razorpay.com
- **RazorPay Documentation:** https://razorpay.com/docs/
- **RazorPay Subscriptions Docs:** https://razorpay.com/docs/payments/subscriptions/
- **RazorPay Test Cards:** https://razorpay.com/docs/payments/test-cards/
- **RazorPay API Reference:** https://razorpay.com/docs/api/
- **Currency Conversion Guide:** https://razorpay.com/docs/payments/international-payments/currency-conversion/
- **Payment Integration Guide:** [payments/PAYMENT_INTEGRATION.md](payments/PAYMENT_INTEGRATION.md) - Multi-provider setup

## 📚 Related Documentation

- **[RazorPay Webhook Setup Guide](RAZORPAY_WEBHOOK_SETUP_GUIDE.md)** - Complete webhook configuration and testing guide
- **[MVP 1-Week Launch Plan](../roadmap/MVP_1_WEEK_LAUNCH_PLAN.md)** - Detailed launch checklist including RazorPay setup tasks
- **[Product Roadmap](../roadmap/PRODUCT_ROADMAP.md)** - Complete product roadmap including payment integration timeline
- **[Business Feasibility Report](../business/BUSINESS_FEASIBILITY_REPORT.md)** - Financial analysis including payment processing costs
- **[Gap Closing Strategy](../strategy/GAP_CLOSING_STRATEGY.md)** - Strategic features including pricing optimizations

---

## 📞 Support

If you encounter issues:

1. Check RazorPay Dashboard → Settings → API Keys (verify keys are correct)
2. Check RazorPay Dashboard → Products → Plans (verify plans exist)
3. Review application logs for specific error messages
4. Check RazorPay documentation for API errors
5. Contact RazorPay support: support@razorpay.com

---

**Status:** ✅ Ready for Testing  
**Next Step:** Proceed to Task 1.1 Step 2 - Test Checkout Flow

---

*Last Updated: January 2025*  
*For: MVP 1-Week Launch Plan*
