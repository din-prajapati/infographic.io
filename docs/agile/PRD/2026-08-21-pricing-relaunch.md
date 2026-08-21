---
title: Buildographic Pricing Relaunch — PRD
type: prd
status: ready-for-roadmap
created: 2026-08-21
owner: Dinesh
---

# Buildographic Pricing Relaunch

> Source: user-authored PRD (2026-08-21) + same-session feasibility analysis, cost verification
> against real production data, and two architecture decisions made before roadmap generation.
> This file is the version `/prd-to-roadmap` should decompose — it supersedes the raw PRD text in
> chat history wherever the two disagree (the corrections below were found by checking the PRD's
> own numbers against this codebase's real code and real database).

---

## 1. Business goal (unchanged from original ask)

Replace beta pricing with a sustainable SaaS model:

1. Target ~75–80% contribution margin under conservative assumptions.
2. Compelling alternative to hiring freelance real-estate designers.
3. Founding Customer launch strategy (first ~100 customers, discounted, time-boxed).
4. Clear Solo/Pro/Team/Agency differentiation by features + usage.
5. Pricing architecture flexible for future AI providers and cost changes.
6. Never expose Ideogram/GPT/API costs to customers.
7. Preserve existing app architecture wherever practical — extend, don't duplicate.

Positioning: **AI Marketing Studio for Real Estate** (Property → Complete Campaign), not a generic
AI image tool. Primary competitive alternatives: freelance designers, small agencies, generic AI
design tools (Lovart, Canva).

Full plan-by-plan feature lists, CTAs, badges, and pricing-page UX requirements are unchanged from
the original PRD (see chat history 2026-08-21) — `prd-to-roadmap` should pull those verbatim into
the relevant story ACs. This file focuses on what changed or needed grounding.

---

## 2. Finalized pricing table (feasibility-checked, not just proposed)

| Plan | Monthly (Regular) | Monthly (Founding) | AI Designs/mo | Editable/mo |
|---|---:|---:|---:|---:|
| Free | ₹0 | — | 3 | 0 |
| Solo | ₹5,499 | ₹3,999 | 50 | 10 |
| Pro | ₹10,999 | ₹7,999 | 100 | 25 |
| Team | ₹21,999 | ₹14,999 | 200 | 60 |
| Agency | ₹43,999 | ₹29,999 | 400 | 150 |
| Enterprise | Custom | — | 1,000+ | Custom |

**Margin validation (2026-08-21, this session)** — verified against real code constants
(`api/src/config/ai-models.config.ts`: generate $0.06 + $0.004 LLM ≈ ₹5.31; editable/layerize
+$0.09 ≈ ₹7.47) and real production data (`UsageRecord` table: 107 real records, $0.1195/unit
blended average; Railway production metrics: <5% CPU/memory utilization at current volume,
confirming infra marginal cost is negligible at this stage — Railway's current $10/mo bill is a
platform-minimum, not a per-request cost):

- **100% quota utilization, regular price**: 90.3–91.5% margin across all 4 tiers.
- **100% quota utilization, founding price**: 86.8–89.1% margin across all 4 tiers.
- **Realistic average usage (60% design / 50% editable utilization), 500-customer portfolio
  sample**: 93.2–93.7% margin per tier, 93.4% blended.
- All scenarios clear the 75–80% target with real margin. The PRD's own "₹25/creative fully-loaded"
  planning assumption is considerably more conservative than what real cost data supports — safe to
  proceed on the numbers above rather than the ₹25 assumption's implied worst case (which showed
  54–73% margin and was the original trigger for this feasibility pass).
- **Current live pricing, for contrast**: Team margin degrades to 52% typical / 8% worst-case once
  editable is used at volume (measured and shipped as US-LAUNCH-015, 2026-08-15) — this relaunch is
  a direct fix to a real, already-discovered margin problem, not a speculative price increase.

**Known unverified inputs, flagged not hidden**: Razorpay's actual negotiated fee (using industry-
standard 2.36% estimate); infra cost at 500-customer real volume (current data is ~34
generations/month — a ~1,300× gap to the 500-customer model — extrapolated via engineering
judgment, not measured). Recommend re-validating both once real volume exists.

---

## 3. Annual billing — standing discount, always on, separate from campaigns

**Decision (2026-08-21):** Annual billing is a **permanent pricing mechanic**, not a promotion. It
is always available, never toggled on/off, and does not expire. This mirrors how Claude/Cursor and
most SaaS present annual pricing: a fixed, structural discount for committing to a year, shown
as "billed annually" next to the monthly price — not a limited-time offer.

- **Rate**: 12 months for the price of 10 (≈16.7% off), matching the PRD's own annual figures once
  corrected — the PRD's stated `₹5,499 × 12 → ₹54,990/year` is internally inconsistent (5,499×12 =
  ₹65,988, not ₹54,990); the numbers shown are actually `monthly × 10`. Use `× 10` as the real
  formula, not the mislabeled `× 12`.
- **Current codebase already has a *different* annual formula** (`PricingPage.tsx:176-182`:
  `monthly × 12 × 0.85`, i.e. 15% off) — this must be replaced with the `× 10` formula, not left to
  coexist.
- **Interaction with campaigns**: annual discount applies to whatever the *current effective
  monthly rate* is (regular, or campaign-discounted if a campaign is active) — i.e. the two
  discounts compose (campaign first, then the annual multiplier on the result), rather than being
  mutually exclusive or additive as flat percentages. This needs an explicit product sign-off
  before implementation locks it in — flagged as an open question for the epic, not decided
  unilaterally here.
- **Razorpay implementation**: one additional Plan ID per tier for the annual interval (already the
  pattern in this codebase — `RAZORPAY_PLAN_SOLO_ANNUAL` etc. already exist as env var names, just
  need real values + the correct annual price computed off the `× 10` formula).

---

## 4. Campaign/promotional discounts (Founding, Festival, future) — separate system

**Decision (2026-08-21):** Time-boxed promotional discounts (Founding Customer, seasonal/festival,
future referral programs) are a **generic, reusable mechanism** — not hardcoded per-campaign fields
on the plan config. The PRD's own suggested schema (`founding_monthly_price`, `founding_enabled` as
columns) was rejected in favor of a campaign table, because that shape requires a new column and
code change for every future campaign — the opposite of "very less configuration changes" per this
session's explicit requirement.

**Razorpay capability verified this session**
([docs](https://razorpay.com/docs/payments/subscriptions/offers/)): Subscriptions support discount
`Offers` linked via `offer_id` at checkout time, decoupled from the Plan object's price. This means
campaigns do **not** require a new Razorpay Plan per price point — only new `Offer` objects (a
lightweight dashboard/API step), layered on top of the same small, stable set of base Plans.

**Model** (extends the existing `Subscription`/Plan pattern in `api/prisma/schema.prisma`, does not
duplicate it):

```prisma
model PricingCampaign {
  id               String    @id @default(cuid())
  code             String    @unique      // "FOUNDING100", "DIWALI2026"
  name             String
  displayBadge     String?                // "FOUNDING MEMBER PRICE"
  tierDiscounts    Json                   // { SOLO: {type:"PERCENT", value:27.3, razorpayOfferId:"offer_xxx"}, ... }
  startsAt         DateTime
  endsAt           DateTime?
  maxRedemptions   Int?
  redemptionsUsed  Int       @default(0)
  isActive         Boolean   @default(false)
}
```

- `tierDiscounts` is per-tier because Founding's own numbers aren't a flat percentage — Solo/Pro are
  ~27.3% off, Team/Agency are ~31.8% off. A single global `discount_value` field (as the original
  PRD suggested) can't express that.
- **Only one campaign `isActive` at a time** — avoids offer-stacking ambiguity and unclear "why is
  my price this" UX. Enforced in the service layer.
- **Onboarding a new campaign after this ships**: create Razorpay Offer objects (dashboard, minutes)
  → insert one `PricingCampaign` row → flip `isActive`. Zero code deploy.
- **Founding Customer 100** is simply the first row in this table — not special-cased in code beyond
  what any campaign needs (max redemptions, end date, per-tier discount).
- Checkout passes `offer_id` to Razorpay — the backend never trusts a client-computed discounted
  amount (Razorpay validates and applies the discount server-side).
- Redemption cap: Razorpay's own Offer object supports a max-redemption-style limit per its docs —
  needs confirming during implementation whether that alone covers the Founding-100 cap, or whether
  `maxRedemptions`/`redemptionsUsed` in our own table is still needed for *display* ("real count,
  never fake scarcity" per the original PRD).

---

## 5. Editable-design limits — unresolved conflict, needs explicit decision before implementation

**Flag, not a decision made here.** The original PRD describes editable designs as an always-
deducted, separate quota ("generate = 1 AI design consumed; make it editable = 1 editable design
consumed"). What's actually live today (`US-LAUNCH-015`, shipped 2026-08-15,
`generations.service.ts:337-389`) is different: the **first** editable compose per generation is
free on paid tiers (a deliberate "editable is the paid moat, first taste is part of the product
promise" decision), only *additional* distinct-variation composes on the same generation consume a
credit from the shared pool, and cache hits are always free. FREE tier gets a lifetime trial, not
"0 editable" as this PRD specifies.

Implementing the PRD literally means reversing a 6-day-old deliberate product decision. Two paths,
needs a call before story-writing starts:

- **(A) Keep current mechanism, relabel only.** "10 editable/month" becomes a *display* number
  (first-compose-per-generation-free, subsequent composes metered against the shared credit pool,
  capped so a customer can't exceed roughly their tier's editable allowance in practice) — smallest
  implementation, preserves the already-shipped, already-tested policy.
- **(B) Switch to the PRD's literal model** — a genuinely separate editable-design counter, always
  decremented, independent of the generate-credit pool. Bigger change: new counter, new limit-check
  path parallel to `assertCanGenerate`, changes real user-facing behavior for existing beta users.

**Recommendation carried into the roadmap: Path A**, as the default the epic is scoped against,
specifically because it's the smaller, lower-risk change and doesn't undo tested behavior — but this
must be confirmed, not silently assumed, before the relevant story is hardened.

---

## 6. What to reuse (do not duplicate)

- `shared/schema.ts` `PLAN_CONFIG` — single source of truth already used by both frontend and
  backend (`PricingPage.tsx`, `LandingPage.tsx`, `payments.service.ts`). Extend with `PRO` and
  `AGENCY` tiers (`BROKERAGE` is not simply renamed to `AGENCY` — different volume, 1,000 vs 400 —
  treat as a real tier change, not a rename, and decide what happens to any existing BROKERAGE
  subscriber).
- `UsageLimitService` (`api/src/modules/infographics/services/usage-limit.service.ts`) — already the
  centralized entitlement point (`assertCanGenerate`, `getEffectiveTier`, `hasUsedEditableTrial`).
  Extend, don't parallel-build.
- `RAZORPAY_PLAN_*` env var pattern (`payments.service.ts:25-53`) — already supports
  monthly/annual/legacy-fallback per tier; extend with `PRO`/`AGENCY` entries.
- **Pre-existing bug, fix while touching this code**: `PricingPage.tsx:468-469` hardcodes literal
  price text ("Solo ₹2,999/mo, Team ₹6,999/mo...") that doesn't derive from `PLAN_CONFIG` — already
  drifts from real config today, independent of this relaunch.

---

## 7. Out of scope for this PRD

- API-tier compose pricing (deferred per `US-LAUNCH-015` STORY.md, API plans are on hold).
- White-label / client-workspace implementation details beyond what the existing app supports — do
  not invent Agency features the product doesn't have (per original PRD instruction).
- Full multi-provider AI cost routing beyond what already exists (Gemini/GPT-4o tier routing already
  works; this PRD does not change model selection, only pricing/entitlements).
- Enterprise fixed pricing — stays "Contact Sales," no fixed number.

---

## 8. Developer instructions (from original PRD, unchanged)

Before writing code: inspect existing pricing page, plan/subscription models, Razorpay integration,
usage/entitlement implementation, and confirm GPT/Ideogram cost recording — all of this was already
done during this session's feasibility pass (see §2, §6). Reuse existing architecture. Do not
introduce a second billing system. Do not remove working features. Report files changed, schema
changes, entitlement changes, billing changes, tests run, assumptions made, and remaining TODOs at
each story's close.
