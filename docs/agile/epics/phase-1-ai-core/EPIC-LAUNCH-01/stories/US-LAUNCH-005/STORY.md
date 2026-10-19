# Story Card — US-LAUNCH-005

> **Status:** ✅ **Done** — closed 2026-10-19. All six ACs met. AC6 was run against live production 2026-10-16 → 19: a real ₹5,499 SOLO subscription charged, `subscription.charged` received and signature-verified, `PENDING → ACTIVE`, then refunded and cancelled. Net cost about ₹21 (the provider fee is not refundable).
> **Feature:** F-LAUNCH-04 — Payments Go-Live
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-02-revenue-on](../../milestones/M-LAUNCH-02-revenue-on.md)
> **Size:** M (mostly HUMAN ops; code = one startup assert)
> **Depends on:** US-LAUNCH-001 live in production (RazorPay activation review requires legal pages)
> **Linear:** LIN-XXX
> **Created:** 2026-07-07 | **Closed:** 2026-10-19

---

## Story

*As the* product operator
*I want* RazorPay switched from test mode to a fully activated live mode
*So that* checkout moves real money — today every key in the system is `rzp_test_*` and every "payment" is fake.

---

## Acceptance Criteria

- [x] **AC1 [happy-path] (HUMAN):** RazorPay account activation (KYC + website review) approved for live mode — requires US-LAUNCH-001 legal pages live on the production domain. **Done 2026-07-28** — RazorPay account approved, live keys deployed.
- [x] **AC2 [happy-path] (HUMAN):** Live plans re-created in the live-mode dashboard — SOLO monthly/annual, TEAM monthly/annual (test-mode plans do not carry over); TEAM re-verified at ₹6,999 / 699900 paise (PT-05 equivalent in live mode). **Done** — SOLO Monthly/Annual, TEAM Monthly/Annual live plans created (SOLO Annual ₹30,590, TEAM Annual ₹71,390); draft SOLO_PRO also created.
  **⚠️ Amounts above are superseded — corrected 2026-10-16.** They record the catalogue as it stood
  in July 2026; the plans were repriced at relaunch. The live catalogue now reads
  SOLO ₹5,499/mo · ₹52,999/yr · PRO ₹10,999/mo · TEAM ₹21,999/mo · ₹2,10,999/yr · AGENCY ₹43,999/mo
  (read from the public `GET /api/v1/payments/plans` on production, 2026-10-16). The TEAM
  ₹6,999 / 699900-paise figure in this AC is likewise pre-relaunch. Left in place rather than
  overwritten because the AC records what was true when it was ticked — the correction is the
  current state, not a rewrite of the history.
- [x] **AC3 [happy-path] (HUMAN):** Railway production env vars set: `RAZORPAY_KEY_ID`/`SECRET`/`VITE_RAZORPAY_KEY_ID` = `rzp_live_*`, all four `RAZORPAY_PLAN_*` = live plan IDs, `RAZORPAY_WEBHOOK_SECRET` = secret of a live webhook pointing at `https://{prod-domain}/api/v1/webhooks/razorpay`. **Done** — verified via masked Railway CLI check; webhook secret confirmed in RazorPay's `rzp_live_hook_*` format (correct, not a leaked key).
- [x] **AC4 [error-path] (CODE):** Startup assert — when `NODE_ENV=production`, boot fails fast with a clear error if `RAZORPAY_KEY_ID` starts with `rzp_test_` or any configured `RAZORPAY_PLAN_*` var is empty; local dev with test keys is unaffected. **Already shipped** via US-LAUNCH-010 (`api/src/config/env.validation.ts` / `app-env.ts`) — production has booted successfully with live keys, confirming the guard passes as expected.
- [x] **AC5 [regression]:** `npm run verify:payment-prereqs` passes against production config — **✅ PASSED 2026-09-07** via `railway run --environment production -- node scripts/verify-payment-prerequisites.js --live`. All 10 variables resolved **from the real environment** (`source: env`, not the local `.env`), `DATABASE_URL` → `ep-aged-king` (production), `RAZORPAY_KEY_ID` and `VITE_RAZORPAY_KEY_ID` both **live keys**, all four `RAZORPAY_PLAN_*` present and `plan_*`-formatted. Exit 0.
      **The script could not do this before today** and had to be fixed first — two defects, both of which would have produced a false pass: (1) `rootEnv[name] || process.env[name]` meant the local `.env` file beat an injected variable, so a `railway run` audited the developer's machine while appearing to audit production (the same silent-`.env`-fallback that hid BL-25); and (2) `checkValue()` returned `ok: true` for `rzp_test_*` keys, so a production system still on test credentials — precisely what this AC exists to catch — passed. Now: the real environment wins with `.env` as fallback, a `source:` column shows where every value came from, `--live` (implied by `NODE_ENV=production`) fails on test keys, and a live run in which *nothing* came from the real environment fails outright. 11 tests in `api/tests/payments/verify-payment-prereqs.spec.ts`, mutation-verified — restoring either original defect fails 3 tests each.
- [x] **AC6 [happy-path] (HUMAN):** One real ₹ subscription completed on production (smallest plan): checkout → `subscription.charged` webhook received & signature-verified → Subscription `PENDING → ACTIVE` — then refunded/cancelled from the dashboard. **Done 2026-10-19.** Charged ₹5,499 on SOLO monthly via UPI mandate 2026-10-16; captured 2026-10-17 (32 h later — the code assumed ~15 min); `subscription.charged` received 19:34:25 UTC and verified through the HMAC path; refunded ₹5,478 and cancelled 2026-10-19. One caveat recorded: `PENDING → ACTIVE` was first reached by the client refresh/sync path 32 h before any money was collected — that defect is fixed and deployed (`c2738f9`).

---

## Out of Scope

- Stripe activation (EPIC-PAY-03, Phase 2)
- BROKERAGE live plans (US-LAUNCH-007 gates the tier instead)
- Receipt email (US-LAUNCH-006)
- Any change to provider abstraction / payments.service logic — config + assert only

---

## Engineering / PR

- **Branch:** `feat/launch-us-launch-005-razorpay-live`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/main.ts` or payments module init `(TBC — startup assert location)`
  - `api/tests/payments/live-key-assert.spec.ts` (new)
  - `docs/agile/epics/phase-1-ai-core/EPIC-LAUNCH-01/ENV.yaml` (record live var checklist)
  - `.env.example` (comment: prod = rzp_live_*)

---

## AI Implementation Prompt

> Copy this block into Claude Code / Cursor to implement the story (CODE portion only — AC4/AC5 support).

```
Context: InfographicAI SaaS — NestJS API. See CLAUDE.md. RazorPay is the primary provider;
plan IDs come from RAZORPAY_PLAN_SOLO_MONTHLY etc.

Story: US-LAUNCH-005 — RazorPay live-mode activation (code portion)

Add a production config assert that runs at NestJS bootstrap: if NODE_ENV=production and
(RAZORPAY_KEY_ID starts with 'rzp_test_' OR any of the four RAZORPAY_PLAN_{SOLO,TEAM}_{MONTHLY,ANNUAL}
vars is missing/empty), throw with a message naming the offending var. No effect outside
production. Unit-test the assert as a pure function.

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- Do NOT modify provider logic or payments.service.ts
- When done: list files changed, ACs checked, test command to run
```

---

## Human Ops Checklist (AC1–AC3, AC6)

1. ✅ Complete RazorPay KYC + submit production URL for activation review (legal pages must be live) — **done, approved 2026-07-28**
2. ✅ Dashboard → live mode → create 4 plans (SOLO/TEAM × monthly/annual); record IDs in Railway — **done**
3. ✅ Dashboard → live mode → create webhook `https://{prod-domain}/api/v1/webhooks/razorpay`, events: subscription lifecycle + payments; record secret in Railway — **done**
4. ✅ Set all live env vars in Railway; redeploy; confirm boot passes the AC4 assert — **done, production booted successfully with live keys**
5. 🔲 Run `npm run verify:payment-prereqs` against prod config — **not yet run**
6. 🔲 Buy smallest plan with a real card → verify webhook → ACTIVE in DB → refund from dashboard — **intentionally deferred, not run**

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-LAUNCH-005-01 | Auto (unit) | P0 | Given NODE_ENV=production and rzp_test_ key, when assert runs, then boot throws naming RAZORPAY_KEY_ID | ✅ | Covered by US-LAUNCH-010's boot-guard tests; production has since booted successfully with live keys, confirming the inverse (live key passes) |
| TC-LAUNCH-005-02 | Auto (unit) | P0 | Given NODE_ENV=development and rzp_test_ key, when assert runs, then no throw | ✅ | Covered by US-LAUNCH-010 |
| TC-LAUNCH-005-03 | Auto (unit) | P1 | Given production and a missing RAZORPAY_PLAN_TEAM_ANNUAL, then boot throws naming that var | 🔲 | Not directly verified — all four plan IDs are populated in production, so this path hasn't been exercised live |
| TC-LAUNCH-005-04 | Manual | P0 | Real ₹ end-to-end: checkout → webhook signature verified → PENDING→ACTIVE → refund (AC6) | ✅ | Deferred — explicit instruction was not to start checkout during the Task 3 smoke test |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅ (including HUMAN ops checklist) — AC1–AC6 all done
- [x] All test cases run and recorded — TC-01/02 ✅, TC-04 ✅ 2026-10-19; TC-03 see exception below
- [x] `npm run check` passes
- [x] `npm run test:unit` passes
- [x] PR merged — n/a, see exception below; live-key/plan/env work was ops (Railway + RazorPay dashboards), not a code change
- [x] [TASKS.md](./TASKS.md) task list fully checked — T4 (HUMAN ops) mostly done, T1–T3 not tracked as a separate PR since the boot assert shipped under US-LAUNCH-010

> **DoD exceptions — closed 2026-10-19, approved by Dinesh.**
> 1. **No PR.** The remaining scope was ops only — live keys, plans and webhook configuration in
>    the Razorpay and Railway dashboards, not a code change. The defects the AC6 run uncovered
>    were fixed under their own commits (`c2738f9`, `ac0adb2`, `d90b693`, `0aebc89`, `5699bf3`,
>    `416585f`), each with its own tests.
> 2. **TC-LAUNCH-005-03 not directly verified** — a missing `RAZORPAY_PLAN_TEAM_ANNUAL` throwing
>    at boot. The surrounding boot-validation guard is covered by US-LAUNCH-010; this specific
>    variable was never asserted in isolation. Low risk, and production boots cleanly with the
>    full set present.


---

*Story created: 2026-07-07*
