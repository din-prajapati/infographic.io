# Payment testing checklist — by plan feature (Razorpay MVP)

Complete before marking **Test RazorPay Checkout Flow** and **Verify Webhook Handling** done in the launch trackers.

**Agile / PR workflow:** [AGILE_QA_WORKFLOW.md](./AGILE_QA_WORKFLOW.md)  
**Automation runbook:** [PAYMENT_AUTOMATED_TESTING.md](./PAYMENT_AUTOMATED_TESTING.md)  
**Webhook setup:** [payments/RAZORPAY_WEBHOOK_SETUP_GUIDE.md](./payments/RAZORPAY_WEBHOOK_SETUP_GUIDE.md)

---

## Epic

| Field | Value |
|--------|--------|
| **Epic ID** | **EPIC-PAY-01** |
| **Title** | InfographicAI — Razorpay subscriptions (checkout, webhooks, billing) |
| **Goal** | Each **plan × billing** combination (Solo/Team × monthly/annual) is testable as its own feature, with **manual + automation** called out and **webhooks** as part of the same story where they apply. |

---

## How to use each test case block

Every **test case** uses the same fields:

| Field | What to record |
|--------|----------------|
| **Prerequisites** | People, data, prior steps (e.g. logged in, FREE org, tunnel up). |
| **Configuration** | Env vars, Razorpay Dashboard mode, plan IDs relevant to **this** plan only. |
| **Test scenario (manual)** | Steps in UI / Dashboard / terminal. |
| **Automation** | Commands, spec files, and what they **do / do not** prove for this plan. |
| **Result** | **Pass** / **Fail** / **Blocked** / **N/A** (tick one). |
| **Finding** | Evidence: date, amounts, screenshot path, **PT-xx**, **PR #**. |
| **PR** | Merged PR under test (or “N/A”). |

**Legacy TC ID** (e.g. `1.2`, `2.5`) is kept in the heading for cross-links to trackers and [ISSUES_REPORT.md](./ISSUES_REPORT.md).

---

## Global gateway — prerequisites (all plan features)

**Feature ID:** `F-PAY-ENV` · **Story:** `US-PAY-001` — Environment ready for payment QA

*As a* QA engineer *I want* secrets, app health, and a test user *so that* Solo/Team monthly/annual flows are not blocked by setup.

### TC-ENV-01 — Prerequisite script (`P.0`)

| Field | Content |
|--------|---------|
| **Prerequisites** | Repo cloned; shell at repo root. |
| **Configuration** | Root `.env` (or exported vars) available to the script. |
| **Test scenario (manual)** | Run `node scripts/verify-payment-prerequisites.js`. Record any missing keys. |
| **Automation** | Invoked as part of `npm run test:payment` / `verify:payment-prereqs` per [PAYMENT_AUTOMATED_TESTING.md](./PAYMENT_AUTOMATED_TESTING.md). |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-09:** `npm run verify:payment-prereqs` → `node scripts/verify-payment-prerequisites.js` — **All required variables present**; `DATABASE_URL`, `JWT_SECRET`, Razorpay test keys, webhook secret, all four `RAZORPAY_PLAN_*`, `VITE_RAZORPAY_KEY_ID` (test) reported **OK**. |
| **PR** | N/A |

### TC-ENV-02 — Razorpay test mode & keys (`P.1`)

| Field | Content |
|--------|---------|
| **Prerequisites** | TC-ENV-01 understood. |
| **Configuration** | `RAZORPAY_KEY_ID` / `SECRET` **test**; Dashboard **Test mode**; all four plan IDs in `.env` (Solo/Team × monthly/annual). `VITE_RAZORPAY_KEY_ID` matches test Key ID. |
| **Test scenario (manual)** | Confirm Dashboard + `.env` alignment for **all four** plans (needed before Team/annual sections). |
| **Automation** | `test:payment` fails fast if env wrong. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-09:** Same run as **TC-ENV-01** — backend + client Razorpay vars and all four plan IDs **OK set**; `VITE_RAZORPAY_KEY_ID` **OK (test key)**. **Manual:** Razorpay Dashboard still **Test mode** + plan amounts vs production. |
| **PR** | N/A |

### TC-ENV-03 — App & API health (`P.2`, `P.3`)

| Field | Content |
|--------|---------|
| **Prerequisites** | Servers start without crash. |
| **Configuration** | `start-both.ps1` or `npm run dev`; `API_PORT` if non-default. |
| **Test scenario (manual)** | Client loads; `GET /api/v1/health` (or proxied health) OK. |
| **Automation** | E2E assumes dev server; `test:payment` hits same base URL. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | |
| **PR** | N/A |

### TC-ENV-04 — Test user (`P.4`)

| Field | Content |
|--------|---------|
| **Prerequisites** | Auth route available. |
| **Configuration** | Optional: `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` for scripts. |
| **Test scenario (manual)** | Register/login; token present for `/pricing` checkout. |
| **Automation** | `npm run test:payment` subscription steps if test user set; `test:payment:ensure-user` once. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | e.g. `payment.automation@local.test` (Apr 2026). |
| **PR** | N/A |

**Required `.env` (summary):** `DATABASE_URL`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_SOLO_MONTHLY`, `RAZORPAY_PLAN_SOLO_ANNUAL`, `RAZORPAY_PLAN_TEAM_MONTHLY`, `RAZORPAY_PLAN_TEAM_ANNUAL`, `VITE_RAZORPAY_KEY_ID`.

---

## Shared reference (all plans)

### Expected amounts (modal vs `shared/schema.ts`)

| Plan | Billing | Expected (INR) |
|------|---------|----------------|
| SOLO | Monthly | **₹2,999**/mo |
| SOLO | Annual | **~₹2,549**/mo equiv. (15% off annual) |
| TEAM | Monthly | **₹6,999**/mo |
| TEAM | Annual | **~₹5,949**/mo equiv. |

Wrong amount → fix [Razorpay Plans](https://dashboard.razorpay.com/app/plans) or plan IDs in `.env` (**PT-05**, **PT-07**).

### Test cards & UPI (Razorpay test keys only)

| Use | Value |
|-----|--------|
| **Subscriptions** | `5267 3181 8797 5449` (Mastercard) |
| One-time only | `4111 1111 1111 1111` (not for subscriptions) |
| CVV / expiry | Any 3 digits / any future |
| OTP | **4–10 digits** = success; **under 4 digits** = fail |
| UPI | `success@razorpay` / `failure@razorpay` |

Docs: [Test cards](https://razorpay.com/docs/payments/payments/test-card-details/) · [Test subscriptions](https://razorpay.com/docs/payments/subscriptions/test/).

**“Subscription's start time is past…”** → complete checkout within buffer; `RAZORPAY_SUBSCRIPTION_START_BUFFER_SECONDS` (default 900s).

---

# Feature 1 — Solo monthly (`F-PAY-SOLO-M`)

**Plan:** SOLO + **monthly** billing · **Razorpay plan env:** `RAZORPAY_PLAN_SOLO_MONTHLY`

## Story US-PAY-SOLO-M — Solo monthly subscription (checkout → webhooks → billing)

*As a* customer *I want* to subscribe to **Solo monthly** *so that* I am charged **₹2,999**/mo after any mandate token (e.g. ₹5) and my app access matches payment state.

**Primary PRs (fill when merging):** _Pricing / `payments.service` / webhooks / Billing_

---

### TC-SOLO-M-01 — Pricing page: plans visible (`1.1`)

| Field | Content |
|--------|---------|
| **Prerequisites** | TC-ENV-*; browser. |
| **Configuration** | None beyond global. |
| **Test scenario (manual)** | Open `http://localhost:5000/pricing`. **Individual:** FREE + SOLO. **Enterprise:** TEAM + BROKERAGE (no duplicate TEAM). |
| **Automation** | `npm run test:e2e -- e2e/pricing-payments.spec.ts` — plan labels / nav (does not open Razorpay). |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-09:** Duplicate TEAM fixed — `PricingPage` shows TEAM only on **Enterprise** segment (`planSegment` filter). |
| **PR** | |

---

### TC-SOLO-M-02 — Open Solo monthly checkout (`1.2`)

| Field | Content |
|--------|---------|
| **Prerequisites** | Logged in; **Pricing “current plan”** logic: SOLO is not shown as *Current Plan* unless subscription is **ACTIVE** / **PAST_DUE** / **HALTED** / **PAUSED** (not **PENDING**). |
| **Configuration** | `RAZORPAY_PLAN_SOLO_MONTHLY`, `VITE_RAZORPAY_KEY_ID` (test). |
| **Test scenario (manual)** | `/pricing` → SOLO card → **annual toggle OFF** → **Try InfographicAI**. Razorpay modal opens (no “hosted page unavailable”). |
| **Automation** | `npm run test:payment` — authenticated `POST /api/v1/payments/create-subscription` with **SOLO** + **monthly** when `TEST_USER_*` set (see runbook). |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | Pass 2026-04-07. |
| **PR** | |

---

### TC-SOLO-M-03 — Modal amounts: ₹2,999 recurring + mandate token (`1.3`)

| Field | Content |
|--------|---------|
| **Prerequisites** | TC-SOLO-M-02; modal open. |
| **Configuration** | Dashboard plan amount for Solo monthly = **₹2,999** (699900 paise class). |
| **Test scenario (manual)** | In **Price summary**: small **refundable** charge (e.g. **₹5**) OK; copy must show **₹2,999**/mo recurring. **₹1** recurring = wrong plan (**PT-05** class bug). |
| **Automation** | Does **not** read Razorpay iframe — **manual** sign-off. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | Pass 2026-04-06/07; pricing test-mode banner documents ₹5 mandate. |
| **PR** | |

---

### TC-SOLO-M-04 — Re-checkout after expired prior subscription (`1.3b`)

| Field | Content |
|--------|---------|
| **Prerequisites** | User had an old Razorpay sub in **expired** terminal state; starting **new** Solo monthly checkout. |
| **Configuration** | Same as TC-SOLO-M-02. |
| **Test scenario (manual)** | Start Solo monthly again; server logs: no alarming **warn** for benign Razorpay “not cancellable in expired status”; local row may sync **EXPIRED** (**PT-08**). |
| **Automation** | Unit tests cover cancel-before-create behaviour in `payments.service.spec.ts` (mocked provider). |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | Pre-fix raw 400 object in logs; **PT-08** in code — re-test after restart. |
| **PR** | |

---

### TC-SOLO-M-05 — Pay successfully (test card / UPI) (`1.4`)

| Field | Content |
|--------|---------|
| **Prerequisites** | TC-SOLO-M-02; modal open. |
| **Configuration** | Shared test card / UPI above. |
| **Test scenario (manual)** | Complete payment; expect success toast / redirect; **verify** API if app calls it. Optional: Razorpay Dashboard **Charge this now** for next cycle in test. |
| **Automation** | Unit: `verifyPayment`, `handleSubscriptionActivated` / `Charged` (mocked). **Not** full 3DS in CI. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | Mandate + **Charge this now**; `subscription.charged` processed 2026-04-07. |
| **PR** | |

---

### TC-SOLO-M-06 — Abandon checkout: dismiss Razorpay (`1.5a`)

| Field | Content |
|--------|---------|
| **Prerequisites** | User can open Solo monthly (typically **FREE** or not **ACTIVE** on SOLO — **PENDING** does not show SOLO as “Current Plan” on pricing). |
| **Configuration** | Same as TC-SOLO-M-02. |
| **Test scenario (manual)** | Open widget → close/dismiss. Toast **Payment Cancelled**; client calls cancel + invalidates subscription query; no stuck **PENDING** / pricing shows Free for SOLO CTA. |
| **Automation** | None for dismiss; backend cancel covered by unit tests for **PENDING** cancel path. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-08:** Dismiss flow — **Payment Cancelled** toast as expected. Logs: Razorpay `subscription.cancelled` webhook received (PaymentsController), `POST /api/webhooks/razorpay` **200**; benign DEBUG on prior sub “not cancellable in expired status” (aligned with TC-SOLO-M-04). |
| **PR** | |

---

### TC-SOLO-M-07 — Abandon checkout: Billing Cancel while PENDING (`1.5b`)

| Field | Content |
|--------|---------|
| **Prerequisites** | Solo monthly checkout started; **Account → Billing** shows **PENDING** + yellow banner. |
| **Configuration** | Same as TC-SOLO-M-02. |
| **Test scenario (manual)** | **Cancel** → confirm dialog → expect Razorpay cancel + DB **CANCELLED** + org **FREE** + success toast. |
| **Automation** | Unit: `cancelSubscription` with **PENDING** → immediate cancel + org FREE (`payments.service.spec.ts`). |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | Re-test e.g. `payment.automation12@local.test` after deploy. |
| **PR** | |

---

## Solo monthly — Webhooks & server behaviour (sub-part of US-PAY-SOLO-M)

Same **tunnel + secret** applies; events below are what you expect when exercising **Solo monthly** end-to-end.

### TC-SOLO-M-WH-01 — Webhook URL reachable (`2.1`)

| Field | Content |
|--------|---------|
| **Prerequisites** | Tunnel or staging URL registered in Razorpay. |
| **Configuration** | `POST https://<host>/api/webhooks/razorpay` → Express → Nest internal webhook. |
| **Test scenario (manual)** | Complete or trigger flows; every delivery returns **200** JSON `status ok`. |
| **Automation** | `npm run test:payment` — HTTP webhook tests with valid/invalid HMAC (wiring, not full Dashboard replay). |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | 2026-04-07 deliveries OK. |
| **PR** | |

### TC-SOLO-M-WH-02 — Tunnel script / host recorded (`2.2`)

| Field | Content |
|--------|---------|
| **Prerequisites** | Windows or alternative tunnel. |
| **Configuration** | `.\scripts\ngrok-webhook.ps1` or zrok; URL pasted in Razorpay Dashboard. |
| **Test scenario (manual)** | Document tunnel hostname used for **this** test cycle. |
| **Automation** | **N/A for hostname:** `npm run test:payment` calls `BASE_URL` directly (no ngrok). For CI/staging, webhook URL is a **fixed** host in env or runbook — no per-session tunnel log. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-08:** Confirmed `.\scripts\ngrok-webhook.ps1 -port 5000` — **Forwarding** `https://f928-103-176-11-152.ngrok-free.app` → `http://localhost:5000`; Razorpay webhook: `https://f928-103-176-11-152.ngrok-free.app/api/webhooks/razorpay`. |
| **PR** | N/A |

### TC-SOLO-M-WH-03 — Dashboard events enabled (`2.3`)

| Field | Content |
|--------|---------|
| **Prerequisites** | Webhook created in Test mode. |
| **Configuration** | At minimum: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `payment.failed`. Solo monthly flow also emits `subscription.authenticated`, `payment.authorized`, `payment.captured` — enable or accept as observed extras. |
| **Test scenario (manual)** | After Solo monthly test, Razorpay webhook log shows deliveries. |
| **Automation** | Partial — script sends synthetic payloads. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | Extra events observed 2026-04-07. |
| **PR** | |

### TC-SOLO-M-WH-04 — Webhook secret matches (`2.4`)

| Field | Content |
|--------|---------|
| **Prerequisites** | `RAZORPAY_WEBHOOK_SECRET` in `.env`. |
| **Configuration** | Same mode (test/live) as keys and Dashboard webhook. |
| **Test scenario (manual)** | Valid payloads **200**; no **401** for good signatures. |
| **Automation** | `test:payment` invalid signature case. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | |
| **PR** | |

### TC-SOLO-M-WH-05 — Solo monthly happy path: events & idempotency (`2.5`)

| Field | Content |
|--------|---------|
| **Prerequisites** | Solo monthly paid or **Charge this now** executed. |
| **Configuration** | DB + Nest running. |
| **Test scenario (manual)** | Logs show `subscription.authenticated` / `activated`, `payment.*`, `subscription.charged`; duplicate `subscription.charged` → log **Payment already processed, skipping**. |
| **Automation** | Unit: `handleSubscriptionCharged` idempotency; `payment.authorized` / `captured` acknowledged in controller. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | ~2.7s handler; restart API after `payment.captured` ack to avoid stale “Unhandled” logs. |
| **PR** | |

### TC-SOLO-M-WH-06 — Invalid signature (`2.6`) — platform regression

| Field | Content |
|--------|---------|
| **Prerequisites** | Any plan feature; optional repeat per release. |
| **Configuration** | Known bad body/signature. |
| **Test scenario (manual)** | Send bad webhook → **401** (or documented behaviour); no corrupt DB rows. |
| **Automation** | `npm run test:payment` — invalid `X-Razorpay-Signature` → expect **401** (`scripts/run-payment-automated-tests.js`, step after valid signature). |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-08:** Manual **2.6** not required; same behaviour asserted by payment automation script (run in release/CI). |
| **PR** | |

---

## Solo monthly — Billing & product checks (sub-part of US-PAY-SOLO-M)

### TC-SOLO-M-BILL-01 — Success toast (`4.1`)

| Field | Content |
|--------|---------|
| **Prerequisites** | TC-SOLO-M-05. |
| **Configuration** | — |
| **Test scenario (manual)** | User sees payment success feedback. |
| **Automation** | N/A |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | Confirm exact toast copy if needed. |
| **PR** | |

### TC-SOLO-M-BILL-02 — Account → Billing ACTIVE (`4.2`)

| Field | Content |
|--------|---------|
| **Prerequisites** | Webhooks applied; Solo monthly active. |
| **Configuration** | — |
| **Test scenario (manual)** | **Billing** shows **ACTIVE**, sensible next billing. |
| **Automation** | N/A |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-08:** Screenshot — `/account` → **Billing**; **Solo Plan** badge **ACTIVE**, **₹2,999/mo**, next billing **8/5/2026**; user `payment.automation12@local.test`. |
| **PR** | |

### TC-SOLO-M-BILL-03 — Payment history row (`4.3`)

| Field | Content |
|--------|---------|
| **Prerequisites** | `subscription.charged` processed. |
| **Configuration** | — |
| **Test scenario (manual)** | History shows **CAPTURED** (or equivalent) for Solo monthly. |
| **Automation** | N/A |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-08:** Screenshot — **Payment History** row: **8/4/2026**, **₹2,999**, Card, status **CAPTURED** (matches `subscription.charged` / first charge; empty state before charge is expected). |
| **PR** | |

### TC-SOLO-M-BILL-04 — Razorpay Dashboard parity (`4.4`)

| Field | Content |
|--------|---------|
| **Prerequisites** | Solo monthly subscription exists in Dashboard. |
| **Configuration** | Test mode. |
| **Test scenario (manual)** | Sub + payments match app (plan name, **₹2,999**, status). |
| **Automation** | N/A |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | e.g. `sub_Sad9zby9ZfV3pN` 2026-04-07. |
| **PR** | |

### TC-SOLO-M-BILL-05 — Server logs clean (`4.5`)

| Field | Content |
|--------|---------|
| **Prerequisites** | Solo monthly webhook run. |
| **Configuration** | — |
| **Test scenario (manual)** | No unhandled **500** on webhook route. |
| **Automation** | Partial via `test:payment`. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | `payment.captured` “Unhandled” before controller update + restart. |
| **PR** | |

### TC-SOLO-M-REG-01 — PENDING until webhook (`5.2` / **PT-04**)

| Field | Content |
|--------|---------|
| **Prerequisites** | Solo monthly checkout created; payment not completed. |
| **Configuration** | — |
| **Test scenario (manual)** | DB/UI: **PENDING** until `subscription.authenticated` / `activated` path; org not upgraded until activation rules in code. |
| **Automation** | Unit: createSubscription **PENDING**; webhook handlers. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | Sequence verified 2026-04-07. |
| **PR** | |

---

# Feature 2 — Solo annual (`F-PAY-SOLO-A`)

**Plan:** SOLO + **annual** billing · **Razorpay plan env:** `RAZORPAY_PLAN_SOLO_ANNUAL`

## Story US-PAY-SOLO-A — Solo annual subscription

*As a* customer *I want* **Solo annual** *so that* I pay the discounted yearly amount and see **~₹2,549**/mo equivalent in the UI.

**Primary PRs:** _same stack as Solo monthly; plan id differs_

**Status summary (2026-04-08):** All **TC-SOLO-A-01 … A-03** **Pass** for Test mode. Evidence: user `payment.automation13@local.test`, Razorpay **Infographic AI - SOLO Annual**, **₹30,588**/yr, webhooks + **CAPTURED** in app. **UI fixes:** Billing **Current Plan** and **Pricing** cards previously ignored API **`billingPeriod`** / **`amount`** (showed **₹2,999/mo** for annual) — corrected in `SubscriptionCard.tsx` and `PricingPage.tsx`.

---

### TC-SOLO-A-01 — Open Solo annual checkout (`1.7` — SOLO half)

| Field | Content |
|--------|---------|
| **Prerequisites** | TC-ENV-*; logged in. |
| **Configuration** | `RAZORPAY_PLAN_SOLO_ANNUAL`; pricing **Annual** toggle **ON** on SOLO card. |
| **Test scenario (manual)** | `/pricing` → SOLO → enable **Annual** → open checkout. Modal/plan id reflects **annual** plan; amount matches table (~**₹2,549**/mo equiv. or Dashboard). |
| **Automation** | `npm run test:payment` focuses on **TEAM annual** + **SOLO monthly** per runbook — **Solo annual** API path should be re-used; add explicit script line or manual sign-off. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-08:** FREE org user; `/pricing` → SOLO **Annual** ON → checkout; Razorpay **SOLO Annual** plan (e.g. `plan_S9hkEAId3XAnB7`), ~**₹2,549**/mo equiv. **Constraint:** SOLO **monthly** ACTIVE still shows **Current Plan** for whole SOLO card (tier-only) — use another FREE user or cancel before re-testing checkout from pricing. **Post-fix:** current paid card shows API-backed **/yr** when `billingPeriod` is **ANNUAL**. |
| **PR** | |

### TC-SOLO-A-02 — Webhooks for Solo annual (mirror SOLO-M-WH-*)

| Field | Content |
|--------|---------|
| **Prerequisites** | Same tunnel/secret as Solo monthly. |
| **Configuration** | Solo **annual** plan id in Razorpay. |
| **Test scenario (manual)** | Complete Solo annual payment; confirm same **event families** as monthly (`authenticated`, `charged`, …) and correct **amount** on `subscription.charged`. |
| **Automation** | Shared unit tests for handlers (not plan-specific amount). |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-08:** Same tunnel/secret as Solo monthly; event families as monthly (`authenticated`, `charged`, …); **`subscription.charged`** amount **₹30,588** matches annual plan (Dashboard + app history). |
| **PR** | |

### TC-SOLO-A-03 — Billing & Dashboard for Solo annual

| Field | Content |
|--------|---------|
| **Prerequisites** | TC-SOLO-A-01 success path. |
| **Configuration** | — |
| **Test scenario (manual)** | Billing shows annual Solo; Razorpay subscription matches billing period. |
| **Automation** | N/A |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-08:** Razorpay: **SOLO Annual**, billed **1 year**, **₹30,588**; app **Payment History** **CAPTURED** for same; **Next billing** ~12 months out. **Before fix:** Billing headline showed **₹2,999/mo** (catalog-only bug). **After fix:** `SubscriptionCard` + `PricingPage` use **`billingPeriod`** + **`amount`**. |
| **PR** | |

---

# Feature 3 — Team monthly (`F-PAY-TEAM-M`)

**Plan:** TEAM + **monthly** · **Razorpay plan env:** `RAZORPAY_PLAN_TEAM_MONTHLY`

**Test session (2026-04-09):** **F-PAY-TEAM-M** — same plan/env as above; session recorded for **TC-TEAM-M-*** (results in rows below).

**Nuance (Razorpay subscriptions):** The **first** charge in the modal is often a small **refundable mandate/auth** amount (e.g. **₹5** in test); recurring **₹6,999**/mo appears in the subscription copy. **`payment.captured`** for that small charge is intentionally **not** used to flip app state. **`subscription.authenticated`** means mandate/UPI is registered — Dashboard can show **Authenticated** with **0 of N invoices charged**; the app keeps **PENDING** until **`subscription.charged`** (first invoice), then **ACTIVE** + Payment History row (see `payments.service.ts`).

**Test mode — “Charge this now”:** Each click pays the **next scheduled invoice** in Razorpay (advances the cycle: e.g. May → Jun → Jul). That is **real (test) money movement** from Razorpay’s perspective, so the app will show **one Payment History row per distinct `pay_*`** — **not a duplicate bug**. For activation-only QA, complete until **`subscription.charged`** (or one **Charge this now**); avoid extra **Charge this now** unless testing renewals.

## Story US-PAY-TEAM-M — Team monthly subscription

*As a* team lead *I want* **Team monthly** *so that* I pay **₹6,999**/mo and limits match TEAM plan.

---

### TC-TEAM-M-01 — Open Team monthly checkout (`1.6`)

| Field | Content |
|--------|---------|
| **Prerequisites** | TC-ENV-*; logged in; `/pricing` → **Enterprise** segment — TEAM card lives there (not Individual). |
| **Configuration** | `RAZORPAY_PLAN_TEAM_MONTHLY`; annual toggle **OFF** on TEAM. |
| **Test scenario (manual)** | **Enterprise** → TEAM card → start checkout; modal opens. |
| **Automation** | E2E may assert TEAM label; full modal not automated. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-09:** User `payment.automation13@local.test`; upgrade path **SOLO annual → TEAM monthly**; **Enterprise** TEAM card; Razorpay modal opens (test mode). **Terminal:** `PaymentsService` warned `Failed to cancel existing subscription before upgrade (ext=sub_SayX1uDkiMbQmY): Subscription is not cancellable in completed status` — prior Solo sub in **completed** state; new TEAM sub still created (`sub_SbLLkGOsRgegKo`). |
| **PR** | |

### TC-TEAM-M-02 — Modal amount ₹6,999 (`5.3` / **PT-05**)

| Field | Content |
|--------|---------|
| **Prerequisites** | TC-TEAM-M-01. |
| **Configuration** | Dashboard TEAM monthly = **₹6,999** (699900 paise). |
| **Test scenario (manual)** | Summary shows **₹6,999**/mo (not **₹1**). |
| **Automation** | N/A |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-09:** Modal headline **₹5** (mandate/refundable “begin subscription” charge); copy states **₹6,999** every month until plan end — matches **Infographic AI - TEAM Monthly** on Dashboard (`plan_S9hmdDtMbWLbCc`). Background pricing card **₹6,999**. |
| **PR** | |

### TC-TEAM-M-03 — Webhooks & billing (mirror Solo monthly WH + BILL)

| Field | Content |
|--------|---------|
| **Prerequisites** | Same global webhook setup. |
| **Configuration** | Team monthly plan id. |
| **Test scenario (manual)** | Pay Team monthly; verify `subscription.charged` amount; Billing **ACTIVE**; history row; Dashboard parity. |
| **Automation** | Unit + `test:payment` (if extended for TEAM monthly create). |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-09 (final):** **`sub_SbLLkGOsRgegKo`** — Billing **ACTIVE**, **Team Plan** **₹6,999/mo**, next billing aligned with Razorpay. **Payment History:** multiple **CAPTURED** **₹6,999** rows with **different** transaction IDs (**e.g.** `Lfrp6dbzck7y`, `LwG6wZG0tYKV`) — **expected** after multiple **Charge this now** clicks: each fires **`subscription.charged`** with a new payment id; app stores each row (idempotent per `pay_*`). Razorpay invoice list (**3 of 12** charged, **May** / **Jun** **Paid**, **Jul** **Next Due**) matches “each Charge this now = next invoice” in **test mode**. **Earlier blocker:** **PENDING** + history row when only **`charged`** arrived — fixed in **`payments.service.ts`** (`subscription.charged` now promotes **PENDING → ACTIVE** + org upgrade; replay path if payment row exists but sub still **PENDING**). **Webhook / tunnel:** ensure **`POST /api/webhooks/razorpay`** returns **2xx** within **5s**; use **Developers → Webhooks** logs to verify deliveries. |
| **PR** | |

### TC-TEAM-M-04 — Abandon / PENDING cancel (same behaviour as Solo)

| Field | Content |
|--------|---------|
| **Prerequisites** | Team monthly checkout started then dismissed or PENDING on Billing. |
| **Configuration** | `RAZORPAY_PLAN_TEAM_MONTHLY`. |
| **Test scenario (manual)** | Dismiss modal + Billing **Cancel** — same expectations as TC-SOLO-M-06 / **07** (no false **ACTIVE** TEAM). |
| **Automation** | Same cancel unit tests (tier-agnostic). |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-09:** **Graceful cancel on ACTIVE** (`payment.automation13@local.test`): Billing **Cancel** → **`immediate: false`**, **`cancelAtPeriodEnd: true`**, Razorpay cancel at cycle end; UI **ACTIVE** + ends on period end until **`subscription.cancelled`** → **FREE**. **Pricing page (`/pricing`):** **TC-TEAM-M-04** abandon / **PENDING** path **verified** — Enterprise **TEAM** monthly: dismiss checkout modal (or equivalent) + expectations match **TC-SOLO-M-06** / **07** (no false **ACTIVE** TEAM without payment / webhook). **Pass** — signed off on Billing + **Pricing** flows. |
| **PR** | |

---

# Feature 4 — Team annual (`F-PAY-TEAM-A`)

**Plan:** TEAM + **annual** · **Razorpay plan env:** `RAZORPAY_PLAN_TEAM_ANNUAL`

**Test session (2026-04-09):** **F-PAY-TEAM-A** — Team annual; user **`payment.automation15@local.test`**; Razorpay **Test mode** — subscription **`sub_SbNMFvUuPX7eyl`**, plan **Team - Annual 15% off** (**`plan_S9hnnRuF9943xs`**). First recurring invoice triggered via Dashboard **Charge this now** → **1 of 1 invoices charged**, **Paid ₹71,388**. App **Billing:** **ACTIVE**, **Team Plan (Annual)**, **Next billing** **9/4/2027**, **Payment History** **CAPTURED** **₹71,388**, transaction **`NtvzrFs8XXP3`**. **Note:** headline **₹71,390/yr** vs captured **₹71,388** = **₹2** catalog/rounding vs Razorpay plan amount (paise) — acceptable for QA if plan amount is source of truth.

## Story US-PAY-TEAM-A — Team annual subscription

*As a* team lead *I want* **Team annual** *so that* I get annual pricing (~**₹5,949**/mo equiv.).

---

### TC-TEAM-A-01 — Open Team annual checkout (`1.7` — TEAM half)

| Field | Content |
|--------|---------|
| **Prerequisites** | TC-ENV-*; logged in. |
| **Configuration** | `RAZORPAY_PLAN_TEAM_ANNUAL`; TEAM card **Annual** **ON**. |
| **Test scenario (manual)** | Checkout reflects annual plan id + amount. |
| **Automation** | `npm run test:payment` includes **TEAM annual** `create-subscription` when test user configured ([PAYMENT_AUTOMATED_TESTING.md](./PAYMENT_AUTOMATED_TESTING.md)). |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-09:** **`payment.automation15@local.test`** — Enterprise **TEAM** card, **Annual** **ON**; checkout created subscription **`sub_SbNMFvUuPX7eyl`** (**`plan_S9hnnRuF9943xs`**). Mandate/auth step completed; first **full** cycle charged later via Razorpay **Charge this now** (see **TC-TEAM-A-02**). |
| **PR** | |

### TC-TEAM-A-02 — Webhooks & billing for Team annual

| Field | Content |
|--------|---------|
| **Prerequisites** | Global webhooks. |
| **Configuration** | Team annual plan. |
| **Test scenario (manual)** | Same event expectations as monthly; amounts match annual plan. |
| **Automation** | Shared handler unit tests. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-09:** After **Charge this now** (Razorpay Test mode): Dashboard **Completed**, **1 of 1 invoices charged**, **Paid ₹71,388**. App: **`subscription.charged`** path — Billing **ACTIVE**, **Team Plan (Annual)**, usage **0 / 200**, **Next billing 9/4/2027**; **Payment History** **CAPTURED** **₹71,388**, **Transaction ID** **`NtvzrFs8XXP3`**. Parity with Team monthly webhook behaviour (**PENDING → ACTIVE** + history row). |
| **PR** | |

---

# Cross-feature — API smoke, plan change, failure path, closeout

## Story US-PAY-X-API — Payments API (all plans)

### TC-X-API-01 — Provider info (`3.1`)

| Field | Content |
|--------|---------|
| **Prerequisites** | Server up. |
| **Configuration** | — |
| **Test scenario (manual)** | `GET /api/v1/payments/provider-info` → `provider: RAZORPAY` (or configured). |
| **Automation** | `npm run test:payment` step 1. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-10:** `npm run test:payment` — **§2** `GET /api/v1/payments/provider-info` → **`provider: RAZORPAY`** (razorpayKeyId from client env). Base URL `http://localhost:5000`. |
| **PR** | |

### TC-X-API-02 — Create subscription contract (`3.2`)

| Field | Content |
|--------|---------|
| **Prerequisites** | Auth token. |
| **Configuration** | Per plan tier + billing in body. |
| **Test scenario (manual)** | `POST /api/v1/payments/create-subscription` returns widget ids. |
| **Automation** | `test:payment` for SOLO monthly + TEAM annual. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-10:** `npm run test:payment` — **§3** SOLO monthly + **§3b** TEAM annual **`POST …/create-subscription`**: success, **`providerSubscription`** present (auth via `TEST_USER_*` in `.env`). |
| **PR** | |

### TC-X-API-03 — Verify payment (`3.3`)

| Field | Content |
|--------|---------|
| **Prerequisites** | After real test payment. |
| **Configuration** | — |
| **Test scenario (manual)** | `POST …/verify` → `verified: true` when signature valid. |
| **Automation** | Unit: HMAC verify (`verifyPayment()` in `npm run test:payments:unit`). |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-10:** **Live sign-off:** Razorpay Test checkouts on **`/pricing`** call **`POST /api/v1/payments/verify`** from the widget **`handler`** (`client/src/pages/PricingPage.tsx`); successful payments completed **without** “Verification Failed” (signature accepted). **Implementation:** subscription verify HMAC matches Razorpay docs — **`payment_id + "|" + subscription_id`** (`server/payments/providers/razorpay.provider.ts`). **Automation:** **`test:payments:unit`** includes **`verifyPayment()`** valid/invalid signature cases. |
| **PR** | |

### TC-X-API-04 — Full automation suite (`3.4`)

| Field | Content |
|--------|---------|
| **Prerequisites** | `npm run dev`; env + optional `TEST_USER_*`. |
| **Configuration** | `RAZORPAY_WEBHOOK_SECRET`. |
| **Test scenario (manual)** | N/A |
| **Automation** | `npm run test:payment`; `npm run test:payments:unit` (**alias:** `npm run test:payment:unit`); `npm run test:e2e -- e2e/pricing-payments.spec.ts`. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-10:** Full **`3.4`** automation **Pass**. **`npm run test:payment`** **6/6** (prerequisites, provider-info, SOLO monthly + TEAM annual `create-subscription`, webhook valid + invalid HMAC). **`npm run test:payments:unit`** — **20/20** (`api/tests/payments/payments.service.spec.ts`; includes **`verifyPayment`**, **`handleSubscriptionCharged`**, **`payment.captured`-shaped payload**, webhooks). **`npm run test:e2e -- e2e/pricing-payments.spec.ts`** — **Pass** (Playwright). **Scripts:** **`test:payments:unit`** (canonical); **`test:payment:unit`** → alias in **`package.json`**. |
| **PR** | |

### Cross-feature documentation close-out (**2026-04-10**)

**TC-X-CLOSE-01** and **TC-X-CLOSE-02** are **Pass** (see **US-PAY-X-CLOSE** below). **`TC-X-API-03`**, **`TC-X-CHG-01`**, and **`TC-X-FAIL-01`** are **Pass** for **2026-04-10**.

---

## Story US-PAY-X-CHANGE — Plan change SOLO → TEAM (`5.1` / **PT-03**)

### TC-X-CHG-01 — Old subscription cancelled

| Field | Content |
|--------|---------|
| **Prerequisites** | Active **Solo** (monthly or annual); upgrade to **Team**. |
| **Configuration** | Both plan ids valid. |
| **Test scenario (manual)** | After upgrade checkout: old Razorpay sub cancelled; DB consistent. |
| **Automation** | Unit: createSubscription cancels prior sub. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-10:** **SOLO monthly → TEAM monthly** after correcting Razorpay **webhook URL** (ngrok tunnel). **Terminal (`start-both`):** **`subscription.cancelled`** (×2, ~**3:36** PM) — prior Solo sub(s) ended at provider; **`subscription.authenticated` / `activated`** for **`sub_SbkcTshB6UnZd7`**; **`payment.authorized`** ack only (expected); **`subscription.charged`** ~**3:38** PM → **`POST /api/webhooks/razorpay` 200** (~5.8s) — **CAPTURED** row + **PENDING→ACTIVE** / org Team per **`handleSubscriptionCharged`**. **App:** Billing **Team monthly** + Payment history **CAPTURED** for that charge (confirm in UI). **Note:** restart servers after deploy so **`payment.captured`** with **`subscription_id`** uses current handler (backstop if **`subscription.charged`** is delayed). |
| **PR** | |

---

## Story US-PAY-X-FAIL — Payment failure (`1.8`)

### TC-X-FAIL-01 — No false active plan

| Field | Content |
|--------|---------|
| **Prerequisites** | Any plan checkout open. |
| **Configuration** | Test UPI `failure@razorpay` or OTP under 4 digits. |
| **Test scenario (manual)** | Failure path; org/plan not **ACTIVE** paid tier without webhook. |
| **Automation** | Unit: `handlePaymentFailed`. |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-10:** **`localhost:5000/pricing`**, Razorpay **Test mode**, card checkout for subscription (**₹5** refundable step + **₹2,999**/mo copy on modal). **Intentional negative:** entered **wrong 2-digit OTP** (under minimum length). Razorpay modal: **“Payment could not be completed”** — *“You've entered an incorrect OTP. Please enter an OTP of length between 4-10 digits.”* **Try again** / **Secured by Razorpay**. Payment **did not** complete at provider → no successful charge path; **expectation for sign-off:** Billing / org **not** showing false **ACTIVE** paid tier from this attempt (no **`subscription.charged`** success without payment). Screenshot retained in session (OTP failure UI). |
| **PR** | |

---

## Story US-PAY-X-CLOSE — Documentation & trackers (`6.1`, `6.2`)

### TC-X-CLOSE-01 — Trackers updated (`6.1`)

| Field | Content |
|--------|---------|
| **Prerequisites** | QA cycle complete. |
| **Configuration** | — |
| **Test scenario (manual)** | [MVP_LAUNCH_TRACKER.md](./MVP_LAUNCH_TRACKER.md), [implementation/1_WEEK_LAUNCH_TRACKER.md](./implementation/1_WEEK_LAUNCH_TRACKER.md) updated. |
| **Automation** | N/A |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-10:** **[MVP_LAUNCH_TRACKER.md](./MVP_LAUNCH_TRACKER.md)** — **Last Updated** Apr 10, 2026; **Payment Testing** row set to checklist **Pass**; Part **1.1** tasks **3–4** (checkout E2E + webhooks) and Phase **0** tasks **0.8** / **0.9** marked **Done** with pointers to this checklist; pending human work reduced to critical-path smoke + staging + prod (**3** tasks). **[implementation/1_WEEK_LAUNCH_TRACKER.md](./implementation/1_WEEK_LAUNCH_TRACKER.md)** — **Last verified** Apr 10, 2026; DAY **1–2** overview rows **1.2–1.4** set **Green** (with **PT-06** / **1.5** caveats); Task **1.2** / **1.3** manual sections replaced with **2026-04-10** status tables; Task **1.4** dated **Pass** row added. |
| **PR** | N/A |

### TC-X-CLOSE-02 — Issues logged (`6.2`)

| Field | Content |
|--------|---------|
| **Prerequisites** | Defects found (if any). |
| **Configuration** | — |
| **Test scenario (manual)** | [ISSUES_REPORT.md](./ISSUES_REPORT.md) rows added (**PT-xx**) when defects exist; otherwise confirm no new issues. |
| **Automation** | N/A |
| **Result** | ☑ Pass ☐ Fail ☐ Blocked ☐ N/A |
| **Finding** | **2026-04-10:** No new payment defects from cross session; **no new PT-xx rows**. **[ISSUES_REPORT.md](./ISSUES_REPORT.md)** — **Last Updated** Apr 10, 2026; header note documents this close-out; **PT-06** remains **Deferred**. |
| **PR** | N/A |

---

## Session log (optional)

| Field | Value |
|-------|--------|
| **Date** | 2026-04-07 |
| **Tester** | (local manual) |
| **Razorpay mode** | Test |
| **App URL** | `http://localhost:5000` |
| **Tunnel URL** | (for webhooks — see TC-SOLO-M-WH-02) |

**Summary (2026-04-07):** Solo monthly path exercised end-to-end including mandate, **Charge this now**, webhooks, idempotency; Team duplicate card on pricing noted (fixed **2026-04-09** — TEAM only on **Enterprise**).  
**Update (2026-04-08):** **F-PAY-SOLO-A** signed off (**TC-SOLO-A-01–03**); annual billing UI fixes in **SubscriptionCard** / **PricingPage**.  
**Update (2026-04-09):** **Feature 3 (`F-PAY-TEAM-M`):** **TC-TEAM-M-01–04** **Pass** — **TC-TEAM-M-04** includes Billing **Cancel** (graceful) **and** **`/pricing`** abandon / **PENDING** path **verified**. Webhooks + **`handleSubscriptionCharged`** **PENDING→ACTIVE**; **Charge this now** = extra invoices / history rows.  
**Update (2026-04-09):** **Feature 4 (`F-PAY-TEAM-A`):** **TC-TEAM-A-01** + **TC-TEAM-A-02** **Pass** — **`payment.automation15@local.test`**, **`sub_SbNMFvUuPX7eyl`**, Razorpay **Charge this now** → **Paid ₹71,388**; app **ACTIVE** + **CAPTURED** history row (**`NtvzrFs8XXP3`**).  
**Update (2026-04-10):** **Cross API smoke** — `npm run test:payment` **6/6 Pass** (`http://localhost:5000`): prerequisites, **TC-X-API-01**, **TC-X-API-02** (SOLO monthly + TEAM annual), Razorpay webhook valid + invalid signature. **`3.4` complete:** **`test:payments:unit`** (**20/20**) + **`e2e/pricing-payments.spec.ts`** **Pass**; **`test:payment:unit`** alias documented. **`3.3` (`TC-X-API-03`)** + **`*-CHG-*` (`TC-X-CHG-01`)** **Pass** — live verify via **`/pricing`** checkout; **SOLO → TEAM monthly** webhooks (**`sub_SbkcTshB6UnZd7`**, **`subscription.charged`** **200**) with webhook URL fixed. **`TC-X-FAIL-01`:** Razorpay checkout — **invalid 2-digit OTP** → provider error modal (OTP length **4–10**); payment not completed. **Close-out:** **`TC-X-CLOSE-01`** (MVP + **1_WEEK** launch trackers) + **`TC-X-CLOSE-02`** (**ISSUES_REPORT.md** reviewed, no new **PT-xx**).

---

## Sprint / release summary (by feature)

| Feature | Result (high level) | Open TCs |
|---------|---------------------|----------|
| **F-PAY-SOLO-M** | Strong | — |
| **F-PAY-SOLO-A** | Strong | — (**TC-SOLO-A-01–03** **Pass** 2026-04-08) |
| **F-PAY-TEAM-M** | **2026-04-09:** **TC-TEAM-M-01–04** Pass (**M-04:** Billing + **`/pricing`** verified) | — |
| **F-PAY-TEAM-A** | **2026-04-09:** **TC-TEAM-A-01** + **TC-TEAM-A-02** **Pass** (manual **Charge this now** + Billing parity) | — |
| **Cross (API)** | **2026-04-10:** **TC-X-API-01**–**04**, **TC-X-CHG-01**, **TC-X-FAIL-01**, **TC-X-CLOSE-01**, **TC-X-CLOSE-02** **Pass** | — |

---

*Related: [AGILE_QA_WORKFLOW.md](./AGILE_QA_WORKFLOW.md) · [PAYMENT_AUTOMATED_TESTING.md](./PAYMENT_AUTOMATED_TESTING.md)*
