# Template monetisation — is "10 free + 10 premium" a recurring-revenue strategy?

> **Written:** 2026-10-15 · **Status:** thinking, not decided · **Revisit before:** building any template gating
> **Trigger:** idea to gate ~10 premium templates behind paid plans, to earn recurring revenue independent of
> whether a user generates with AI.
>
> Short answer: **the instinct is right, the mechanism is wrong, and the sequencing is backwards.**

---

## Measured facts this rests on (2026-10-15)

| Fact | Value | Source |
|---|---|---|
| Templates in the live library | **10** | `Template` table, staging/dev DB |
| Of which code-seeded | 5 — Luxury Listing, Standard Listing, Just Sold Banner, Open House Event, Market Report | `api/src/modules/templates/data/templates.data.ts` |
| Plan gating on templates **today** | **none** — no `planTier` / premium / paywall logic at all | `templates.service.ts`, `templates.controller.ts` |
| Category spread | 9 categories; `listing` has 2, every other has **1** | DB group-by |
| Cost to serve a template | **~₹0 marginal** — DB rows + thumbnails, no AI spend | — |
| Cost per AI generation | **~$0.1495 avg / $0.274 max** | `UsageRecord`, corroborated by the June 2026 audit's $0.154/event |
| FREE allowance | 3 generations/month | `PLAN_CONFIG` |

Live prices from `/api/v1/pricing` (read as **rupees** — the annual/monthly ratio is a consistent 9.6× and SOLO's
50 generations cost us ~₹650, so a paise reading would be loss-making):

| Tier | Monthly | Annual |
|---|---|---|
| FREE | ₹0 | — |
| SOLO | ₹5,499 | ₹52,999 |
| PRO | ₹10,999 | ₹1,05,999 |
| TEAM | ₹21,999 | ₹2,10,999 |
| AGENCY | ₹43,999 | ₹4,21,999 |

**Freelancer comparison (estimated, not measured — no repo source):** a reusable, editable template runs
₹2,000–8,000 in India, $75–250 US/UK, because the client keeps and re-uses it. So the 10 free templates represent
roughly **₹20,000–80,000 of perceived design value, given away at ~₹0 marginal cost.**

---

## What's right about the idea

Revenue decoupled from AI spend is **~100% gross margin**, against ~88% on SOLO. Wanting non-AI revenue is
correct and worth pursuing. Everything below is about *how*, not *whether*.

## What's wrong with "10 premium templates"

**1. Month-2 cancel.** A static library is consumed once. The user takes the 10 premium templates in week one and
then asks what month two is for. You would be actively selecting for extract-and-leave users. This is why Envato
and Creative Market sell one-time, and why Canva's subscription is brand kit + collaboration + continuous
additions rather than a template count.

**2. It taxes the best acquisition asset you have.** Templates are what make a cold visitor try the product.
Turning "10 free templates" into "10 free, 10 locked" makes the free tier read as a trial and the paid tier read as
a sample. Top-of-funnel loss for a weak retention story.

**3. The library is far too thin to split.** Ten templates across nine categories — an agent posting a "just sold"
has exactly **one** option today. Gating is a pricing move that only works on abundance. At 20 total you are still
thin, and half of it hidden.

**4. Template access is not an exit cost.** Nothing about losing access to templates you have already used makes
leaving painful. Lock-in has to come from somewhere else (below).

---

## The real problem is the ₹0 → ₹5,499 cliff

That is a 100% jump from free to entry, for an individual agent in India, with **nothing in between**. Most lost
revenue is sitting in that gap, not in un-gated templates. A template-anchored low tier is the right idea pointed
at the right gap — just not by hiding templates that are already free.

---

## What I'd do instead

**1. Sell freshness, not access.** Keep all 10 basics free and ungated permanently. Paid gets **4–6 new templates
every month**, tied to the Indian real-estate calendar — festive launches, Diwali offers, RERA milestones, site
visit, booking open, possession. The drop cadence *is* the recurring value, and it costs near zero. Cancel and you
keep what you made but stop receiving new ones. Fair, and still sticky.

**2. Make the brand kit the lock-in, paid only.** Highest retention per rupee of build cost available, and
**[US-LAUNCH-016](../agile/epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-016/STORY.md) /
[US-LAUNCH-017](../agile/epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-017/STORY.md) are already written
and now unblocked** (their DTO-validation ACs depended on BL-30, fixed 2026-10-02). Logo, colours, fonts, headshot
and contact block auto-applied to every template: 10 templates × their brand feels bespoke at zero AI cost, and
leaving means rebuilding their brand everywhere.

**3. Hosted-link permanence — the strongest moat, nearly free.** Assets already live on R2
(`buildographic-assets`). If an agent's infographic URL is live in a portal listing or a WhatsApp broadcast,
cancelling breaks live links in front of *their* clients. That is the hardest-to-leave mechanic in this product and
it is currently unused as a retention lever.

**4. New tier at ₹699–999/mo.** Brand kit + monthly drops + watermark-free export + a small AI allowance (5–10).
Fills the cliff, ~100% margin on the non-AI half, and delivers the "revenue regardless of AI usage" the idea was
reaching for.

**5. Gate output, not browsing.** Let free users build with everything, then meet the wall at export quality,
watermark, brand kit or volume. Effort is already invested by then; sunk-cost converts far better than a locked
catalogue.

**6. Push annual.** Month-2 churn is the structural risk of any template product and annual prepay kills it. The
`RAZORPAY_PLAN_*_ANNUAL` plumbing already exists and 9.6× (two months free) is already attractive.

---

## Sequencing — the part I'd not compromise on

**No real rupee has ever gone through checkout** ([[BL-29]], US-LAUNCH-005 AC5/6), and production checkout is live
and unguarded right now. Adding a new SKU before validating the existing one is backwards: a brand-new tier is the
worst possible place to discover a payment bug.

1. One real ₹ transaction + refund on an existing tier — closes the revenue gate
2. Template library depth — reach 30–40 before anything is gated
3. Brand kit (US-LAUNCH-016/017, written, unblocked)
4. New low tier + monthly drop cadence
5. Gating logic **last**

---

## Prior art in the repo — and a documented-intent gap worth noting

`docs/business/COMPREHENSIVE_PRICING_ANALYSIS.md` (last updated June 2026) **already assumes template tiering**:

- *"Access: Full features (all templates, all models)"* for the 7-day trial
- *"Features: Basic templates, email support"* for the enhanced FREE plan
- *"Access to premium templates"* listed as an upgrade incentive

So basic-vs-premium templates are **already written down as strategy and were never implemented** — the code has
zero plan-awareness for templates. Worth deciding deliberately rather than inheriting it by assumption.

That doc also proposes a **7-day / 10-credit trial at ₹27.40 cost**, 25–30% conversion, LTV ₹30–50k. If that trial
ships, it changes this analysis: a trial plus un-gated templates may already be enough low-barrier entry, and the
₹699–999 tier becomes the *retention* step rather than the *trial* step.

---

## The one-line summary

**Templates won't retain anyone, but they'll acquire everyone. Monetise the brand kit and the drop cadence; give
the catalogue away.**

## Open questions for the revisit

- Is the price unit really rupees? Everything above assumes so. Memory records TEAM at ₹6,999 in March 2026 versus
  ₹21,999 now — confirm that was a deliberate repricing and not a unit bug.
- Does the 7-day trial in the pricing doc still stand, and does it conflict with a ₹699–999 tier?
- Can we actually produce 4–6 quality templates a month, sustainably? The whole "freshness" strategy depends on
  that cadence being real. If it isn't, this plan fails the same way the static-10 plan does.
- What does a competitor's Indian real-estate template library actually contain? 30–40 is a guess at "enough",
  not a researched number.
