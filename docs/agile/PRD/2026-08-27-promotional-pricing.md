---
title: PRD (rough) — Promotional Pricing (Founding 100, festivals)
type: prd
domain: PAY
created: 2026-08-27
status: rough draft — not scheduled, no decisions locked
verified_against: main @ bf55caf
---

# PRD (rough) — Promotional Pricing

> Rough notes so this doesn't have to be re-derived. Nothing here is decided.
> Written after the billing simplification landed (PR #42), which is what makes
> this approach possible.

---

## Principle

> **A promotion is a *price*, not a *discount*.**
> Nothing multiplies. Checkout selects a different Razorpay Plan.

This follows directly from the authored-price model: `PLAN_CONFIG` already authors
`price` and `annualPrice` per tier instead of deriving them. A promo is just two
more authored numbers.

**"Promotions never stack" is then structurally impossible to violate** — a customer
is on exactly one Razorpay Plan, so there is no second discount to compose with. The
rule is enforced by the data model, not by logic that could be got wrong.

---

## Current state (verified 2026-08-27)

| Piece | State |
|---|---|
| `PLAN_CONFIG` | authors `price` + `annualPrice` per tier ✅ |
| `PricingResolutionService` | single resolver, used by page **and** checkout ✅ |
| `PricingCampaign` model | exists — `code`, `isActive`, `maxRedemptions`, `redemptionsUsed`, `displayBadge`, `startsAt/endsAt`, `tierDiscounts` |
| `PricingCampaignService` | single-active-campaign guard ✅ |
| `tierDiscounts` | stores **percentages** — wrong shape for this model |
| `offer_id` | does not exist anywhere in the repo |
| Checkout guard | blocks with `CAMPAIGN_NOT_APPLICABLE_AT_CHECKOUT` when a campaign discount can't be honoured |

### ⚠️ Bug found while scoping this

**`redemptionsUsed` is never incremented.** It is read once, in
`pricing-resolution.service.ts:41`, to decide whether a capped campaign is
exhausted — and written nowhere in `api/src`.

So a "Founding **100**" campaign would **never stop at 100**. It would run until
manually deactivated.

This is independent of everything else in this document and should be fixed
whenever a campaign is first activated, whichever pricing model is chosen.

---

## Changes by layer

### 1. `PLAN_CONFIG` — add promo prices

```ts
SOLO: {
  price: 5499,
  annualPrice: 52999,
  promoPrices: {
    FOUNDING_100: { monthly: 3999, annual: 38999 },   // illustrative, not decided
  },
}
```

Festival later adds a second key. **Prices stay in code** — reviewable in a PR,
versioned, diffable.

### 2. `PricingCampaign` — becomes *which* promo is live, not *what it costs*

Drop `tierDiscounts`. The row keeps `code`, `isActive`, `maxRedemptions`,
`redemptionsUsed`, `displayBadge`, dates.

The split: **prices in code, activation state in the DB.** A promo can be started
and stopped without a deploy; a promo *price* cannot be changed without review.

Requires a migration.

### 3. Resolver — arithmetic becomes lookup

```ts
const promo = campaign ? PLAN_CONFIG[tier].promoPrices?.[campaign.code] : undefined;
effectivePrice = promo ? promo[interval] : regularPrice;
```

`Math.round(x * (1 - d / 100))` disappears. No percentage reaches a price.

### 4. Razorpay — the real ongoing cost

Plans are price-immutable, so every promo price needs its own Plan object:

| | Objects | Env var pattern |
|---|---:|---|
| Standard | 8 | `RAZORPAY_PLAN_SOLO_MONTHLY` |
| \+ Founding | **+8** | `RAZORPAY_PLAN_SOLO_MONTHLY_FOUNDING_100` |
| \+ Each festival | **+8** | `RAZORPAY_PLAN_SOLO_MONTHLY_DIWALI_2026` |

`getExternalPlanId()` gains a promo dimension.

**This is the honest downside: every promo is 8 dashboard objects, forever.** Worth
weighing against how often promos actually run.

### 5. Checkout guard flips meaning

Today it blocks because a campaign discount *cannot* be applied. With promo Plans it
can — checkout selects the promo plan ID. The guard becomes: block if a promo is
active but no promo Plan ID is configured for that tier/interval. Same protection,
different trigger.

### 6. `Subscription.promoCode`

Record which promo a customer subscribed under, for renewals and revenue reporting.
Derivable from `externalPlanId`, but explicit is cheaper to query and harder to
misread.

---

## What this deletes

Razorpay **Offers become unnecessary** — if promos are separate Plans, there is
nothing for an Offer to discount.

- **US-PAY-108** (seed campaign + link 4 Razorpay Offer objects) → descope
- **US-PAY-110** (pass `offer_id` at checkout) → descope; unwritten anyway
- **HUMAN_TASKS #7** (create 4 Offer objects) → drops off the list

Net trade: 4 Offers + unwritten checkout code, for 8 more Plan objects and no code.

---

## Effort

| Piece | Size |
|---|---|
| `PLAN_CONFIG.promoPrices` + resolver lookup | S |
| `PricingCampaign` migration (drop `tierDiscounts`) | S |
| `getExternalPlanId()` promo dimension + guard | M |
| `Subscription.promoCode` | XS |
| **Fix `redemptionsUsed` incrementing** | S — needed regardless |
| 8 Razorpay Plans per promo | HUMAN |

**Roughly one story.** Festival afterwards is **zero code** — author prices under a
new key, create 8 Plans, flip a row.

---

## Open questions

- [ ] **Founding prices.** What are they actually? The ~27.3%/31.8% figures in
      US-PAY-108 were percentages; this model needs authored numbers. A margin
      decision, not a conversion.
- [ ] **Founding annual must be deeper than founding monthly × 12**, or founding
      customers have no reason to prepay — and prepay is the entire cash-flow point.
- [ ] **Does founding pricing persist at renewal, or revert to list?** "Founding
      member price, forever" vs "first year". Changes the Plan setup materially.
- [ ] Keep the `PricingCampaign` table at all, or is a config flag enough for one
      promo? The table earns its place only if promos are started/stopped without
      deploys.
- [ ] Legal: struck-through list pricing alongside promo pricing — India has rules
      on misleading "was/now" claims. Same review as the standing Terms item.

---

## Not doing

- No discount composition, priority ladder, or coupon engine.
- No percentage-based promo calculation anywhere.
- No second promo active at once — the existing single-active guard stands.

---

## Prerequisites

Nothing blocks this technically. But it is worth noting that at time of writing there
are **zero paying customers** and the first real ₹ transaction (`US-LAUNCH-005` AC6)
has not run. A founding promo before a single successful standard checkout is
optimising a funnel that has never converted.
