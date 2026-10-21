---
title: M-PAY-05-founding-promo-activation — Founding / Promo Activation
type: milestone
tags: [orion, pay, pricing, campaigns, v2]
updated: 2026-10-21
---

# M-PAY-05-founding-promo-activation — Founding / Promo Activation

> **Epic:** [EPIC-PAY-05](../EPIC.md)
> **Feature:** F-PAY-02 / F-PAY-03 (promotional pricing)
> **Status:** ⏸ **On hold by decision — created 2026-10-21 to carry the two founding items out of
> M-PAY-02 and M-PAY-03 so those could close at V1.**
>
> **Founding pricing is held until the product shows traction in payments.** That is the trigger to
> revisit — not a date. The reasoning is the same one this epic's own V1/V2 split records
> (2026-08-22): a discount offered before there is evidence people pay list price gives away margin
> without learning anything.
>
> **Nothing here is blocked on code.** The campaign machinery is built, tested and verified —
> single-active enforcement, atomic switching, the redemption cap enforced in SQL under
> concurrency, and checkout's promo-Plan selection. What is missing is the three links that only
> matter once a promotion is actually offered, listed below. This milestone exists so they are not
> mistaken for defects in the meantime.
>
> **Target date:** none — gated on the hold, not on a date.
> **Branch:** none yet.
> **Version:** **V2** — explicitly decoupled from the revenue-on gate, per the epic's Scope split.

---

## Goal

Turn the Founding Customer 100 program (or any successor campaign) from built-but-dormant into
actually offered: author its prices in code, create the provider Plan objects that back them, seed
and activate the campaign row, and verify end to end that a subscription created under it is charged
the founding price on the provider's side.

---

## Why this is a milestone and not a bug

The campaign system resolves to list price with `campaignId: null` whenever a live campaign has no
authored price. Measured 2026-10-21 with a campaign actually active: **all 8 tier/interval
combinations returned list.** The pricing page and checkout read the same service, so they agree —
nothing mischarges, nothing advertises a discount it cannot honour.

That is the designed behaviour of the hold, not a failure of it. Anyone finding the campaign inert
should read this card, not open a defect.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR | Version |
|:-----:|-------|-------|:----:|------------|:------:|:--:|:---:|
| — | — | *No story written yet — write one with `/new-story` when the hold lifts* | — | the founding-pricing hold | ⏸ | — | V2 |

**Already built and merged, for reference** — these are done and live in `main`; this milestone
does not re-open them:

| Story | What it already provides |
|-------|--------------------------|
| [US-PAY-105](../stories/US-PAY-105/STORY.md) | `PricingCampaign` model + migration |
| [US-PAY-106](../stories/US-PAY-106/STORY.md) | `getEffectivePrice()` — the single price-resolution service |
| [US-PAY-110](../stories/US-PAY-110/STORY.md) | Checkout selects the promo Plan server-side (V2, code complete 2026-09-07) |

---

## Acceptance (Milestone Done When…)

Carried verbatim in substance from the two milestones that closed at V1, so nothing is lost:

- [ ] **Promotional prices are authored in code.** `PLAN_CONFIG[tier].promoPrices.FOUNDING100` is
      populated for every tier/interval on offer, in a reviewed PR — not computed, not stored in the
      database. *(Carried from M-PAY-02.)* The field and its reader already exist
      (`shared/schema.ts:190`, `getPromoPrice()` at `:330`); no tier populates them today.

- [ ] **Promotional Plan objects exist at the provider and are configured.** One per authored
      tier/interval, named by the convention `RAZORPAY_PLAN_<TIER>_<INTERVAL>_FOUNDING100`
      (`payments.service.ts:179-186`). Zero are set today. A Razorpay Plan is price-immutable, so a
      promotion is a separate Plan object — there is no Offer to apply. **Do not create Razorpay
      Offer objects**; that approach was voided 2026-08-27.

- [ ] **The campaign row is seeded and active.** Run `npx tsx api/scripts/seed-founding-campaign.ts`.
      The script is already the right instrument and needs no change: it refuses to create the row
      unless an authored price exists, and refuses again unless every authored price has a Plan
      object behind it. Running it today prints
      `❌ Cannot seed FOUNDING100: no promo price is authored for it.` — which is the correct answer
      while the hold stands, and makes it safe to run as a readiness check.

- [ ] **A subscription created under the active campaign is charged the founding price on the
      provider's side**, verified against the actual provider order/payment record — not the app's
      own display. *(Carried from M-PAY-03 AC3.)*

- [ ] **The redemption cap closes in production.** `tryConsumeRedemption()` is already verified under
      concurrency at Gate 4 (`pricing-campaign.integration.spec.ts`), including two simultaneous
      redemptions at the boundary where exactly one succeeds. What remains is confirming the live
      campaign stops at its cap with real traffic.

- [ ] Verification gates pass (Gate 1 + Gate 4)

---

## Notes / Blockers

- **Blocked only by the hold.** No code is owed. When the hold lifts, the order is: author the
  prices (PR) → create the Plan objects in the dashboard and set the env vars → run the seed script
  → run one real founding-priced checkout.
- **Human/dashboard task.** Creating the Plan objects is the same category as US-PAY-109's, and
  belongs in `HUMAN_TASKS.md` when scheduled.
- **The `tierDiscounts` column is vestigial.** It holds `{}` and is read by nothing
  (`pricing-campaign.service.ts:72`). It survives only because removing it in the same change that
  altered pricing behaviour would have been a poor idea. Do not store prices there.

---

*Milestone created: 2026-10-21 — carrying the founding items out of M-PAY-02 and M-PAY-03 so both
could close at V1.*
