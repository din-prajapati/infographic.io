---
title: PRD (rough) — Promotional Pricing (Founding 100, festivals)
type: prd
domain: PAY
created: 2026-08-27
status: rough draft — not scheduled. R1/R2 are recommendations, not decisions.
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
    FOUNDING_100: { annual: 38999 },   // illustrative, not decided. Annual-only, see R1.
  },
}
```

The shape allows `monthly` too, but R1 recommends founding not use it. A festival
promo later adds a second key. **Prices stay in code** — reviewable in a PR,
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
| \+ Founding (annual-only, R1) | **+4** | `RAZORPAY_PLAN_SOLO_ANNUAL_FOUNDING_100` |
| \+ A festival (both intervals) | +8 | `RAZORPAY_PLAN_SOLO_MONTHLY_DIWALI_2026` |

`getExternalPlanId()` gains a promo dimension.

**The honest downside: every promo is 4-8 dashboard objects, forever**, and they can
never be edited (Plans are price-immutable). Worth weighing against how often promos
actually run. R1 halves it for founding.

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
| 4 Razorpay Plans (founding, annual-only per R1) | HUMAN |

**Roughly one story.** Festival afterwards is **zero code** — author prices under a
new key, create its Plans, flip a row.

---

## Recommendations (2026-08-27)

### R1 — Founding is **annual-only**

Do not author a founding monthly price at all.

A discounted founding *monthly* is the worst of both worlds: margin given up, no cash
gained. The only reason to run a founding program at this stage is prepay, and a
monthly variant works against it.

It also dissolves the "founding annual must be deeper than founding monthly × 12"
problem — there is no monthly to compare against — and halves the Razorpay object
count:

| | Plan objects |
|---|---:|
| Founding, annual-only | **4** |
| Founding, monthly + annual | 8 |

This matches the common industry pattern: founding-member and early-bird programs are
almost always annual-or-lifetime, because they are cash instruments rather than
pricing tiers.

### R2 — Founding price is **locked while the subscription stays active**

> "Founding price, for as long as your subscription stays active." Cancel, and it is
> gone.

Two reasons, the second being the practical one:

**It is the default behaviour, so it costs nothing to build.** A Razorpay subscription
renews at its Plan's price. Put a customer on the founding Plan and they renew at the
founding price automatically. *Reverting* to list at renewal is the option that would
require building plan-migration logic. The customer-friendly choice is also the
cheapest to ship.

**Margin is comfortable, but it is not as wide as this section first claimed.**

> ⚠️ **Corrected 2026-08-30.** The original figures below were wrong in two ways and are
> kept struck through, because the ~90% number they produced was being used to argue the
> founding discount could go arbitrarily deep.
>
> ~~Ideogram Turbo is $0.025 (~₹2) plus GPT-4o at $0.004. Annual COGS is roughly **₹4,000
> against ~₹39,000** revenue. ~90% gross margin.~~
>
> 1. **Wrong per-image price.** `'ideogram-turbo'` is an alias — `normalizeImageModel()`
>    maps it to `ideogram-4` at **$0.06/image**, not $0.025. (`image-generation.config.ts:35`)
> 2. **Ignored variations.** Every chat generation produces **3 images**, not 1.
>    `AIChatBox.tsx` sends `variations: 3` and `generations.service.ts` defaults to 3.
>    `getTotalCost()` multiplies per-image cost by that count.

Real cost per generated design: **3 × $0.06 + $0.004 = $0.184**. Editable composes add
$0.09 each.

SOLO at full annual quota (600 designs, 120 editable composes), at ₹85/USD:

| | Cost |
|---|---:|
| 600 designs × $0.184 | $110.40 |
| 120 editable × $0.09 | $10.80 |
| **Annual COGS** | **$121.20 ≈ ₹10,300** |

| Against | Revenue | COGS | Margin |
|---|---:|---:|---:|
| List annual | ₹52,999 | 19% | **81%** |
| Illustrative founding annual (₹38,999) | ₹38,999 | 26% | **74%** |

**So the conclusion changes in degree, not direction.** 74% at a founding price is still a
healthy business, and COGS is still not the binding constraint on a ~30% discount. But
"COGS does not meaningfully constrain how deep the founding discount can go" is too strong:
at a 50%+ discount (₹26,500) COGS reaches ~39%, which is a real margin conversation rather
than a rounding error. Pick the founding price for signalling — but check it against this
table, not against the ~90% figure this section used to assert.

Two costs excluded above, both of which narrow it further: Razorpay's fee (~2% + GST — on a
₹5,499 charge that is larger than the LLM line item) and infrastructure (Railway, Neon, R2,
Resend). This is provider COGS, not contribution margin.

Also note `getTotalCost()` adds `gpt4oPerRequest` unconditionally, even on SOLO/TEAM where
the LLM step routes to Gemini. The figures above are therefore very slightly conservative.

The three patterns in use, for reference:

| Pattern | Trade |
|---|---|
| **Locked while subscribed** ← recommended | goodwill, zero build, small permanent cohort |
| Forever, surviving churn and return | maximum goodwill, messy to administer |
| First year, then list | recovers margin, but reads as a bait-and-switch to the people who backed you earliest |

The third is defensible at 50%+ discounts. At ~30% it punishes your earliest
supporters, which is the opposite of the point.

### What this settles

> **Founding 100 — annual only. ₹X for the first year and every year you stay
> subscribed.**

4 Razorpay Plans · no monthly variant · no renewal-migration logic · no percentage
math anywhere.

---

## Open questions

- [ ] **The founding price itself.** The ~27.3%/31.8% figures in US-PAY-108 were
      percentages; this model needs an authored number per tier. Given ~90% gross
      margin (see R2), pick it for signalling rather than to protect margin.
- [ ] **Which tiers get a founding price?** All four, or only SOLO/PRO where the
      self-serve volume is?
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
