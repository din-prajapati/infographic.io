---
title: PRD — International Billing (country capture, currency, checkout)
type: prd
domain: PAY
created: 2026-08-26
status: draft — awaiting review
verified_against: main @ a8200f6 + PR #41
---

# PRD — International Billing

> How Buildographic bills customers outside India while Stripe stays disabled and Razorpay
> international payments are pending approval. Every code claim below was checked on 2026-08-26.

---

## 1. The reframe

**Enabling international payments is not the same as needing USD pricing.**

Once Razorpay approves international cards, a buyer in Austin can pay **₹5,499** on their Visa.
Their issuer converts and shows ~$66 on the statement. That works with the **8 INR Plan objects
already being created** — no USD plans, no `PLAN_CONFIG` change, no new env vars, no checkout code.

USD pricing is a **conversion optimisation** — price familiarity, no FX surprise — not a payment
enabler. That collapses this from a 16-plan project into two stages that can ship years apart.

---

## 2. What exists today (verified)

| Piece | State |
|---|---|
| `PLAN_CONFIG` | single `price` + `currency: 'INR'` on every tier (`shared/schema.ts`) |
| `getProviderByCurrency('USD')` | falls through to **Razorpay** when Stripe is disabled — explicit `// Default to RazorPay` |
| `Subscription.currency` | column exists, already written per subscription |
| Currency guard | PR #41 — rejects any currency the plan is not priced in |
| **Country on User / Organization** | **does not exist** — no `country`, `region`, `locale` or `currency` field on either model |
| **IP / geo detection** | **none** — no `CF-IPCountry`, no `x-forwarded-for` parsing, no geo dependency |
| `RegisterDto` | `api/src/modules/auth/dto/auth.dto.ts` — no country field |
| Stripe | disabled (`StripeProvider.isEnabled()` false) |
| `BETA_MODE` | currently blocks **all** paid subscriptions in any currency |

### The bug this replaces

Before PR #41, `currency` came from the client (`CreateSubscriptionDto.currency`, unvalidated) and
the amount was computed from `PLAN_CONFIG.price` (rupees) without consulting it. USD fell through
to Razorpay, picked up an **INR plan ID**, and stored the rupee figure labelled USD — a ~83x
overcharge. **The governing rule below exists because of that bug.**

---

## 3. Governing rule

> **Currency is derived server-side from the customer's billing country. The client may display
> it; the client never decides it.**

A client-supplied currency is a pricing-affecting input taken on faith — the same trust-boundary
class as accepting a client-supplied `user_id`. It has already cost us one latent overcharge.

---

## 4. Country capture

### 4.1 Ask at signup, prefill from IP

```
  Create your account
  ┌─────────────────────────────────┐
  │ Email     [ ................. ] │
  │ Password  [ ................. ] │
  │ Country   [ India          ▾ ]  │  ← prefilled from IP, user can change
  └─────────────────────────────────┘
```

- **IP is a default, never authority.** It prefills the selector; the user's choice wins and is
  what gets stored. Travel and VPNs make IP wrong often enough that trusting it silently would
  price people incorrectly with no way to correct it.
- **Country is required**, not optional — an unset country means an undecidable currency at
  checkout, which is exactly the ambiguity that produced the overcharge.

### 4.2 How to detect (recommendation: Cloudflare header)

| Option | Cost | Verdict |
|---|---|---|
| **`CF-IPCountry` header** — proxy the domain through Cloudflare | free, zero latency, no new dependency, no PII leaves the system | ✅ **recommended** |
| Third-party geo API (ipapi/ipinfo) | per-request cost, added latency, sends visitor IPs to a third party | ✗ |
| MaxMind GeoLite2 local DB | no network call, but ~70MB asset + periodic update job | ✗ for now |

Cloudflare is already entering the stack via R2 (EPIC-INFRA-02) and the apex domain is ours, so
proxying is a DNS configuration change rather than a new vendor relationship.

**Privacy:** store only the **derived two-letter country**. Never persist the visitor IP. Country
alone is what billing needs; the IP is not.

### 4.3 Where it lives — decision needed

Subscriptions are **organisation-scoped** (`Subscription.organizationId`), so the authoritative
billing country must be too. But signup creates a *user*, and the organisation may be created
later (`createSubscription()` creates one on demand if absent).

Recommended:

| Field | Meaning |
|---|---|
| `User.country` | declared at signup, IP-prefilled. A profile attribute. |
| `Organization.billingCountry` | **authoritative for pricing and checkout.** Seeded from the creating user's country; changeable before the first subscription, frozen after. |

Two fields, but they answer different questions, and collapsing them would either make billing
user-scoped (wrong — subscriptions are org-scoped) or delay country capture to checkout (wrong —
we want it at signup).

### 4.4 Google OAuth — the edge case

The OAuth callback has no signup form to put a country selector in. Options: prompt on first
dashboard load, or on first visit to `/pricing`. Either is acceptable; **silently defaulting to
IP is not**, for the same reason as §4.1.

---

## 5. Stage 1 — international cards, INR prices

Ships the moment Razorpay approves. Engineering cost ≈ nothing.

| Piece | Change |
|---|---|
| Razorpay plans | the **8 INR** already being created |
| `PLAN_CONFIG` | none |
| Provider routing | none — INR → Razorpay already |
| Checkout | none |
| Pricing page | show `≈ $66/mo` beside `₹5,499`, **clearly labelled an estimate** |

The estimate label is not decoration. Quoting a firm "$66" and charging an FX-converted rupee
amount is the same dishonesty class as the bug in §2 — the customer sees a number that is not
what they are charged.

---

## 6. Stage 2 — true USD pricing

Only once real international demand exists. Four changes, in dependency order:

**1. `PLAN_CONFIG` gains prices additively**

```ts
SOLO: {
  price: 5499, currency: 'INR',    // unchanged — still the default
  pricesByCurrency: { USD: 69 },   // additive
}
```

One object, one source of truth. A parallel `PLAN_PRICING_USD` map would drift from `PLAN_CONFIG`
within a release — this repo produced three drift bugs on 2026-08-25/26 alone.

**2. Plan-ID resolution becomes currency-aware** — `RAZORPAY_PLAN_SOLO_MONTHLY_USD` alongside the
INR keys. **16 Plan objects total.**

**3. PR #41's guard becomes a lookup.** `CURRENCY_NOT_AVAILABLE` turns into "resolve the price for
this currency" — the guard was written to convert cleanly into exactly that.

**4. Country → currency mapping.** Keep it deliberately dumb: `IN → INR`, everything else → `USD`.
A 190-currency matrix is not a pricing strategy.

---

## 7. Constraints that shape the design

**Currency locks at subscription creation.** Razorpay Plan objects are currency-fixed; an existing
subscriber cannot switch currency without cancel-and-resubscribe. Store it once and never
recompute — a currency re-derived on each render will eventually disagree with the plan the
customer is actually on.

**International recurring is card-only.** UPI and eMandate are INR-only. The international cohort
has no mandate fallback, so involuntary churn (expiries, issuer blocks) is materially higher.
Dunning matters more for them than for Indian customers.

**Razorpay settles to you in INR regardless.** USD would be a display-and-charge currency, not a
settlement currency, and international transactions carry higher fees plus FX spread. **The USD
price is a margin decision, not ₹5,499 ÷ 83.**

---

## 8. Why not now

Independent of Razorpay approval:

- **`BETA_MODE` blocks all paid subscriptions** — nobody can check out in any currency today.
- **Zero paying customers.** `US-LAUNCH-005` AC6 — the first real ₹ transaction — has not run.
- **`US-PAY-110` is unwritten** (verified: no `offer_id`/`offerId` anywhere in `api/src` or
  `server/payments`), so founding discounts do not reach checkout in *any* currency.

Prove INR end to end with one real transaction first.

---

## 9. Proposed slicing

| # | Story | Scope | Size | Gate |
|:-:|---|---|:--:|---|
| 1 | US-PAY-114 | Country capture at signup + `CF-IPCountry` prefill; `User.country`, `Organization.billingCountry` | M | none — buildable now |
| 2 | US-PAY-115 | Pricing page shows a labelled foreign-currency **estimate** by billing country | S | none |
| 3 | US-PAY-116 | True USD pricing — `pricesByCurrency`, currency-aware plan IDs, guard → lookup | M | Razorpay approval + real demand |

Stories 1 and 2 are **not blocked** by Razorpay approval and are worth doing regardless: knowing
where customers are is useful well beyond billing. Story 3 waits.

---

## 10. Review

- [ ] §4.1 country required at signup, IP as prefill only
      **Your decision:**
- [ ] §4.2 Cloudflare `CF-IPCountry` over a third-party geo API
      **Your decision:**
- [ ] §4.3 `User.country` + `Organization.billingCountry` split
      **Your decision:**
- [ ] §4.4 how Google OAuth signups get asked
      **Your decision:**
- [ ] §5 Stage 1 estimate-only labelling
      **Your decision:**
- [ ] §9 slicing, and whether stories 1–2 ship before approval
      **Your decision:**
