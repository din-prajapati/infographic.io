---
title: Human Tasks Tracker
type: tracker
layer: cross-cutting
tags: [orion, human-tasks, ops, dashboard]
updated: 2026-08-22
---

# Human Tasks Tracker

> Companion to [PHASE_TRACKER.md](PHASE_TRACKER.md) — same idea, different axis. That file tracks
> story/milestone/epic **completion**; this one tracks every task in the tree that **cannot be done
> by an AI coding agent** — dashboard clicks, DNS records, KYC/legal review, and deliberate
> real-money actions. Compiled by sweeping every `STORY.md`/`TASKS.md`/`MILESTONE.md`/`EPIC.md` for
> `HUMAN` markers project-wide (2026-08-22). Update this file whenever a human task is discovered,
> completed, or superseded — don't let it go stale the way `PHASE_TRACKER.md` itself repeatedly has
> (see that file's own reconciliation notes).

---

## How to use this

Each row is one concrete action only a human can take (dashboard/console access, legal judgment, or
a deliberate go/no-go on spending real money). Code-side prerequisites an agent already finished are
not listed here — only what's still genuinely blocked on you. Grouped by phase in delivery order;
within a phase, in the order they unblock downstream work.

---

## Summary — outstanding tasks

| # | Phase | Epic | Story/Milestone | Task | Status |
|:-:|-------|------|------------------|------|:------:|
| 1 | Phase 0 | EPIC-INFRA-01 (legacy MVP deploy) | Phase 0 Task 3 | Push `v1.0.0` tag → production auto-deploy (currently running several commits behind `main`, off a pre-tag deploy) | 🔲 |
| 2 | Phase 0 | EPIC-INFRA-01 | Phase 0 Task 3, rows P-15/16/17 | Full production smoke test (3D) — unrun since the domain/keys work landed | 🔲 |
| 3 | Phase 1 | EPIC-LAUNCH-01 | US-LAUNCH-005 AC5 | Run `npm run verify:payment-prereqs` against production config | 🔲 |
| 4 | Phase 1 | EPIC-LAUNCH-01 | US-LAUNCH-005 AC6 | One real ₹ subscription on production (smallest plan) → verify webhook activates it → refund/cancel from dashboard | 🔲 — **deliberately held**, needs your explicit go-ahead |
| 5 | Phase 1 | EPIC-INFRA-02 | US-INFRA-001 | Provision **two** Cloudflare R2 buckets (staging + production) and **two** API tokens, each scoped to its own bucket. R2 has no test/live mode, so the token scope is the only isolation — see §5 | 🔲 — **blocks the story starting**, not just finishing |
| 6 | Phase 1 | EPIC-PAY-05 (V1) | US-PAY-109 T0 | Create **8** Razorpay Plan objects per tier×interval — see §6 for the exact amounts (annual figures corrected 2026-08-27: they were stale ×10-derived values, superseded by `PLAN_CONFIG`'s authored prices). Naming: `BG-<TIER>-<INTERVAL>-<YYYY>-<MM>`. **Amount field takes rupees, not paise.** | ◐ — **Test mode ✅ done** (2026-08-27, all 8 verified); **Live mode 🔲 pending** for production |
| ~~7~~ | ~~Phase 1~~ | ~~EPIC-PAY-05 (V2)~~ | ~~US-PAY-108 T0~~ | ~~Create 4 Razorpay Offer objects (Founding-100 discount)~~ | ❌ **RETIRED 2026-08-27** — Razorpay Offers are no longer used at all. See §7 |
| 8 | Phase 0 | EPIC-LAUNCH-01 | US-LAUNCH-001 | Final legal review of Terms/Privacy/Refund wording — drafted content is a starting point, not legal advice, and these pages are already live in production | 🔲 — standing item, no deadline set |

**Likely already resolved, worth a quick verify rather than re-doing:**

| Story | Task | Why it's probably done |
|---|---|---|
| US-LAUNCH-002 | Resend domain DNS setup | Password-reset flow was live-verified against a real domain/email 2026-07-21 — DNS almost certainly configured, just never explicitly ticked here |

**Historical / low-priority visual QA (Phase 0-mvp, dated 2026-04 to 2026-06 — verify still relevant before spending time on them, product has moved far past this point):**

| Story | Remaining HUMAN item |
|---|---|
| US-DESIGN-003 | Real Ideogram image fidelity + live usage-counter increment, visual judgment on staging |
| US-DESIGN-004 | Visual spot-checks: button-height/card-border/spacing on staging; chart-label dark-mode readability; per-panel split-personality inspection |

---

## Detail by task

### 1–2. Phase 0 Task 3 — production go-live, remaining rows
**Source:** [`docs/testing/PHASE_0_HUMAN_QA_CHECKLIST.md`](../testing/PHASE_0_HUMAN_QA_CHECKLIST.md) §3
**Status:** 🟡 In Progress — most of Task 3 is done (domain live, RazorPay live-mode activated
2026-07-28, Google OAuth verified live 2026-07-30, Sentry's 4 checks all ✅ as of 2026-07-26). Two
things remain:
- **Tag `v1.0.0`** (§3C, row P-09/P-10 area) — production is still running off a pre-tag deploy,
  currently several commits behind `main` (confirmed no `v1.0.0` tag exists in this repo as of
  2026-08-22).
- **Full smoke test** (§3D, rows P-15/16/17) — unrun since the domain/keys/OAuth work landed.

### 3–4. US-LAUNCH-005 — real payment verification
**Source:** [`EPIC-LAUNCH-01/stories/US-LAUNCH-005/STORY.md`](epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-005/STORY.md)
AC1–4 are done (RazorPay account approved, live plans created, Railway env vars set, boot-guard
code shipped and verified). AC5/6 remain:
- **AC5**: `npm run verify:payment-prereqs` has never been run against the actual production config.
- **AC6**: one real ₹ transaction, completed and refunded — explicitly held per a prior instruction
  ("DO NOT Start Checkout Flow" during the Task 3 smoke test). This is the last box before
  `BETA_MODE=false` (revenue-on) can flip.

### 5. US-INFRA-001 — Cloudflare R2
**Source:** [`EPIC-INFRA-02/stories/US-INFRA-001/TASKS.md`](epics/phase-1-ai-core/EPIC-INFRA-02/stories/US-INFRA-001/TASKS.md)
A **prerequisite**, not a follow-up — the story (durable asset storage, moving off Ideogram's
expiring CDN and the container's ephemeral tmp dir) can't start implementation until real R2
buckets + API tokens exist. No AI agent can self-provision third-party cloud credentials.

📋 **Step-by-step runbook: [`docs/setup/CLOUDFLARE_R2_SETUP.md`](../setup/CLOUDFLARE_R2_SETUP.md)**
— dashboard paths, a values worksheet, and the verification commands. ~20 minutes.

**Two buckets and two tokens, not one of each** (scoped 2026-08-30):

| Step | Detail |
|---|---|
| 1 | Enable R2 on the Cloudflare account — needs a payment method even within the free allowance |
| 2 | Create `buildographic-assets` (production) and `buildographic-assets-staging` |
| 3 | Create **two** API tokens, each **scoped to one bucket**, Object Read & Write |
| 4 | Note the Account ID — one per account, **shared** by both environments |
| 5 | Public access — **production**: attach custom domain `assets.buildographic.com`. **Staging**: enable the managed `r2.dev` subdomain, **no custom domain** (decided 2026-08-30) |
| 6 | DNS: nothing to do by hand. `buildographic.com` is already on Cloudflare nameservers (verified 2026-08-30), so attaching the custom domain in step 5 creates the record automatically |

⚠️ **Why two, when RazorPay needed only one set per mode.** RazorPay separates environments at
the provider — test and live are distinct namespaces, and a live key outside production aborts
boot. **R2 has no test/live mode.** One bucket can serve every environment, staging and
production credentials are structurally identical, and `R2_ACCOUNT_ID` is the *same value* in
both — so nothing about a production token makes it fail when used from staging.

The failure that guards against is not a crash: it is staging silently writing into the bucket
serving real customers' assets, noticed only when something is overwritten. Two things prevent
it, and both are needed — **per-bucket token scoping** (step 3) and **US-INFRA-001 AC6's boot
guard**, which refuses to start a non-production environment pointed at a bucket whose name
lacks a `staging` marker.

Full variable matrix: [`EPIC-INFRA-02/ENV.yaml`](epics/phase-1-ai-core/EPIC-INFRA-02/ENV.yaml)
and [`docs/setup/ENVIRONMENTS.md`](../setup/ENVIRONMENTS.md) §5a.

### 6. US-PAY-109 — Razorpay Plan objects (new tiers + repriced tiers)
**Source:** [`EPIC-PAY-05/stories/US-PAY-109/TASKS.md`](epics/phase-1-ai-core/EPIC-PAY-05/stories/US-PAY-109/TASKS.md)
All code is done and verified by test — this is the *only* remaining blocker. Two distinct reasons
land in the same T0 task, since it's the identical dashboard action either way:
- **New tiers** (PRO, AGENCY — didn't exist before this relaunch): create 4 Plan objects, record
  the `plan_...` IDs, set as `RAZORPAY_PLAN_PRO_MONTHLY`/`_ANNUAL`/`RAZORPAY_PLAN_AGENCY_MONTHLY`/`_ANNUAL`
  — these env-var *keys* are new, added as part of `US-PAY-102`'s downstream-consumer fix.
- **Repriced tiers** (SOLO, TEAM — added 2026-08-23, `US-PAY-102`'s re-open): Razorpay Subscription
  Plans are price-immutable once created, so the existing live SOLO/TEAM Plans stay at the old
  beta rate (₹2,999/₹6,999) forever. Create *new* Plan objects, then repoint the **existing**
  `RAZORPAY_PLAN_SOLO_MONTHLY`/`_ANNUAL`/`RAZORPAY_PLAN_TEAM_MONTHLY`/`_ANNUAL` env vars at them —
  no code change needed here, those keys already existed before this relaunch. Existing subscribers
  on the old plans are unaffected until they re-subscribe or upgrade — no automatic migration.

**The amounts.** `PLAN_CONFIG` in `shared/schema.ts` is canonical; these mirror it. Earlier
revisions of this file carried ×10-derived annual figures (₹54,990 / ₹1,09,990 / ₹2,19,990 /
₹4,39,990) that predate PR #42's authored-price model — those are **wrong**, corrected 2026-08-27.

| Plan name | Description | Period | Amount (₹, as typed in dashboard) | → env var |
|---|---|---|---:|---|
| `BG-SOLO-MONTHLY-<YYYY-MM>` | Solo — 50 AI marketing designs/month, 1 user. Billed monthly. | monthly | 5,499 | `RAZORPAY_PLAN_SOLO_MONTHLY` |
| `BG-SOLO-ANNUAL-<YYYY-MM>` | Solo — 50 AI marketing designs/month, 1 user. Billed annually. | yearly | 52,999 | `RAZORPAY_PLAN_SOLO_ANNUAL` |
| `BG-PRO-MONTHLY-<YYYY-MM>` | Pro — 100 AI marketing designs/month, 1 user. Billed monthly. | monthly | 10,999 | `RAZORPAY_PLAN_PRO_MONTHLY` |
| `BG-PRO-ANNUAL-<YYYY-MM>` | Pro — 100 AI marketing designs/month, 1 user. Billed annually. | yearly | 1,05,999 | `RAZORPAY_PLAN_PRO_ANNUAL` |
| `BG-TEAM-MONTHLY-<YYYY-MM>` | Team — 200 AI marketing designs/month, 5 users. Billed monthly. | monthly | 21,999 | `RAZORPAY_PLAN_TEAM_MONTHLY` |
| `BG-TEAM-ANNUAL-<YYYY-MM>` | Team — 200 AI marketing designs/month, 5 users. Billed annually. | yearly | 2,10,999 | `RAZORPAY_PLAN_TEAM_ANNUAL` |
| `BG-AGENCY-MONTHLY-<YYYY-MM>` | Agency — 400 AI marketing designs/month, unlimited users. Billed monthly. | monthly | 43,999 | `RAZORPAY_PLAN_AGENCY_MONTHLY` |
| `BG-AGENCY-ANNUAL-<YYYY-MM>` | Agency — 400 AI marketing designs/month, unlimited users. Billed annually. | yearly | 4,21,999 | `RAZORPAY_PLAN_AGENCY_ANNUAL` |

All: Interval 1, Currency INR. Quotas and user counts come from `PLAN_CONFIG`; the quota stays
**monthly** on annual plans, which is what "Billed annually" makes explicit. Descriptions appear on
invoices, so they match the pricing page's wording ("AI Marketing Designs", not "infographics").

Plan IDs are **per-environment** — staging needs Test-mode objects, production needs Live-mode
objects, so this is 8 plans per mode.

#### Status by mode

| Mode | For | Status |
|---|---|---|
| **Test** | local + staging | ✅ **Done 2026-08-27.** 8 plans created as `BG-<TIER>-<INTERVAL>-2026-08`, all verified against `PLAN_CONFIG` via the API. IDs recorded below and in `~/secrets/infographicai/plan-ids.staging.env`. |
| **Live** | production | 🔲 Not created. `2026-08` is **taken in live mode** by the abandoned 100× set — pick a distinct generation token. |

Test-mode plan IDs (also in `.env` and `.env.development.example`):

```
RAZORPAY_PLAN_SOLO_MONTHLY=plan_TUnk0unqkkTA6n     RAZORPAY_PLAN_SOLO_ANNUAL=plan_TUnkphaNt7fy8y
RAZORPAY_PLAN_PRO_MONTHLY=plan_TUnlnHnvf8Up1k      RAZORPAY_PLAN_PRO_ANNUAL=plan_TUnmpHenwVPXAs
RAZORPAY_PLAN_TEAM_MONTHLY=plan_TUnnmrlVAvR6Dv     RAZORPAY_PLAN_TEAM_ANNUAL=plan_TUnoWAkCmYESuS
RAZORPAY_PLAN_AGENCY_MONTHLY=plan_TUnpLHPMOrWOuE   RAZORPAY_PLAN_AGENCY_ANNUAL=plan_TUnqBkcNeLMRrM
```

### ⚠️ 2026-08-27 — a first attempt created 8 plans at 100× the price, in LIVE mode

The dashboard's amount field takes **rupees**; the paise figure was typed into it. All 8 objects
were created at 100× (e.g. SOLO monthly at ₹5,49,900 instead of ₹5,499) and Razorpay Plans can be
neither edited nor deleted, so they sit in the dashboard permanently under correct-looking names.
No customer impact — no IDs ever reached an env var and there are no paying customers.

Abandoned, never to be used: `plan_TUmNQH4lRDgWOG` `plan_TUmOMrcSdP0lWI` `plan_TUmPHqng8bmvny`
`plan_TUmPi2nOAo6DfH` `plan_TUmQF64vtupOBR` `plan_TUmQhWOOVtJfMa` `plan_TUmRGiU4hLVokq`
`plan_TUmRjGCF2e7nJl`. Both scripts hard-refuse these IDs.

**These are LIVE-mode objects** — confirmed 2026-08-27 by querying them with test-mode keys, which
returns HTTP 400 (not found). That is why the test-mode set could safely reuse the plain `2026-08`
token: in test mode the names were never taken.

**The consequence for production:** in live mode `BG-<TIER>-<INTERVAL>-2026-08` **is** taken, by
eight plans whose names look correct and whose prices are 100× wrong. The live set therefore needs
a distinct generation token — the month you actually create them, or a `-v2` suffix — and after
creating them, run the verify script rather than trusting the dashboard name.

**The tooling that now backs this task** (added 2026-08-27):
- `secrets/plan-ids.template` — copy out of the repo, one per environment, fill in the 8 IDs
- `node scripts/verify-razorpay-plan-prices.mjs <file>` — queries each Plan and compares its real
  amount against `PLAN_CONFIG`. This is the check that catches a rupee/paise mix-up **before** an
  ID reaches an env var. Run it before the push, not after.
- `bash scripts/set-razorpay-plan-ids.sh <file> <staging|production>` — pushes only the 8
  `RAZORPAY_PLAN_*` keys to one Railway environment (`DRY_RUN=1` to preview)

### 7. ~~US-PAY-108 — Razorpay Offer objects (Founding-100)~~ — ❌ RETIRED 2026-08-27

**Do not create these objects.** The task is void, not deferred.

The pricing module was simplified on 2026-08-27 to the model most SaaS billing systems use:
**a promotion is a price, not a discount.** A promo is its own price-immutable Razorpay Plan
object, and checkout selects it instead of the list-price Plan. Nothing multiplies a percentage
into a price any more.

If a promo is a separate Plan, **there is nothing left for a Razorpay Offer to discount.** Creating
4 Offer objects would produce 4 permanent dashboard objects that no code path can reach — the same
category of dead object as the 100×-price Plans in §6.

What replaced it, and what is actually needed when Founding-100 runs:

| Was | Now |
|---|---|
| 4 Razorpay **Offer** objects | 4 Razorpay **Plan** objects (annual-only), named `BG-<TIER>-ANNUAL-<YYYY-MM>-FOUNDING100` |
| `RAZORPAY_OFFER_FOUNDING_*` env vars — **removed from `.env.example`** | `RAZORPAY_PLAN_<TIER>_ANNUAL_FOUNDING100` |
| Discount percentages in `PricingCampaign.tierDiscounts` | Authored prices in `PLAN_CONFIG[tier].promoPrices.FOUNDING100` |

That new plan-creation task is **not listed here yet on purpose** — the founding price itself is
still an open product decision, and per the PRD's own Prerequisites the first real ₹ transaction
(§4 / `US-LAUNCH-005` AC6) should land before any promo work at all.

### 8. US-LAUNCH-001 — legal review
**Source:** [`EPIC-LAUNCH-01/stories/US-LAUNCH-001/STORY.md`](epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-001/STORY.md)
Terms of Service / Privacy Policy / Refund Policy pages are live in production (they were the
prerequisite for RazorPay's live-mode KYC approval). Their wording was drafted, not legally
reviewed. No deadline was ever set for this — flagging it here so it doesn't quietly stay
un-tracked indefinitely now that real customers can reach these pages.

---

## Change log

- **2026-08-22** — Tracker created. Full project-wide sweep for `HUMAN` markers across
  `docs/agile/epics/**`, `PHASE_TRACKER.md`, and `docs/testing/PHASE_0_HUMAN_QA_CHECKLIST.md`.
- **2026-08-23** — SOLO/TEAM repricing gap found while implementing `US-PAY-106` (fixed in
  `US-PAY-102`, re-opened same day) needs new Razorpay Plans, same as PRO/AGENCY — folded into
  `US-PAY-109`'s existing T0 task (now 8 Plan objects total) rather than a new story or a
  fragmented #6b entry.
- **2026-08-27** — Task #6's annual amounts corrected: they were ×10-derived figures predating
  PR #42's authored-price model, and no longer matched `PLAN_CONFIG`. Exact per-plan table and the
  `BG-<TIER>-<INTERVAL>-<YYYY>-<MM>` naming convention added. First creation attempt the same day
  produced 8 unusable 100×-price Plans (rupees/paise mix-up); recorded in §6 with the abandoned IDs,
  and `scripts/verify-razorpay-plan-prices.mjs` added so the amount is machine-checked from now on.
  Later the same day the **test-mode** set was created correctly and verified 8/8 against the API;
  `.env`, `.env.development.example` and `.env.production.example` updated. The abandoned plans were
  confirmed to be **live-mode**, so the test set kept the plain `2026-08` token — but the live set
  still needs a distinct one. Task #6 is now half-done: test ✅, live 🔲.
