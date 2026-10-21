---
title: M-PAY-03-billing-integration — Billing Integration
type: milestone
tags: [orion, pay, pricing, razorpay]
updated: 2026-10-21
---

# M-PAY-03-billing-integration — Billing Integration

> **Epic:** [EPIC-PAY-05](../EPIC.md)
> **Feature:** F-PAY-03
> **Status:** 🟡 **5/6 — no work remains; one item, held by decision (2026-10-21).** All five stories
> are code-complete and merged to `main`. Plan objects audited against both deployed environments'
> own injected environments: production 8 match / 0 wrong (LIVE), staging 8 (TEST). The
> client-supplied-amount criterion was amended — `offer_id` no longer exists — and holds in a
> stronger form: `CreateSubscriptionDto` carries no price field at all. PRO/AGENCY entitlement on
> `subscription.charged` is covered by test at the enforcement point.
>
> **Gate 4 now passes — [[BL-28]] was fixed 2026-10-21** (19 tests / 3 files against a real
> database, no residue).
>
> **One thing is open: AC3, a founding-priced subscription — ⏸ on hold by decision**, the same
> deferral as M-PAY-02's seed item. **Lift the hold and this milestone closes.** US-PAY-110 remains
> **V2** scope.
> **Target date:** TBD
> **Branch:** none — `feat/pay/m-01-pricing-relaunch` was never created; US-PAY-109/110/111
> landed on `main` directly. See Notes / Blockers.
> **Version:** **Mixed** — US-PAY-109 and US-PAY-111 are V1 (PRO/AGENCY sellable at launch);
> US-PAY-110 is V2 (needs the V2 campaign/Offer stories first). See [EPIC.md](../EPIC.md) "Scope split."

---

## Goal

Real Razorpay Plan IDs exist for PRO and AGENCY, checkout charges the correct amount by passing
`offer_id` to Razorpay (never a client-computed discounted price), and webhook-driven entitlement
activation recognizes the new tiers.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR | Version |
|:-----:|-------|-------|:----:|------------|:------:|:--:|:---:|
| 1 | [US-PAY-109](../stories/US-PAY-109/STORY.md) | New Razorpay Plan IDs for PRO/AGENCY tiers | S | US-PAY-102 (M-PAY-01) | 🟢 (all ACs verified) | — | **V1** |
| 2 | [US-PAY-111](../stories/US-PAY-111/STORY.md) | Webhook/entitlement mapping for new tiers | S | US-PAY-109 | ✅ (code) | — | **V1** |
| 2 | [US-PAY-110](../stories/US-PAY-110/STORY.md) | Checkout selects the promo Plan server-side | M | US-PAY-106, US-PAY-109 | 🟡 (rescoped, code done) | — | V2 |

---

## Acceptance (Milestone Done When…)

- [x] `RAZORPAY_PLAN_PRO_MONTHLY/_ANNUAL` and `RAZORPAY_PLAN_AGENCY_MONTHLY/_ANNUAL` are real,
      configured plan IDs (staging at minimum) — no `|| 'plan_pro'` placeholder fallback silently
      shipping to production — ✅ **verified 2026-10-21 on both deployed environments.**

      **Verified — the placeholder half, in code.** `PLAN_IDS.PRO` and `PLAN_IDS.AGENCY`
      (`payments.service.ts:124-141`) fall back to `''`, not to a fake `plan_pro`/`plan_agency`
      id, so an unconfigured tier is *detected* as unconfigured and checkout throws
      `PLAN_NOT_AVAILABLE`. (Noted for later, outside this AC's scope: `SOLO` and `TEAM` still
      carry `|| 'plan_solo'` / `|| 'plan_team'` literals at `:118` and `:131`. Both are
      unreachable while the `_MONTHLY`/`_ANNUAL` vars are set, and a fake id fails loudly at the
      provider rather than mischarging — but it is the same shape this AC names.)

      **Verified — all eight Plan objects on the TEST account**, by
      `npm run audit:razorpay-plans`: 8 match · 0 wrong · 0 unconfigured, on amount *and*
      cadence, including `PRO_MONTHLY` ₹10,999, `PRO_ANNUAL` ₹1,05,999, `AGENCY_MONTHLY`
      ₹43,999, `AGENCY_ANNUAL` ₹4,21,999.

      **Verified — production, LIVE mode: 8 match · 0 wrong · 0 unconfigured.** Run via
      `railway run --environment production --service Buildographic -- npm run audit:razorpay-plans`,
      so it read production's *own* injected environment, not a developer `.env`. The live Plan
      objects are a distinct set from the test account's (`plan_TVs…` vs `plan_TUn…`), which is
      what correctly-separated live and test catalogues should look like.

      **Verified — staging, TEST mode: all 8.** Seven came back `OK` from the audit; the eighth
      (`RAZORPAY_PLAN_AGENCY_ANNUAL` → `plan_TUnqBkcNeLMRrM`) was confirmed separately at
      **₹4,21,999 yearly/1** by a single-plan fetch through the same staging environment, because
      the burst run hit a rate limit — see the finding below. Staging's eight plan IDs are
      identical to the developer `.env`'s, which is expected: staging uses the same TEST account.

      > **Finding — the audit script reports a rate limit as a pricing failure.**
      > `audit-razorpay-plans.ts` fires 8 sequential unthrottled `GET /v1/plans/{id}` calls with no
      > retry. Against the TEST account the 8th reproducibly returns **HTTP 429**, which the script
      > counts as `wrong` and then prints *“At least one live Plan does not charge what the code
      > says. Fix before selling.”* — a false alarm on a payments catalogue that is actually
      > correct. It conflates *unreachable* with *mispriced*. The header comment does say “wrong or
      > unreachable”, but the summary line does not, and the summary is what a reader acts on.
      > A retry-with-backoff on 429, and a distinct `[ RATELIMIT ]` state separate from
      > `[MISMATCH]`, would make this gate trustworthy. Not fixed in this pass — it is an
      > instrument defect, not a catalogue defect.
- [x] Checkout request never accepts a client-supplied discounted amount — the backend resolves
      price via `getEffectivePrice()` and selects the promotional Plan object —
      ✅ **verified 2026-10-21 in code.**

      **The criterion was amended on that date.** It previously required that checkout pass
      `offer_id` to Razorpay. That mechanism was abandoned by US-PAY-110's rescope of 2026-08-27:
      a Razorpay Plan is price-immutable, so a promotion is now *its own Plan object* rather than
      an Offer applied to the list-price one. `offer_id` now appears nowhere in the codebase —
      `grep` returns two comments explaining its removal and nothing else. The protection the
      criterion exists to give — the customer is never charged more than the page advertised — is
      unchanged; only the mechanism is different, and it is recorded below.

      **What was verified, in the stronger form:** the client cannot supply an amount *at all*.
      `CreateSubscriptionDto` (`api/src/modules/payments/dto/payments.dto.ts:5-34`) accepts only
      `planTier`, `currency`, `region`, `successUrl`, `cancelUrl`, `billingPeriod` — there is no
      price, amount or discount field to tamper with. `createSubscription`
      (`payments.service.ts:326-328`) resolves the price through the same
      `PricingResolutionService.getEffectivePrice()` the pricing page uses, so page and checkout
      cannot diverge; and `currency` is rejected rather than coerced when it disagrees with the
      tier's own currency (`:311-317`) — a real trust-boundary check, since the DTO does not
      validate it.

      **The inverted guard** (`payments.service.ts:363-376`): when a live campaign advertises a
      promotional price and no provider Plan object is configured for it, checkout throws
      `PROMO_PLAN_NOT_CONFIGURED` rather than falling back to the list-price Plan. Falling back
      would bill the customer *more* than the page showed — the exact failure the original
      `offer_id` wording was written to prevent.
- [ ] A subscription created under an active Founding campaign is charged the founding price on
      Razorpay's side, verified against the actual Razorpay order/payment record, not just the app's
      own display — ⏸ **ON HOLD by decision, 2026-10-21. Not open work.**

      **Founding pricing is on hold** — Buildographic sells at list price for now. This AC cannot
      be satisfied while that decision stands, and it should not be read as a defect or a backlog
      item. The machinery is intact and dormant; see “Lifting the hold” below.

      The diagnosis that led to the decision is kept because it documents *why* the campaign is
      inert, which is otherwise easy to mistake for a bug. A founding-priced subscription needs
      three links, and none exists:

      1. **No promotional price is authored in code.** `PLAN_CONFIG` declares the field
         (`shared/schema.ts:190` — `promoPrices?: Record<string, { monthly?, annual? }>`) and
         `getPromoPrice()` reads it (`:330`), but **no tier populates it** — `FOUNDING` appears
         nowhere in `shared/schema.ts`. So `getPromoPrice(tier, 'FOUNDING100', interval)` returns
         `undefined` for every tier and every interval.
      2. **No campaign row exists.** `PricingCampaign` count is **0** on the dev/staging database
         (`ep-billowing-cell`, checked 2026-10-21 — 0 rows, 0 active).
      3. **No promotional Plan object is configured.** The convention is
         `RAZORPAY_PLAN_<TIER>_<INTERVAL>_<CAMPAIGN_CODE>` (`payments.service.ts:179-186`, e.g.
         `RAZORPAY_PLAN_SOLO_ANNUAL_FOUNDING100`). Zero promo-suffixed plan variables are set —
         only the eight list-price ones.

      **The failure is safe, which is why it has stayed invisible.** With (1) absent,
      `getEffectivePrice()` returns the list price with `campaignId: null`, so `promoApplies` is
      false and checkout bills list — and the pricing page, reading the same service, *also*
      shows list. The two agree. Nothing overcharges. The Founding Customer 100 campaign is
      simply **inert**: activating it today would change no price anywhere.

      **Lifting the hold**, when that happens, in this order: author
      `PLAN_CONFIG.promoPrices.FOUNDING100` in a reviewed PR → create the promo Plan objects in the
      Razorpay dashboard and set their env vars → run `npx tsx api/scripts/seed-founding-campaign.ts`.
      The script refuses unless the first two are done, so it is safe to run as a readiness check.
      Only then can this AC be executed.

      **Consequence for this milestone:** AC3 is downstream of M-PAY-02's founding-seed item, which
      is held by the same decision. So closing M-PAY-03 is now a **descope decision, not
      implementation** — either carry AC3 to V2 with the rest of the promo path (US-PAY-110 is
      already V2) and close the milestone at V1, or hold the milestone open until founding pricing
      resumes. Everything else in this milestone is either done or one operator command away.
- [x] Webhook handler correctly activates PRO/AGENCY tier entitlements on `subscription.charged` —
      ✅ **verified 2026-10-21 by test, not by assertion.** There is no PRO/AGENCY-specific branch
      to get wrong: `planTier` is stamped on the `Subscription` row at checkout, and
      `upgradeOrganizationForActiveSubscription` (`payments.service.ts:974-986`) reads
      `PLAN_CONFIG[subscription.planTier]` directly, so both tiers travel the same path as SOLO and
      TEAM. Covered at the enforcement point by `payments.service.spec.ts:646-700`: a PENDING PRO
      subscription promotes to `planTier: 'PRO'` with `monthlyLimit: PLAN_CONFIG.PRO.limit`, and an
      AGENCY charge whose amount disagrees with `PLAN_CONFIG` logs an `amount mismatch` warning
      without blocking. Seat limits are separately regression-covered by `plan-user-limits.spec.ts`
      — AGENCY returns `-1` (unlimited), guarding the `?? 1` fallback that once enforced a single
      seat on a ₹43,999/mo tier.
- [x] All stories above have status ✅ Done — ✅ **2026-10-21.** US-PAY-109 (all ACs verified
      2026-09-08), US-PAY-110 (code complete and verified 2026-09-07, **V2 scope**) and US-PAY-111
      are all merged to `main`. No code remains; what is open on this milestone is the
      founding-pricing hold and Gate 4, neither of which is a story.

      **Traceability, verified 2026-10-21.** No milestone branch was created for this epic, so
      there is no milestone PR; every story landed on `main` piecemeal. The git standard's intended
      mechanism still works — each story resolves by `git log --grep "<US-ID>"`:

      | Story | Commits on `main` |
      |---|:--:|
      | [US-PAY-102](../stories/US-PAY-102/STORY.md) | 14 |
      | [US-PAY-106](../stories/US-PAY-106/STORY.md) | 5 |
      | [US-PAY-109](../stories/US-PAY-109/STORY.md) | 12 |
      | [US-PAY-110](../stories/US-PAY-110/STORY.md) | 9 |
      | [US-PAY-111](../stories/US-PAY-111/STORY.md) | 4 |

      Epic DoD amended to match (see [EPIC.md](../EPIC.md)).
- [x] Verification gates pass (Gate 1 + Gate 4) — ✅ **both pass, 2026-10-21.**
      **Gate 1:** `npm run check` (`tsc` + `tsc -p api/tsconfig.json`, 0 errors) and
      `npm run test:unit:backend` (**726 passed / 52 files**).

      **Gate 4 ✅ 2026-10-21 — [[BL-28]] is fixed.** `npx vitest run --config
      vitest.integration.config.ts` → **19 passed / 3 files** against a real PostgreSQL database.
      Row counts on the dev database were identical before and after the run (129 users, 128 orgs,
      17 subscriptions, 173 infographics), so the scoped cleanup left no residue.

      This milestone's own subscription behaviour is covered there by
      `payments.service.integration.spec.ts` (4 tests) — PENDING written before the webhook fires,
      promotion to ACTIVE with the org upgraded on `subscription.charged`, the prior subscription
      cancelled on upgrade, and downgrade to FREE on `subscription.cancelled`.

---

## Notes / Blockers

- Blocked on the Razorpay dashboard Plan/Offer creation documented in [ENV.yaml](../ENV.yaml) —
  same human-task category as the existing `docs/payments/RAZORPAY_SETUP_GUIDE.md`.
- US-PAY-110 depends on both M-PAY-02 (needs a real campaign + resolution service to test against)
  and this milestone's own US-PAY-109 (needs the Plan IDs to check out against).

### Audit 2026-10-21 — what actually remains

Two of the four substantive acceptance items are closed (AC2, AC4). The other two are not code:

| | Remaining | Who |
|---|---|---|
| **AC1** | Audit the Plan objects against staging's and production's *own* environments — two read-only `railway run` commands, printed above | Operator |
| **AC3** | Blocked on M-PAY-02: author `PLAN_CONFIG.promoPrices` for FOUNDING100, seed + activate the campaign row, create the promo Plan objects in the Razorpay dashboard | M-PAY-02, then operator |

Two further decisions this card needs, neither of which is work:

- **The `Branch:` field above is stale.** `feat/pay/m-01-pricing-relaunch` does not exist, locally
  or on the remote. US-PAY-109/110/111 all landed on `main` piecemeal, so there is no milestone PR
  to open and the DoD's “milestone PR merged” clause cannot be satisfied as written. Either record
  that this milestone shipped without one, or point the DoD at the commits that carried it.
- **Does M-PAY-03 close at V1, with US-PAY-110 held at V2?** AC3 is exactly the V2 promo path, so
  “all ACs green” and “V1 is sellable” are now different questions. PRO and AGENCY are sellable at
  list price today; only the founding discount is not.

---

*Milestone created: 2026-08-21*
