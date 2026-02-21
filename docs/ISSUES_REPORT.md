# Issues Report: AI Chat Box & RazorPay Integration

**Date:** February 03, 2026  
**Status:** Issues Identified

---

## Summary

This document outlines all identified issues with the AI Chat Box and RazorPay Integration features.

---

## AI Chat Box Issues

### 1. OPENAI_API_KEY Not Configured (Critical)
- **Type:** Configuration / Missing Secret
- **Impact:** AI Chat runs in demo mode - cannot generate real content
- **Current Status:** Missing from environment secrets
- **Log Evidence:** 
  ```
  ⚠️ OPENAI_API_KEY not configured. Running in demo mode. 
  Set OPENAI_API_KEY environment variable to enable real generation.
  ```
- **Fix Required:** Add `OPENAI_API_KEY` to secrets

### 2. IDEOGRAM_API_KEY Not Configured (Critical)
- **Type:** Configuration / Missing Secret
- **Impact:** Image generation will fail
- **Current Status:** Missing from environment secrets
- **Location:** `api/src/modules/ai-generation/services/ideogram.service.ts`
- **Fix Required:** Add `IDEOGRAM_API_KEY` to secrets

### 3. TypeScript Error in AIChatBox.tsx (Medium) - FIXED
- **Type:** Code Error
- **Impact:** TypeScript compilation warning
- **Location:** `client/src/components/ai-chat/AIChatBox.tsx` (Line 66)
- **Error:** `Cannot find name 'HistoryItem'`
- **Fix Applied:** Added `HistoryItem` interface to `types.ts` and imported in `AIChatBox.tsx`
- **Status:** ✅ Resolved

### 4. Database Tables Missing (Critical) - FIXED
- **Type:** Database / Schema
- **Impact:** Template seeding fails, application features broken
- **Fix Applied:** Ran `prisma db push` to sync schema with database
- **Status:** ✅ Resolved - All 12 tables created (User, Organization, Template, Infographic, etc.)
- **Verification:** Templates now seeding correctly ("✅ Seeded 5 Real Estate templates")

---

## RazorPay Integration Issues

### 1. RAZORPAY_KEY_ID Not Configured (Critical)
- **Type:** Configuration / Missing Secret
- **Impact:** RazorPay payment initialization will fail
- **Current Status:** Missing from environment secrets
- **Location:** `server/payments/providers/razorpay.provider.ts`
- **Fix Required:** Add `RAZORPAY_KEY_ID` to secrets

### 2. RAZORPAY_KEY_SECRET Not Configured (Critical)
- **Type:** Configuration / Missing Secret
- **Impact:** Cannot create customers, subscriptions, or verify payments
- **Current Status:** Missing from environment secrets
- **Location:** `server/payments/providers/razorpay.provider.ts`
- **Fix Required:** Add `RAZORPAY_KEY_SECRET` to secrets

### 3. Frontend RazorPay Key Not Configured (Critical)
- **Type:** Configuration / Missing Environment Variable
- **Impact:** RazorPay checkout cannot initialize in browser
- **Current Status:** `VITE_RAZORPAY_KEY_ID` not set
- **Location:** `client/src/pages/PricingPage.tsx` (Line 197)
- **Code Reference:**
  ```typescript
  key: import.meta.env.VITE_RAZORPAY_KEY_ID,
  ```
- **Fix Required:** Add `VITE_RAZORPAY_KEY_ID` to environment variables

### 4. RazorPay Plan IDs Not Configured (Critical)
- **Type:** Configuration / Missing Environment Variables
- **Impact:** Cannot create subscriptions for any plan tier
- **Missing Variables:**
  - `RAZORPAY_PLAN_SOLO_MONTHLY`
  - `RAZORPAY_PLAN_SOLO_ANNUAL`
  - `RAZORPAY_PLAN_TEAM_MONTHLY`
  - `RAZORPAY_PLAN_TEAM_ANNUAL`
  - `RAZORPAY_PLAN_BROKERAGE_MONTHLY`
  - `RAZORPAY_PLAN_BROKERAGE_ANNUAL`
- **Note:** These Plan IDs must be created in RazorPay Dashboard first
- **Fix Required:** Create plans in RazorPay and add plan IDs to environment

### 5. RazorPay Webhook Secret Not Configured (High)
- **Type:** Configuration / Missing Secret
- **Impact:** Webhook signature verification will fail
- **Current Status:** `RAZORPAY_WEBHOOK_SECRET` not set
- **Fix Required:** Add `RAZORPAY_WEBHOOK_SECRET` to secrets after configuring webhook in RazorPay Dashboard

---

## Environment Variables Currently Set

| Variable | Status |
|----------|--------|
| SESSION_SECRET | ✅ Set |
| DATABASE_URL | ✅ Set |
| PGDATABASE | ✅ Set |
| PGHOST | ✅ Set |
| PGPORT | ✅ Set |
| PGUSER | ✅ Set |
| PGPASSWORD | ✅ Set |
| OPENAI_API_KEY | ❌ Missing |
| IDEOGRAM_API_KEY | ❌ Missing |
| RAZORPAY_KEY_ID | ❌ Missing |
| RAZORPAY_KEY_SECRET | ❌ Missing |
| RAZORPAY_WEBHOOK_SECRET | ❌ Missing |
| RAZORPAY_PLAN_* | ❌ Missing |
| VITE_RAZORPAY_KEY_ID | ❌ Missing |

---

## Recommended Fix Order

1. **Database:** Run database migrations to create missing tables
2. **AI Chat:** Add `OPENAI_API_KEY` and `IDEOGRAM_API_KEY` secrets
3. **AI Chat Code:** Fix `HistoryItem` TypeScript error
4. **RazorPay:** 
   - Create plans in RazorPay Dashboard
   - Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
   - Add `VITE_RAZORPAY_KEY_ID` for frontend
   - Add plan IDs (`RAZORPAY_PLAN_SOLO_MONTHLY`, etc.)
   - Configure webhook and add `RAZORPAY_WEBHOOK_SECRET`

---

## Additional Notes

- The application has both Stripe and RazorPay payment providers implemented
- RazorPay is used for INR currency, Stripe for USD
- AI generation uses two services: OpenAI (for text/prompts) and Ideogram (for images)
- Database is PostgreSQL (Neon-backed on Replit)

---

---

# Payment Testing Session — February 18, 2026

**Session:** Tasks 1.2 / 1.3 / 1.4 — RazorPay Checkout & E2E Testing  
**Tester:** AI Agent (automated browser + API verification)  
**Plans Tested:** SOLO Monthly, TEAM Monthly  
**Plans Deferred:** BROKERAGE (plan IDs not configured)

---

## Issues Found

### Issue PT-01 — `shortUrl` Redirect Breaks RazorPay Checkout (High) — FIXED

- **Type:** Code Bug
- **Component:** `client/src/pages/PricingPage.tsx` (line ~161)
- **Impact:** RazorPay checkout was completely non-functional. Clicking "Try InfographicAI" opened RazorPay's hosted page (`api.razorpay.com/v1/t/subscriptions/...`) which shows **"Hosted page is not available"** error in test mode.
- **Root Cause:** After `createSubscription` API call, the `onSuccess` handler checked for `data.shortUrl` first and opened it in a new tab. RazorPay's hosted checkout page is unreliable/not available in test mode. The Razorpay JS checkout widget (`openRazorpayCheckout`) is the correct method.
- **Evidence:**
  - Browser navigated to: `https://api.razorpay.com/v1/t/subscriptions/sub_SHdbX5FXFi08U4`
  - Page showed: "Hosted page is not available. Please contact the merchant for further details."
- **Fix Applied:** Removed the `shortUrl` branch in `PricingPage.tsx`. Now always falls through to `openRazorpayCheckout(data)` for RazorPay payments.
  ```typescript
  // Before (broken):
  } else if (data.shortUrl) {
    window.open(data.shortUrl, "_blank");
  } else {
    openRazorpayCheckout(data);
  }

  // After (fixed):
  } else {
    // Always use Razorpay JS checkout widget — shortUrl (hosted page) is unreliable in test mode
    openRazorpayCheckout(data);
  }
  ```
- **Status:** ✅ Fixed

---

### Issue PT-02 — `VITE_RAZORPAY_KEY_ID` Was a Placeholder Value (High) — FIXED

- **Type:** Configuration / Missing Environment Variable
- **Component:** `client/.env.development`
- **Impact:** The Razorpay JS checkout widget would fail to initialize (no valid key). Any payment attempt would show "Payment Error: Payment system is loading. Please try again."
- **Root Cause:** The file contained `VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID` (example placeholder), not the actual test key from the RazorPay Dashboard.
- **Fix Applied:** Updated `client/.env.development` to use the real key:
  ```
  VITE_RAZORPAY_KEY_ID=rzp_test_SA5tbQgdCZziVr
  ```
- **Status:** ✅ Fixed

---

### Issue PT-03 — Previous Subscription Not Cancelled on Plan Change (Medium) — Pending

- **Type:** Business Logic Bug
- **Component:** `api/src/modules/payments/services/payments.service.ts` — `createSubscription()`
- **Impact:** When a user subscribes to a new plan (e.g., TEAM after SOLO), the old subscription is **not cancelled** in RazorPay or in the database. Both subscriptions remain `status=ACTIVE` in the DB. The Organization's `activeSubscriptionId` is updated correctly, but the orphaned subscription continues in RazorPay and may cause unexpected billing.
- **Evidence (DB state after SOLO then TEAM checkout):**
  ```json
  [
    { "planTier": "TEAM", "status": "ACTIVE", "externalSubscriptionId": "sub_SHdkoeskMbIBSc" },
    { "planTier": "SOLO", "status": "ACTIVE", "externalSubscriptionId": "sub_SHdbX5FXFi08U4" }
  ]
  ```
- **Fix Required:** Before creating a new subscription, check for an existing active subscription. If found:
  1. Cancel it in RazorPay via `cancelSubscription(externalSubscriptionId)`
  2. Update DB status to `CANCELLED`
  3. Then create the new subscription
- **Status:** ❌ Pending

---

### Issue PT-04 — Subscription Marked ACTIVE in DB Before Payment Completes (Medium) — Pending

- **Type:** Design Concern / Business Logic
- **Component:** `api/src/modules/payments/services/payments.service.ts` — line ~315
- **Impact:** The `createSubscription` service sets `status: SubscriptionStatus.ACTIVE` and updates `Organization.planTier` and `monthlyLimit` **immediately** when the subscription is created — before the user completes payment in the RazorPay checkout. This means:
  - User gets access to paid plan features before paying
  - If user abandons checkout, an orphaned `ACTIVE` subscription exists in DB
  - No `Payment` record is ever created for the subscription (payment records only come via `subscription.charged` webhook)
  - Multiple incomplete subscriptions accumulate for the same user
- **Evidence:** After clicking "Try InfographicAI" and not completing checkout, DB showed `Subscription.status=ACTIVE` and `Organization.planTier=SOLO/TEAM` with `Payments=[]`.
- **Fix Required (Options):**
  1. Set initial status to `PENDING` and only activate via `subscription.activated` webhook
  2. Or keep current behavior but add a cleanup job to cancel pending subscriptions older than X minutes
- **Status:** ❌ Pending

---

### Issue PT-05 — TEAM Plan Shows ₹1 in Checkout Instead of ₹6,999 (Medium) — Verify

- **Type:** Configuration / RazorPay Plan Setup
- **Component:** RazorPay Dashboard — TEAM Monthly plan (`plan_S9hmdDtMbWLbCc`)
- **Impact:** When the TEAM Monthly checkout widget opened, the "Price Summary" showed **₹1** instead of ₹6,999. This could mean:
  - The plan was created in the RazorPay test dashboard with `amount=100` paise (₹1) instead of `699900` paise (₹6,999)
  - Real users would be charged ₹1 instead of ₹6,999 if plans are not corrected before going live
- **Evidence:** Screenshot of Razorpay checkout widget showing "Price Summary ₹1".
- **Fix Required:** Verify plan amounts in RazorPay Dashboard (Test Mode → Plans). If incorrect, recreate plans with correct amounts and update `.env` plan IDs.
- **Status:** ⚠️ Needs Verification in RazorPay Dashboard

---

### Issue PT-06 — BROKERAGE Plan IDs Not Configured (Low — Deferred)

- **Type:** Configuration / Missing Environment Variables
- **Component:** `.env`
- **Impact:** BROKERAGE plan checkout not testable. `.env` has `RAZORPAY_PLAN_BROKERAGE_MONTHLY=plan_...` and `RAZORPAY_PLAN_BROKERAGE_ANNUAL=plan_...` as placeholders.
- **Fix Required:** Create BROKERAGE plans in RazorPay Dashboard (Test Mode), update `.env` with real plan IDs.
- **Status:** ⏳ Deferred to Next Phase

---

## Test Results Summary

| Test | Result | Notes |
|------|--------|-------|
| 1.2.A SOLO Monthly Checkout — widget opens | ✅ Pass | After PT-01 fix |
| 1.2.A SOLO Monthly — DB Subscription created | ✅ Pass | planTier=SOLO, status=ACTIVE |
| 1.2.A SOLO Monthly — Organization updated | ✅ Pass | planTier=SOLO, monthlyLimit=50 |
| 1.2.B TEAM Monthly Checkout — widget opens | ✅ Pass | After PT-01 fix |
| 1.2.B TEAM Monthly — DB Subscription created | ✅ Pass | planTier=TEAM, status=ACTIVE |
| 1.2.B TEAM Monthly — Organization updated | ✅ Pass | planTier=TEAM, monthlyLimit=200 |
| 1.2.D Annual billing toggle — price discount shown | ⏳ Pending | Not yet tested |
| 1.2.D Annual billing — correct plan ID used | ⏳ Pending | Not yet tested |
| 1.2.E Payment failure card | ⏳ Pending | Requires manual checkout completion |
| 1.3.A Webhook signature verification | ⏳ Pending | Needs zrok tunnel or direct API test |
| 1.3.B–E Webhook events (all 4) | ⏳ Pending | Can test via internal endpoint |
| 1.4.A FREE → SOLO full E2E | ⏳ Pending | |
| 1.4.B SOLO → TEAM upgrade | ⏳ Pending | PT-03 must be fixed first |
| 1.4.C TEAM → SOLO downgrade | ⏳ Pending | |
| 1.4.D Payment failure recovery | ⏳ Pending | |
| 1.4.E Cancel → FREE downgrade | ⏳ Pending | |

---

## Recommended Fix Order (Payment Session)

1. **PT-01** ✅ — Fixed. Razorpay JS checkout widget now used correctly.
2. **PT-02** ✅ — Fixed. Frontend Razorpay key configured.
3. **PT-05** ⚠️ — Verify plan amounts in RazorPay Dashboard before going live.
4. **PT-03** ❌ — Cancel existing subscription before creating new one in `createSubscription()`.
5. **PT-04** ❌ — Set initial subscription status to `PENDING`; activate only via webhook.
6. **PT-06** ⏳ — Create BROKERAGE plans in RazorPay, update `.env`.
