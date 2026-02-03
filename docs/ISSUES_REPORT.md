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
