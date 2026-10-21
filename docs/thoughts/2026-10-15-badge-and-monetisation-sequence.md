# Agreed sequence — attribution badge, library depth, brand kit, free allowance

> **Written:** 2026-10-15 · **Status:** agreed direction, not scheduled into stories yet
> **Companion:** [2026-10-15-template-monetisation-strategy.md](./2026-10-15-template-monetisation-strategy.md)
> — read that first for the reasoning and the measured numbers behind it.
>
> Step 1 of this plan (**remove the "no watermarks" promise from the FREE tier copy**) is **done** —
> `client/src/pages/PricingPage.tsx`, merged to `main` 2026-10-15. Steps 2–6 below are the remaining order.

---

## The order, and why it is this order

### 2. Build the badge as a flag, ship it dark

A small corner attribution badge on **free-tier exports only**. Build it now, behind a flag, switched off.

- **Why now:** production has no real users, so nothing about adding it is a takeaway. The moment there is a
  real signup, this becomes a change to someone's existing deal.
- **Why dark:** it should not go live until there is something to upgrade *to* (step 4) and output worth signing
  (step 3). Shipping it early turns the upgrade path into "pay to remove our mark" instead of "pay to add yours" —
  the version customers resent.
- **Known shape:** `client/src/lib/canvasExport.ts` is a single chokepoint, and the client already knows
  `planTier`. Roughly 1–2 h with tests. Two call sites consume the export lib (editor toolbar and the My Designs
  re-download path) — both need covering.
- **Open decisions (product, not engineering):** exact wording; corner, size and opacity; whether it applies to
  both 1:1 and 9:16. It must stay legible on a dark luxury listing *and* a white market-report layout, and must
  never cover price or contact details.

### 3. Library depth — 30–40 templates, several per category

- **Why before the badge goes live:** the library is **10 templates across 9 categories, one each** except
  `listing` (2). A "just sold" post has exactly one option today, so every Buildographic graphic in a city starts
  looking the same. A badge on mediocre or repetitive output is **negative** marketing, broadcast directly to the
  buyer persona. Depth is a precondition for switching the badge on, not a parallel track.
- 30–40 is a judgement call, not a researched figure. Worth checking what a competing Indian real-estate template
  library actually holds before treating it as the target.

### 4. Brand kit — US-LAUNCH-016 / US-LAUNCH-017

- Both stories are **already written and hardened**, and **now unblocked** — their DTO-validation ACs depended on
  BL-30, fixed 2026-10-02.
- This is what makes the whole plan coherent: **free = our mark, paid = your mark.** A free user has no brand kit,
  so the badge occupies the exact space that would otherwise carry *their* logo. The upgrade is additive, not a
  ransom.
- It is also the highest-retention feature available per rupee of build cost. Template access is not an exit cost;
  a brand configured across every design is.

### 5. Raise the free allowance, flip the badge on

- FREE is **3 generations/month** today. Three is too stingy to seed any distribution — and at zero users, cost
  control is irrelevant (3 × 0 = ₹0). The scarce resource right now is attention, not compute.
- `docs/business/COMPREHENSIVE_PRICING_ANALYSIS.md` already proposes 5/month at ₹13.70 cost. For the first ~100
  users, considerably more generous is defensible and still cheaper than a month of Railway.
- **Raising volume and switching the badge on are the same decision**, not opposing ones: more free output means
  more badges in circulation.
- **Never write "forever" or "unlimited" in copy.** Keep the right to tighten terms for future cohorts. The promise
  removed in step 1 is exactly that trap — written as though users already existed.

### 6. Go get users, and put one real ₹ through checkout

- **No rupee has ever moved through production checkout** (BL-29, US-LAUNCH-005 AC5/6), and checkout is live and
  unguarded right now. A stranger could be the first person to exercise the production payment path.
- Listed last in build order, but it is **not** last in importance — it is the only item here with money attached.
  Steps 2–5 are infrastructure for growth that has not started.

---

## The honest caveat about this whole plan

A badge is a distribution **multiplier**, and the current multiplicand is zero. None of steps 2–5 create a single
user. They make acquisition compound once it starts working.

So the real risk is that this sequence *feels* like progress while the two actual bottlenecks go untouched: nobody
knows the product exists, and no payment has ever succeeded. Steps 2 and 3 are cheap and worth doing; they should
not be allowed to displace step 6.

**Summary:** templates won't retain anyone, but they'll acquire everyone. Monetise the brand kit and the drop
cadence; give the catalogue away.
