# MVP Launch Tracker & Phase-wise Development

> **Purpose:** Consolidated view of MVP pending tasks and phase-wise development including testing
> **Last Updated:** April 10, 2026
> **Status:** MVP ~98% Complete — **3** HUMAN QA tasks remain (critical-path smoke, staging, prod go-live); payment paths signed off in [PAYMENT_TEST_CHECKLIST.md](./PAYMENT_TEST_CHECKLIST.md) **2026-04-10** (trackers aligned — **TC-X-CLOSE-01**)

**Day-by-day verification (code + test steps):** [implementation/1_WEEK_LAUNCH_TRACKER.md](./implementation/1_WEEK_LAUNCH_TRACKER.md)

---

## Executive Summary

### MVP Launch Readiness

| Metric | Value |
|--------|-------|
| **MVP Completion** | **~98%** — payment E2E + webhooks **Done** per [PAYMENT_TEST_CHECKLIST.md](./PAYMENT_TEST_CHECKLIST.md) **2026-04-10** |
| **Pending Tasks** | **3 tasks (all HUMAN)** — critical-path manual test, staging smoke, production go-live |
| **Estimated Effort** | **~3 hours (human tasks only)** |
| **Launch Timeline** | **1 week (7 days)** |

### What's Done vs Pending

| Category | Status | Notes |
|----------|--------|-------|
| Core Infrastructure | ✅ 100% | Auth, routing, API, database |
| Frontend Development | ✅ 100% | UI, canvas editor, AI chat |
| Payment Infrastructure | ✅ 100% | RazorPay code, webhooks, checkout |
| **Test Coverage** | ✅ | Auth + usage-limits + **payments** (see [PAYMENT_AUTOMATED_TESTING.md](./PAYMENT_AUTOMATED_TESTING.md); `test:payments:unit` **20** tests Apr 2026) |
| **AI Chat Bug Fix** | ✅ **NEW** | Close-toggle bug resolved |
| **Payment Testing** | ✅ **Checklist pass** | [PAYMENT_TEST_CHECKLIST.md](./PAYMENT_TEST_CHECKLIST.md) — SOLO/TEAM monthly+annual, webhooks, plan change, failure path, API + unit + E2E automation (**2026-04-10**); **PT-06** BROKERAGE still deferred |
| **Production Setup** | ✅ 100% | CI/CD activated + Railway configured + Sentry DSN set |
| **Critical Path Testing** | ⏳ Pending | HUMAN manual tasks only |
| **Day 1–2: User limit UI** | ✅ Done | **Account → Organization** (`OrganizationScreen`) — members, slots, add-by-email, remove; **full token/email invite** → post-MVP ([ORGANIZATION_INVITE_FLOW.md](./ORGANIZATION_INVITE_FLOW.md)) |

---

## Part 1: MVP Pending Tasks (Launch Blockers)

### 1.1 Tasks Pending for MVP Launch

| # | Task | Effort | Priority | Status | Reference |
|---|------|--------|----------|--------|-----------|
| 1 | **Railway: create project + GitHub secrets** | 2–3 hrs | 🔴 Critical | ✅ Done | Railway configured + Sentry DSN set in `.env` |
| 2 | **PT-05: Verify TEAM plan paise in RazorPay** | 15 min | 🟡 Medium | ✅ Done | RazorPay Dashboard confirms ₹6,999 / 699900 paise |
| 3 | **RazorPay checkout E2E (SOLO, TEAM, Annual)** | 1 hr | 🔴 Critical | ✅ Done | [PAYMENT_TEST_CHECKLIST.md](./PAYMENT_TEST_CHECKLIST.md) — **F-PAY-SOLO-M/A**, **F-PAY-TEAM-M/A** signed off **Apr 7–10, 2026** |
| 4 | **Webhook tunnel setup + verify 4 events** | 1.5 hrs | 🔴 Critical | ✅ Done | Same — live Razorpay webhooks via tunnel; **`subscription.charged`** / cancel / verify paths **2026-04-10** |
| 5 | **Critical-path manual test (10 flows)** | 2 hrs | 🔴 Critical | ⏳ Pending | [1_WEEK_LAUNCH_PLAN.md](./implementation/1_WEEK_LAUNCH_PLAN.md) |
| 6 | **Staging deploy smoke test** | 30 min | 🔴 Critical | ⏳ Pending | CI/CD |
| 7 | **Production go-live + Sentry verify** | 30 min | 🔴 Critical | ⏳ Pending (blocked by #6) | CI/CD |

**Total MVP Pending:** 3 HUMAN tasks | ~3 hours

---

### 1.2 Known Issues to Fix Before/During MVP

| Issue ID | Description | Severity | Status | Fix Location |
|----------|-------------|----------|--------|--------------|
| **PT-03** | Previous subscription not cancelled on plan change (SOLO→TEAM) | Medium | ✅ Fixed | `payments.service.ts` — `createSubscription()` |
| **PT-04** | Subscription marked ACTIVE before payment completes | Medium | ✅ Fixed | `payments.service.ts` — status=PENDING until webhook fires |
| **PT-05** | TEAM plan shows ₹1 instead of ₹6,999 in checkout | Medium | ✅ Verified | RazorPay Dashboard confirms ₹6,999 / 699900 paise — correct |
| **PT-06** | BROKERAGE plan IDs not configured | Low | ⏳ Deferred | Create plans in RazorPay, update `.env` |

---

### 1.3 Environment & Config Prerequisites

| Variable | Purpose | Status |
|----------|---------|--------|
| `DATABASE_URL` | PostgreSQL connection | Required |
| `JWT_SECRET` | Auth tokens | Required |
| `RAZORPAY_KEY_ID` | RazorPay backend | Required |
| `RAZORPAY_KEY_SECRET` | RazorPay backend | Required |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification | Required |
| `RAZORPAY_PLAN_SOLO_MONTHLY` | SOLO plan | Required |
| `RAZORPAY_PLAN_SOLO_ANNUAL` | SOLO annual | Required |
| `RAZORPAY_PLAN_TEAM_MONTHLY` | TEAM plan | Required |
| `RAZORPAY_PLAN_TEAM_ANNUAL` | TEAM annual | Required |
| `VITE_RAZORPAY_KEY_ID` | Frontend checkout | Required (root or `client/.env.development`) |
| `SENTRY_DSN` | Backend error tracking | Required |
| `VITE_SENTRY_DSN` | Frontend error tracking | Required |
| `OPENAI_API_KEY` | AI text generation | Required for AI Chat |
| `IDEOGRAM_API_KEY` | Image generation | Required for AI Chat |

**Verification:** Run `node scripts/verify-payment-prerequisites.js` or `npm run verify:payment-prereqs`

---

## Part 2: Phase-wise Development Tracker

### Phase Overview

| Phase | Focus | Status | Tasks | Effort | Timeline |
|-------|-------|--------|-------|--------|----------|
| **Phase 0** | MVP Launch (Critical) | 🔄 **75%** (9/12 tasks) | 12 | ~**3** hrs human remaining | Week 1 |
| **Phase 1** | Post-MVP Release 1.1 | ⏳ 0% | 5 | ~15–20 hrs | Week 2–3 |
| **Phase 2** | Post-MVP Release 1.2 | ⏳ 0% | 5–7 | ~14–28 hrs | Month 2 |
| **Phase 3** | Post-MVP Release 1.3 | ⏳ 0% | 8 | ~30–40 hrs | Month 3 |
| **Phase 4** | B2B API (Release 2.0) | ⏳ 0% | 20 | ~85–125 hrs | Month 3–4 |
| **Phase 5** | Analytics & Optimization | ⏳ 0% | 17 | ~110–170 hrs | Month 5–6 |
| **Phase 6** | Production Hardening | ⏳ 0% | 45+ | ~150–230 hrs | Month 7+ |

---

### Phase 0: MVP Launch (Week 1)

**Goal:** Launch functional MVP in 7 days
**Status:** 3 HUMAN tasks remaining (9 tasks completed — **0.8** / **0.9** payment QA **Done** **2026-04-10**)

#### Task Breakdown

| Task | Description | Type | Owner | Status |
|------|-------------|------|-------|--------|
| 0.1 | Railway: create project + GitHub secrets | Setup | HUMAN | ✅ Done |
| 0.2 | Activate Railway CLI deploy in `deploy.yml` | Dev | AI | ✅ Done |
| 0.3 | `SENTRY_DSN` / `VITE_SENTRY_DSN` in `.env.example` | Config | AI | ✅ Done (pre-existed) |
| 0.4 | PT-05: Verify TEAM plan = 699900 paise in RazorPay | Verify | HUMAN | ✅ Done — ₹6,999 confirmed in dashboard |
| 0.5 | Fix AI chat close-toggle bug (`AIChatBox.tsx`) | Dev | AI | ✅ Done |
| 0.6 | Auth unit tests (15 tests, 25 total passing) | Testing | AI | ✅ Done |
| 0.7 | Usage-limits integration tests (8 tests, 12 total) | Testing | AI | ✅ Done |
| 0.8 | RazorPay checkout E2E (SOLO, TEAM, Annual) | Testing | HUMAN | ✅ Done — [PAYMENT_TEST_CHECKLIST.md](./PAYMENT_TEST_CHECKLIST.md) **Apr 2026** |
| 0.9 | Webhook tunnel setup + verify 4 events | Testing | HUMAN | ✅ Done — tunnel + live events per checklist **2026-04-10** |
| 0.10 | Critical-path manual test (10 flows) | Testing | HUMAN | ⏳ Pending |
| 0.11 | Staging deploy smoke test | Deploy | HUMAN | ⏳ Pending (after **0.10** + Railway deploy readiness) |
| 0.12 | Production go-live + Sentry verify | Deploy | HUMAN | ⏳ Pending (blocked by 0.11) |

---

### Phase 1: Release 1.1 (Week 2–3)

**Focus:** Usage Analytics & Payment Enhancements
**Effort:** ~15–20 hours

| # | Task | Type | Effort | Status |
|---|------|------|--------|--------|
| 1.1 | Monthly Usage Chart | Dev | 4–6 hrs | ⏳ |
| 1.2 | Cost Breakdown by AI Model | Dev | 3–4 hrs | ⏳ |
| 1.3 | Usage Alerts | Dev | 2–3 hrs | ⏳ |
| 1.4 | Payment Method Management UI | Dev | 4–6 hrs | ⏳ |
| 1.5 | Unit tests for usage analytics | Testing | 2–3 hrs | ⏳ |

---

### Phase 2: Release 1.2 (Month 2)

**Focus:** Stripe Activation, Billing Portal, Quality Improvements
**Effort:** ~20–28 hours

| # | Task | Type | Effort | Status |
|---|------|------|--------|--------|
| 2.1 | Stripe Account Setup | Setup | 1 hr | ⏳ |
| 2.2 | Test Stripe Checkout | Testing | 1–2 hrs | ⏳ |
| 2.3 | Billing Portal UI | Dev | 6–8 hrs | ⏳ |
| 2.4 | Historical Usage Reports | Dev | 4–6 hrs | ⏳ |
| 2.5 | Export Usage Data | Dev | 2–3 hrs | ⏳ |
| 2.6 | Multi-pass AI Refinement | Dev | 4–6 hrs | ⏳ |
| 2.7 | Quality Scoring System | Dev | 2–3 hrs | ⏳ |

---

### Phase 3: Release 1.3 (Month 3)

**Focus:** Speed Optimization, Batch Processing, Advanced Features
**Effort:** ~30–40 hours

| # | Task | Type | Effort | Status |
|---|------|------|--------|--------|
| 3.1 | Intelligent Caching | Dev | 4–6 hrs | ⏳ |
| 3.2 | Template Pre-rendering | Dev | 4–6 hrs | ⏳ |
| 3.3 | Progressive Generation UI | Dev | 4–6 hrs | ⏳ |
| 3.4 | Batch CSV/Excel Upload | Dev | 4–6 hrs | ⏳ |
| 3.5 | Parallel Processing & Queue | Dev | 4–6 hrs | ⏳ |
| 3.6 | Volume-based Pricing | Dev | 8–10 hrs | ⏳ |

---

### Phase 4: B2B API (Release 2.0) — Month 3–4

**Focus:** API Key Management, Webhooks, Developer Portal
**Effort:** ~85–125 hours

| # | Task | Type | Effort | Status |
|---|------|------|--------|--------|
| 4.1 | API Key Generation UI | Dev | 4–6 hrs | ⏳ |
| 4.2 | Key Rotation/Regeneration | Dev | 3–4 hrs | ⏳ |
| 4.3 | Key Permissions & Scoping | Dev | 4–6 hrs | ⏳ |
| 4.4 | Rate Limiting per API Key | Dev | 4–6 hrs | ⏳ |
| 4.5 | API Key Usage Analytics | Dev | 4–6 hrs | ⏳ |
| 4.6 | Webhook Configuration UI | Dev | 6–8 hrs | ⏳ |
| 4.7 | Webhook Delivery & Retries | Dev | 6–8 hrs | ⏳ |
| 4.8 | Developer Portal | Dev | 37–56 hrs | ⏳ |

---

### Phase 5: Analytics & Optimization (Release 2.1) — Month 5–6

**Focus:** Admin Dashboard, Performance, AI Optimization
**Effort:** ~110–170 hours

| # | Task | Type | Effort | Status |
|---|------|------|--------|--------|
| 5.1 | Admin Dashboard | Dev | 48–68 hrs | ⏳ |
| 5.2 | Performance Optimization | Dev | 38–58 hrs | ⏳ |
| 5.3 | AI Model Optimization | Dev | 32–48 hrs | ⏳ |

---

### Phase 6: Production Hardening (Release 2.2) — Month 7+

**Focus:** Security, Testing, Code Quality, Mobile
**Effort:** ~200–300 hours

| # | Task | Type | Effort | Status |
|---|------|------|--------|--------|
| 6.1 | Code Quality & Documentation | Dev | 60–90 hrs | ⏳ |
| 6.2 | Production Hardening | Dev | 70–110 hrs | ⏳ |
| 6.3 | Unit/Integration/E2E Tests | Testing | 50–70 hrs | ⏳ |
| 6.4 | Mobile App (optional) | Dev | 70–100 hrs | ⏳ |

---

## Part 3: Testing Tracker

**Testing source of truth:** [PAYMENT_TEST_CHECKLIST.md](./PAYMENT_TEST_CHECKLIST.md) (**40** TC rows **Pass**, **2026-04-10** close-out) · Automation runbook [PAYMENT_AUTOMATED_TESTING.md](./PAYMENT_AUTOMATED_TESTING.md).

### MVP Testing (Phase 0)

| Test ID | Test Area | Status | Notes |
|---------|-----------|--------|-------|
| T0.1 | Payment unit tests | ✅ Done | **`payments.service.spec.ts`** — **20** tests (`npm run test:payments:unit`); see runbook |
| T0.2 | Payment integration tests | ✅ Done | `api/tests/payments/payments.service.integration.spec.ts` (4 tests) |
| T0.3 | Auth unit tests | ✅ Done | 15 tests — `api/tests/auth/auth.service.spec.ts` |
| T0.4 | Usage-limits integration | ✅ Done | 8 tests — `api/tests/infographics/usage-limits.integration.spec.ts` |
| T0.5 | RazorPay checkout (SOLO/TEAM × M/A) | ✅ Done | [PAYMENT_TEST_CHECKLIST.md](./PAYMENT_TEST_CHECKLIST.md) **F-PAY-SOLO-M/A**, **F-PAY-TEAM-M/A** — **BROKERAGE** deferred **PT-06** |
| T0.6 | Webhook handling (manual + automation) | ✅ Done | Tunnel + live events **2026-04-10**; **`npm run test:payment`** HMAC valid/invalid |
| T0.7 | Critical Path E2E (10 flows) | ⏳ Pending | HUMAN — [1_WEEK_LAUNCH_PLAN.md](./implementation/1_WEEK_LAUNCH_PLAN.md) Day 3–4 **Task 2.1** (non-payment app flows) |

### Post-MVP Testing (Phases 1–6)

| Phase | Test Type | Scope | Effort |
|-------|-----------|-------|--------|
| 1.1 | Unit | Usage analytics | 2–3 hrs |
| 2.1 | Integration | Stripe checkout | 1–2 hrs |
| 4.x | Integration | API key, webhooks | 12–16 hrs |
| 6.x | Unit | Services, controllers | 16–24 hrs |
| 6.x | Integration | API endpoints | 12–16 hrs |
| 6.x | E2E | Full user flows | 22–32 hrs |

---

## Part 4: Next Phase Features (Post-MVP Backlog)

From [NEXT_PHASE_DEVELOPMENT.md](./NEXT_PHASE_DEVELOPMENT.md):

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 1 | PDF & Print Export | 1–2 wks | High |
| 2 | Team Workspace UI | 2–3 wks | High |
| 3 | Invite Flow UI | 1 wk | High |
| 4 | Multi-Agent Workspace | 2–3 wks | Medium |
| 5 | Share/Publish Buttons | 1–2 days | Low |
| 6 | Advanced Analytics | 1–2 wks | Medium |

---

## Quick Reference

### MVP Launch Checklist

- [x] CI/CD deploy steps activated (`deploy.yml`)
- [x] Auth unit tests written (15+ in `auth.service.spec.ts`; full suite per `api` test run)
- [x] Usage-limits integration tests written (8 tests)
- [x] AI chat close-toggle bug fixed
- [x] PT-03 fixed (`payments.service.ts` `createSubscription()`)
- [x] PT-04 fixed (status=PENDING until webhook fires)
- [x] Run `node scripts/verify-payment-prerequisites.js` (or `npm run verify:payment-prereqs`)
- [x] Railway project + GitHub secrets set up
- [x] Test RazorPay checkout (SOLO, TEAM, monthly + annual) — [PAYMENT_TEST_CHECKLIST.md](./PAYMENT_TEST_CHECKLIST.md) **2026-04-10**
- [x] Verify webhook handling (tunnel + Dashboard + automated HMAC) — same checklist
- [x] Verify PT-05 (TEAM plan ₹6,999 confirmed in RazorPay Dashboard)
- [ ] Staging deploy smoke test
- [ ] Production go-live + Sentry verify
- [ ] Critical-path manual test (10 flows) — launch plan **Task 2.1**

### Document References

| Document | Purpose |
|----------|---------|
| [PAYMENT_TEST_CHECKLIST.md](./PAYMENT_TEST_CHECKLIST.md) | RazorPay testing steps |
| [PAYMENT_AUTOMATED_TESTING.md](./PAYMENT_AUTOMATED_TESTING.md) | Automated payment/webhook test runbook |
| [1_WEEK_LAUNCH_PLAN.md](./implementation/1_WEEK_LAUNCH_PLAN.md) | Day-by-day MVP plan |
| [1_WEEK_LAUNCH_TRACKER.md](./implementation/1_WEEK_LAUNCH_TRACKER.md) | Launch-week verification vs plan |
| [ISSUES_REPORT.md](./ISSUES_REPORT.md) | Known issues (**PT-xx**, **RZ-xx**, etc.) |
| [NEXT_PHASE_DEVELOPMENT.md](./NEXT_PHASE_DEVELOPMENT.md) | Post-MVP backlog (incl. §6 org invite) |
| [ORGANIZATION_INVITE_FLOW.md](./ORGANIZATION_INVITE_FLOW.md) | Draft full org invite (post-MVP) |
| [TASK_TRACKER.md](../TASK_TRACKER.md) | Full task tracker |

---

*Last Updated: April 10, 2026*
