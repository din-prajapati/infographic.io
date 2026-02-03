# 🚀 MVP 1-Week Launch Plan - Detailed Daily Checklist

> **Goal:** Launch functional MVP in 7 days  
> **Status:** 🟢 **95% Ready** - Only 4 critical tasks remaining (~8-11 hours)  
> **Last Updated:** January 2025

---

## 📋 Executive Summary

### Current Status
- ✅ **Phase 1:** Core Infrastructure - 100% Complete
- ✅ **Phase 2:** Frontend Development - 100% Complete  
- ✅ **Phase 3:** Payment Infrastructure - 67% Complete (Code Ready)
- ⏳ **MVP Critical Tasks:** 4 tasks remaining (~8-11 hours)

### 📚 Quick Reference Guides
- **[RazorPay Setup Guide](RAZORPAY_SETUP_GUIDE.md)** - Complete step-by-step RazorPay account setup, API keys, and plan configuration
- **[RazorPay Webhook Setup Guide](RAZORPAY_WEBHOOK_SETUP_GUIDE.md)** - Webhook configuration and testing guide
- **[MVP vs POST-MVP Breakdown](MVP_VS_POST_MVP_BREAKDOWN.md)** - Detailed task breakdown by release phase

### What's Complete
- ✅ User authentication (login/register)
- ✅ Infographic generation with AI
- ✅ Canvas editor (full functionality)
- ✅ Template system (5 templates)
- ✅ Save/Load designs
- ✅ Export to PNG
- ✅ Payment infrastructure (RazorPay code complete)
- ✅ Subscription management (code complete)
- ✅ Webhook handlers (code complete)

### What's Pending (MVP Critical)
- ⏳ **Payment Testing** (2 tasks, ~3-5 hours)
- ⏳ **Production Deployment Setup** (1 task, ~2-3 hours)
- ⏳ **Critical Path Testing** (1 task, ~2-3 hours)

### 📚 Developer Reference Guides
- **[RazorPay Setup Guide](RAZORPAY_SETUP_GUIDE.md)** - Complete step-by-step RazorPay account setup, API keys, and plan configuration
- **[Payment Integration Guide](payments/PAYMENT_INTEGRATION.md)** - Payment architecture, API reference, and provider details
- **[MVP vs POST-MVP Breakdown](MVP_VS_POST_MVP_BREAKDOWN.md)** - Detailed task breakdown by release phase
- **[Task Tracker](../../TASK_TRACKER.md)** - Complete task tracking and progress overview

---

## 📅 DAY 1-2: Payment Testing (MVP Critical)

**Goal:** Verify RazorPay payment flow works end-to-end  
**Time:** 3-5 hours  
**Priority:** 🔴 CRITICAL - Blocks MVP Launch

### Task 1.1: Test RazorPay Checkout Flow (1-2 hours)

**Location:** `client/src/pages/PricingPage.tsx`, `api/src/modules/payments/`

**Steps:**

### 1. Set up RazorPay Test Account

> **📖 Detailed Guide:** See **[RazorPay Setup Guide](RAZORPAY_SETUP_GUIDE.md)** for complete step-by-step instructions with screenshots guidance, troubleshooting, and all details.

**Quick Checklist:**
- [ ] Create RazorPay account at https://dashboard.razorpay.com/signup
- [ ] Enable Test Mode (toggle in top-right)
- [ ] Generate API Keys (Settings → API Keys → Generate Keys)
  - Copy Key ID (`rzp_test_...`)
  - Copy Key Secret (shown only once!)
- [ ] Create Subscription Plans (Products → Plans → Create Plan):
  - SOLO Monthly: ₹2,999 (`RAZORPAY_PLAN_SOLO`)
  - TEAM Monthly: ₹6,999 (`RAZORPAY_PLAN_TEAM`)
  - BROKERAGE Monthly: ₹24,999 (`RAZORPAY_PLAN_BROKERAGE`)
- [ ] Configure Environment Variables:
  - Backend `.env`: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, Plan IDs
  - Frontend `.env`: `VITE_RAZORPAY_KEY_ID`
- [ ] Restart server and verify no errors

**For detailed instructions, troubleshooting, and verification checklist, see:**  
👉 **[docs/RAZORPAY_SETUP_GUIDE.md](RAZORPAY_SETUP_GUIDE.md)**

2. **Test Checkout Flow for Each Tier**
   - [ ] **SOLO Plan Test:**
     - Navigate to `/pricing`
     - Select SOLO plan
     - Click "Subscribe" button
     - Verify RazorPay checkout modal opens
     - Complete test payment (use test card: `4111 1111 1111 1111`)
     - Verify payment success callback
     - Verify subscription created in database
     - Verify user plan tier updated to SOLO
     - Verify usage limits updated (50/month)
   
   - [ ] **TEAM Plan Test:**
     - Repeat above steps for TEAM plan
     - Verify plan tier updated to TEAM
     - Verify usage limits updated (200/month)
   
   - [ ] **BROKERAGE Plan Test:**
     - Repeat above steps for BROKERAGE plan
     - Verify plan tier updated to BROKERAGE
     - Verify usage limits updated (1000/month)

3. **Test Annual Billing**
   - [ ] Toggle to "Annual" billing
   - [ ] Verify 15% discount applied
   - [ ] Complete test payment
   - [ ] Verify subscription created with annual billing period

4. **Test Payment Failure Scenarios**
   - [ ] Use test card that fails: `4000 0000 0000 0002`
   - [ ] Verify error message displayed
   - [ ] Verify subscription NOT created
   - [ ] Verify user remains on FREE tier

**Acceptance Criteria:**
- ✅ All tier checkout flows work
- ✅ Payment completion updates database correctly
- ✅ Subscription status is ACTIVE after payment
- ✅ Usage limits updated correctly per tier
- ✅ Payment failures handled gracefully
- ✅ Annual discount applied correctly

**Documentation:**
- [ ] Document any issues found
- [ ] Note test card numbers used
- [ ] Record subscription IDs for verification

---

### Task 1.2: Verify RazorPay Webhook Handling (2-3 hours)

**Location:** `server/routes.ts`, `api/src/modules/payments/services/payments.service.ts`

**Steps:**

### 1. Configure Webhook Endpoint in RazorPay Dashboard

> **📖 Detailed Guide:** See **[RazorPay Webhook Setup Guide](RAZORPAY_WEBHOOK_SETUP_GUIDE.md)** for complete step-by-step webhook configuration instructions.

**Quick Checklist:**
- [ ] Log in to RazorPay Dashboard (Test Mode)
- [ ] Navigate to Settings → Webhooks
- [ ] Add webhook URL: `https://your-app.com/api/webhooks/razorpay`
  - **For local testing:** Use ngrok: `ngrok http 5000` → Use ngrok HTTPS URL
- [ ] Select events:
  - `subscription.activated`
  - `subscription.charged`
  - `subscription.cancelled`
  - `payment.failed`
- [ ] Copy webhook secret (starts with `whsec_`)
- [ ] Add to environment variable: `RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx`
- [ ] Restart server and send test webhook from RazorPay Dashboard

**For detailed instructions, troubleshooting, and event details, see:**  
👉 **[docs/RAZORPAY_WEBHOOK_SETUP_GUIDE.md](RAZORPAY_WEBHOOK_SETUP_GUIDE.md)**

2. **Test Webhook Signature Verification**
   - [ ] Verify webhook secret is set: `RAZORPAY_WEBHOOK_SECRET`
   - [ ] Test webhook endpoint receives requests
   - [ ] Verify signature verification works:
     - Valid signature → Process webhook
     - Invalid signature → Reject webhook
   - [ ] Check logs for signature verification results

3. **Test Subscription Activated Webhook**
   - [ ] Trigger subscription activation (complete test payment)
   - [ ] Verify webhook received at `/api/webhooks/razorpay`
   - [ ] Verify webhook handler processes event:
     - Subscription status updated to ACTIVE
     - Invoice created in database
     - Payment record created
   - [ ] Verify database updates:
     ```sql
     SELECT * FROM subscriptions WHERE status = 'ACTIVE';
     SELECT * FROM invoices WHERE subscription_id = '...';
     SELECT * FROM payments WHERE subscription_id = '...';
     ```

4. **Test Subscription Charged Webhook**
   - [ ] Wait for next billing cycle (or trigger manually in RazorPay)
   - [ ] Verify webhook received
   - [ ] Verify handler processes event:
     - New payment record created
     - Invoice updated
     - Usage limits reset (if applicable)

5. **Test Subscription Cancelled Webhook**
   - [ ] Cancel subscription in RazorPay dashboard
   - [ ] Verify webhook received
   - [ ] Verify handler processes event:
     - Subscription status updated to CANCELLED
     - User plan tier downgraded to FREE
     - Usage limits reset to FREE tier (3/month)

6. **Test Payment Failed Webhook**
   - [ ] Trigger payment failure (use failing test card)
   - [ ] Verify webhook received
   - [ ] Verify handler processes event:
     - Payment record created with FAILED status
     - Subscription status updated appropriately
     - User notified (if notification system exists)

**Acceptance Criteria:**
- ✅ Webhook endpoint receives requests
- ✅ Signature verification works correctly
- ✅ All webhook events processed correctly
- ✅ Database updates match webhook events
- ✅ No duplicate processing (idempotency)
- ✅ Error handling for invalid webhooks

**Testing Tools:**
- Use RazorPay Dashboard → Webhooks → Send Test Webhook
- Use ngrok for local testing: `ngrok http 5000`
- Check application logs for webhook processing

**Documentation:**
- [ ] Document webhook event flow
- [ ] Note any webhook processing delays
- [ ] Record webhook secret location

---

## 📅 DAY 3-4: Production Deployment Setup

**Goal:** Set up production environment and deploy  
**Time:** 2-3 hours  
**Priority:** 🔴 CRITICAL - Required for Launch

### Task 2.1: Production Environment Configuration (1-2 hours)

**Steps:**
1. **Environment Variables Setup**
   - [ ] Create production `.env` file (or configure platform secrets)
   - [ ] Set all required variables:
     ```
     # Database
     DATABASE_URL=<production-postgres-url>
     
     # Authentication
     JWT_SECRET=<strong-random-secret>
     SESSION_SECRET=<strong-random-secret>
     
     # AI Services
     OPENAI_API_KEY=<production-key>
     IDEOGRAM_API_KEY=<production-key>
     
     # Payment (RazorPay)
     RAZORPAY_KEY_ID=<live-key>
     RAZORPAY_KEY_SECRET=<live-secret>
     RAZORPAY_WEBHOOK_SECRET=<live-webhook-secret>
     
     # App Config
     NODE_ENV=production
     CLIENT_URL=https://your-domain.com
     API_PORT=3001
     ```
   - [ ] Verify all secrets are set (never commit to git)
   - [ ] Document secret locations

2. **Production Database Setup**
   - [ ] Provision production PostgreSQL database
   - [ ] Run migrations:
     ```bash
     npx prisma migrate deploy
     ```
   - [ ] Verify database connection:
     ```bash
     npx prisma db pull
     ```
   - [ ] Seed initial data (templates):
     ```bash
     npx prisma db seed
     ```
   - [ ] Verify database tables created:
     - Users, Organizations, Templates
     - Subscriptions, Payments, Invoices
     - Infographics, Designs, Conversations

3. **Build Production Bundle**
   - [ ] Install dependencies:
     ```bash
     npm install
     cd api && npm install
     ```
   - [ ] Build frontend:
     ```bash
     npm run build
     ```
   - [ ] Verify build output in `dist/` directory
   - [ ] Test production build locally:
     ```bash
     npm run start
     ```
   - [ ] Verify all pages load correctly
   - [ ] Check for console errors

**Acceptance Criteria:**
- ✅ All environment variables configured
- ✅ Production database connected
- ✅ Migrations applied successfully
- ✅ Production build successful
- ✅ No build errors or warnings
- ✅ Local production build works

---

### Task 2.2: Deploy to Production (1 hour)

**Steps:**
1. **Choose Deployment Platform**
   - [ ] Select platform (Vercel, Netlify, Railway, etc.)
   - [ ] Configure deployment settings
   - [ ] Set environment variables in platform dashboard

2. **Deploy Application**
   - [ ] Push code to production branch
   - [ ] Trigger deployment
   - [ ] Monitor deployment logs
   - [ ] Verify deployment successful

3. **Post-Deployment Verification**
   - [ ] Test production URL loads
   - [ ] Verify API endpoints accessible:
     - `GET /api/v1/templates`
     - `GET /api/v1/infographics`
   - [ ] Test authentication:
     - Register new user
     - Login with credentials
   - [ ] Verify database connection
   - [ ] Check application logs for errors

**Acceptance Criteria:**
- ✅ Application deployed successfully
- ✅ Production URL accessible
- ✅ API endpoints working
- ✅ Authentication working
- ✅ Database connected
- ✅ No critical errors in logs

**Rollback Plan:**
- [ ] Document rollback procedure
- [ ] Keep previous deployment version available
- [ ] Test rollback process

---

## 📅 DAY 5-6: Critical Path Testing

**Goal:** Verify all critical user flows work in production  
**Time:** 2-3 hours  
**Priority:** 🔴 CRITICAL - User Experience

### Task 3.1: End-to-End User Flow Testing (2-3 hours)

**Test Flow 1: User Registration & First Generation**
- [ ] **Registration:**
  - [ ] Navigate to `/auth`
  - [ ] Fill registration form
  - [ ] Submit registration
  - [ ] Verify user created in database
  - [ ] Verify organization created with FREE tier
  - [ ] Verify redirect to home page
  - [ ] Verify user logged in

- [ ] **First Infographic Generation:**
  - [ ] Navigate to generation form
  - [ ] Fill property details
  - [ ] Select AI model
  - [ ] Submit generation request
  - [ ] Verify generation started
  - [ ] Verify status updates in real-time (WebSocket)
  - [ ] Wait for completion
  - [ ] Verify infographic appears in gallery
  - [ ] Verify image URL is accessible
  - [ ] Verify usage count incremented (1/3 for FREE tier)

**Test Flow 2: Payment & Subscription Upgrade**
- [ ] **Upgrade to SOLO Plan:**
  - [ ] Navigate to `/pricing`
  - [ ] Select SOLO plan
  - [ ] Complete RazorPay checkout
  - [ ] Verify payment success
  - [ ] Verify subscription created
  - [ ] Verify plan tier updated to SOLO
  - [ ] Verify usage limits updated (50/month)
  - [ ] Verify subscription card shows SOLO plan

- [ ] **Generate More Infographics:**
  - [ ] Generate 5 more infographics
  - [ ] Verify all complete successfully
  - [ ] Verify usage count increments (6/50)
  - [ ] Verify no limit errors

**Test Flow 3: Canvas Editor & Save/Load**
- [ ] **Create Design:**
  - [ ] Navigate to `/editor`
  - [ ] Add text element
  - [ ] Add shape element
  - [ ] Add image element
  - [ ] Edit properties (colors, fonts, sizes)
  - [ ] Save design
  - [ ] Verify design saved to database
  - [ ] Verify thumbnail generated

- [ ] **Load Design:**
  - [ ] Navigate to `/my-designs`
  - [ ] Click saved design
  - [ ] Verify design loads in editor
  - [ ] Verify all elements restored correctly
  - [ ] Verify properties match saved state

- [ ] **Export Design:**
  - [ ] Click "Export" button
  - [ ] Verify PNG downloads
  - [ ] Verify image quality is good
  - [ ] Verify no UI elements in export

**Test Flow 4: Template Loading**
- [ ] **Load Template from AI Chat:**
  - [ ] Open AI Chat Box
  - [ ] Select category chip
  - [ ] Click prompt suggestion
  - [ ] Click "Generate"
  - [ ] Wait for generation
  - [ ] Click "Use This Design"
  - [ ] Verify template loads in editor
  - [ ] Verify canvas elements restored
  - [ ] Verify can edit template

**Test Flow 5: Cross-Browser Testing**
- [ ] **Chrome:**
  - [ ] Test all flows above
  - [ ] Verify no console errors
  - [ ] Verify responsive design works

- [ ] **Firefox:**
  - [ ] Test all flows above
  - [ ] Verify no Firefox-specific issues
  - [ ] Verify LocalStorage works

- [ ] **Safari:**
  - [ ] Test all flows above
  - [ ] Verify no Safari-specific issues
  - [ ] Verify WebSocket works

**Acceptance Criteria:**
- ✅ All critical flows work end-to-end
- ✅ No data loss or corruption
- ✅ Payment flow works correctly
- ✅ Canvas editor functions properly
- ✅ Cross-browser compatibility verified
- ✅ Performance acceptable (<3s load time)
- ✅ No critical errors in console

**Documentation:**
- [ ] Document any issues found
- [ ] Prioritize issues (Critical/High/Medium/Low)
- [ ] Create GitHub issues for bugs

---

## 📅 DAY 7: Launch Day 🚀

**Goal:** Final checks and launch  
**Time:** 2-3 hours  
**Priority:** 🔴 CRITICAL

### Task 4.1: Pre-Launch Checklist (1 hour)

**Final Verification:**
- [ ] **Code:**
  - [ ] All critical bugs fixed
  - [ ] No console errors
  - [ ] No TypeScript errors
  - [ ] Code committed to git
  - [ ] Production build successful

- [ ] **Infrastructure:**
  - [ ] Production database running
  - [ ] Environment variables set
  - [ ] Webhook endpoints configured
  - [ ] SSL certificate active
  - [ ] Domain configured

- [ ] **Payment:**
  - [ ] RazorPay live keys configured
  - [ ] Webhook secret set
  - [ ] Test payment completed successfully
  - [ ] Subscription activation verified

- [ ] **Monitoring:**
  - [ ] Error tracking configured (Sentry or similar)
  - [ ] Logging configured
  - [ ] Uptime monitoring set up (optional)
  - [ ] Alert notifications configured

- [ ] **Documentation:**
  - [ ] README updated
  - [ ] User guide available (optional)
  - [ ] API documentation accessible
  - [ ] Support email configured

**Acceptance Criteria:**
- ✅ All checklist items completed
- ✅ No blocking issues
- ✅ Ready for launch

---

### Task 4.2: Launch & Monitor (1-2 hours)

**Launch Steps:**
1. **Deploy Final Version**
   - [ ] Push final code to production
   - [ ] Verify deployment successful
   - [ ] Smoke test critical paths

2. **Announce Launch**
   - [ ] Post launch announcement
   - [ ] Share with beta testers
   - [ ] Update social media (if applicable)

3. **Monitor First Hour**
   - [ ] Watch error logs
   - [ ] Monitor user signups
   - [ ] Check payment processing
   - [ ] Verify webhook processing
   - [ ] Respond to any issues immediately

**Acceptance Criteria:**
- ✅ Application live and accessible
- ✅ Users can register
- ✅ Payment processing works
- ✅ No critical errors
- ✅ Performance acceptable

**Post-Launch Tasks:**
- [ ] Monitor for 24 hours
- [ ] Collect user feedback
- [ ] Fix any critical issues
- [ ] Plan next iteration

---

## 📊 MVP Launch Success Criteria

### Technical Requirements
- ✅ All critical user flows work
- ✅ Payment processing functional
- ✅ No critical bugs
- ✅ Performance acceptable (<3s load)
- ✅ Cross-browser compatible
- ✅ Mobile responsive

### Business Requirements
- ✅ Users can register
- ✅ Users can generate infographics
- ✅ Users can upgrade plans
- ✅ Payment processing works
- ✅ Usage limits enforced
- ✅ Subscriptions managed correctly

### User Experience Requirements
- ✅ Intuitive navigation
- ✅ Clear error messages
- ✅ Loading states visible
- ✅ Responsive design
- ✅ Fast page loads

---

## 🚨 Emergency Rollback Plan

### If Critical Bug Found Post-Launch

**Step 1: Assess Severity**
- Is it blocking users?
- How many users affected?
- Can we hotfix?

**Step 2: Decision**
- **Critical & Blocking:** Rollback immediately
- **Critical but Workaround:** Hotfix ASAP
- **Non-Critical:** Fix in next release

**Step 3: Rollback Procedure**
1. Revert to previous deployment
2. Verify rollback successful
3. Fix bug in development
4. Test fix thoroughly
5. Re-deploy

---

## 📝 Post-Launch Monitoring Checklist

### First 24 Hours
- [ ] Monitor error logs every 2 hours
- [ ] Check payment processing
- [ ] Verify webhook processing
- [ ] Monitor user signups
- [ ] Respond to support emails
- [ ] Fix critical issues immediately

### First Week
- [ ] Daily error log review
- [ ] Weekly user feedback review
- [ ] Performance metrics analysis
- [ ] Payment success rate monitoring
- [ ] Plan Release 1.1 features

---

## 🎯 Post-MVP Roadmap

### Release 1.1 (Week 2-3)
- Usage Analytics Dashboard
- Payment Method Management
- Enhanced error handling
- More templates

### Release 1.2 (Month 2)
- Stripe integration activation
- Billing Portal enhancements
- Additional features based on feedback

### Release 2.0 (Month 3-4)
- Phase 4: B2B API Features
- Developer Portal
- API Key Management

---

## 📞 Support & Resources

### Key Contacts
- **Technical Issues:** Check application logs
- **Payment Issues:** RazorPay Dashboard
- **Database Issues:** Check Prisma migrations

### 📚 Documentation References
- **[RazorPay Setup Guide](RAZORPAY_SETUP_GUIDE.md)** - Complete RazorPay account setup instructions
- **[RazorPay Webhook Setup Guide](RAZORPAY_WEBHOOK_SETUP_GUIDE.md)** - Webhook configuration and testing
- **[Payment Integration Guide](payments/PAYMENT_INTEGRATION.md)** - Payment architecture and API reference
- **[MVP vs POST-MVP Breakdown](MVP_VS_POST_MVP_BREAKDOWN.md)** - Task breakdown by release phase
- **[Task Tracker](../TASK_TRACKER.md)** - Complete task tracking and progress

### Useful Links
- RazorPay Dashboard: https://dashboard.razorpay.com
- RazorPay Documentation: https://razorpay.com/docs/
- RazorPay Test Cards: https://razorpay.com/docs/payments/test-cards/
- Application Logs: [Your logging platform]
- Error Tracking: [Your error tracking platform]

---

## ✅ Final Checklist Before Launch

- [ ] All MVP critical tasks completed
- [ ] Payment testing passed
- [ ] Production deployment successful
- [ ] Critical path testing passed
- [ ] No blocking bugs
- [ ] Monitoring configured
- [ ] Support channels ready
- [ ] Launch announcement prepared

---

**Status:** Ready for Launch 🚀  
**Estimated Time:** 8-11 hours over 7 days  
**Confidence Level:** High (95% complete, only testing remaining)

---

*Last Updated: January 2025*  
*Next Review: After MVP Launch*
