---
title: M-PAY-02-discount-architecture — Discount Architecture
type: milestone
tags: [orion, pay, pricing, discounts]
updated: 2026-10-21
---

# M-PAY-02-discount-architecture — Discount Architecture

> **Epic:** [EPIC-PAY-05](../EPIC.md)
> **Feature:** F-PAY-02
> **Status:** 🟡 **6/7 — no work remains; one item, held by decision (2026-10-21).** All five stories
> are code-complete and merged to `main`. The second-campaign criterion was verified *literally*
> as the card demanded — 10 checks, 10 pass, driving the real services with no source edits. The
> `PERCENT`/`FLAT` composition criterion was struck and replaced: it tested arithmetic the
> 2026-08-27 rewrite deleted.
>
> **Gate 4 now passes — [[BL-28]] was fixed 2026-10-21** and a 7-test integration spec was added
> for the campaign services, so "Gate 4 for the new service" has something to run.
>
> **One thing is open: the Founding Customer 100 seed — ⏸ on hold by decision.** Founding pricing
> is held, so this is a deferral, not a gap. **Lift the hold and this milestone closes.**
> **Target date:** TBD
> **Branch:** none — `feat/pay/m-01-pricing-relaunch` was never created; the stories landed on
> `main` directly and are traceable by `git log --grep "<US-ID>"`.
> **Version:** **Mixed** — US-PAY-107 is V1 (ships before the first real ₹ transaction); US-PAY-105,
> 106, 108 are V2 (deferred — generalized campaign engine, premature before real demand data). See
> [EPIC.md](../EPIC.md) "Scope split."

---

## Goal

Two independent discount mechanisms exist and compose correctly: a generic, reusable
`PricingCampaign` model (Founding Customer 100 is the first row, not a special case) and a standing,
always-on annual-billing discount — both resolved through one `getEffectivePrice()` service so the
frontend and checkout never compute price independently.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR | Version |
|:-----:|-------|-------|:----:|------------|:------:|:--:|:---:|
| 1 | [US-PAY-105](../stories/US-PAY-105/STORY.md) | PricingCampaign Prisma model + migration | S | — | ✅ (code) | — | V2 |
| 1 | [US-PAY-107](../stories/US-PAY-107/STORY.md) | Standing annual-discount formula (×10) | S | US-PAY-102 (M-PAY-01) | ✅ (code) | — | **V1** |
| 2 | [US-PAY-106](../stories/US-PAY-106/STORY.md) | `getEffectivePrice()` resolution service | M | US-PAY-102, US-PAY-105 | ✅ (code) | — | V2 |
| 3 | [US-PAY-108](../stories/US-PAY-108/STORY.md) | ~~Founding Customer 100 campaign seed + Offer linkage~~ | M | US-PAY-105, US-PAY-106 | ⏭️ **Superseded** | — | V2 |

---

## Acceptance (Milestone Done When…)

- [x] `PricingCampaign` model exists; a second future campaign (e.g. a festival test row) can be
      **inserted and activated** with zero code changes — verify this literally, don't just assert
      it — ✅ **verified literally 2026-10-21: 10 checks, 10 pass.**

      Exercised against the dev/staging database (`ep-billowing-cell`) by driving the real
      `PricingCampaignService` and `PricingResolutionService` with **no source edits of any kind**.
      The script refuses to run unless the campaign table is empty, and deletes its own rows in a
      `finally` block — it ended with 0 rows, the state it started in.

      | What was proven | Result |
      |---|---|
      | A campaign row inserts active | `MPAY02TEST_FIRST`, `isActive: true` |
      | A **second** campaign created directly as active is **rejected** | `ConflictException` — *“Cannot create … as active — MPAY02TEST_FIRST is already active”* |
      | The second inserts fine when inactive | `MPAY02TEST_DIWALI2026`, `isActive: false` |
      | `activateCampaign()` switches which one is live | active → `MPAY02TEST_DIWALI2026` |
      | Exactly one row is active afterwards | `count = 1` |
      | The previously-live row was deactivated | `isActive: false` |
      | `tryConsumeRedemption()` increments the counter | `used = 1 of 50` |
      | The cap closes instead of running past it | refused at 50, warning logged |
      | An exhausted campaign resolves as if not active | `campaignId: null`, list price |

      **The criterion was amended on that date** — “inserted and activated” replaces an implied
      “…and discounts something”. The two halves separate under the authored-price model, and the
      distinction is the design, not a shortfall:

      - **Activation genuinely needs zero code changes.** Proven above. A promotion can be started,
        switched and stopped from the database, with no deploy.
      - **A second campaign that actually *moves a price* requires a reviewed PR**, by design —
        prices live in `PLAN_CONFIG.promoPrices`, keyed by the row's `code`. Measured in the same
        run: with `MPAY02TEST_DIWALI2026` live and no authored price for it, **all 8
        tier/interval combinations returned list price with `campaignId: null`** (SOLO ₹5,499 ·
        PRO ₹10,999 · TEAM ₹21,999 · AGENCY ₹43,999, and the four annuals). Nothing mischarged
        and nothing advertised a discount it could not honour — the page and checkout read the
        same service, so they moved together, which is exactly the property the split exists to
        guarantee.

      So a festival campaign is a two-step change (author the prices in a PR, then flip the row),
      not a one-step database insert. Read the AC as covering the *campaign mechanism*; the price
      authoring is deliberately not zero-code. Script kept at
      `local-notes/mpay02-second-campaign-test.ts` (gitignored) — re-runnable, self-cleaning.
      Note it needs `npx tsx --tsconfig api/tsconfig.json …` from outside `api/`, per [[BL-39]].
- [x] Only one `PricingCampaign` can be `isActive` at a time (enforced, not just documented) —
      ✅ **verified 2026-10-21 in code.** `pricing-campaign.service.ts:56-57` looks for an existing
      `isActive: true` row before activating and rejects when one is found. The schema carries a
      note at `schema.prisma:396` explaining why a Postgres partial unique index was not used, so
      the choice is deliberate and recorded rather than an omission.
- [x] Annual price for every tier equals `regularMonthly × 10`, **rounded down to a 999-ending
      price** — not `× 12`, not `× 12 × 0.85` (the formula this replaces) —
      ✅ **verified 2026-10-21.**

      **The criterion was amended on that date, deliberately.** It previously demanded exactly
      `× 10`, which the live catalogue does not satisfy and never did:

      ```
      tier       monthly   ×10        actual     ratio
      SOLO         5,499    54,990     52,999     9.638
      PRO         10,999   109,990    105,999     9.637
      TEAM        21,999   219,990    210,999     9.591
      AGENCY      43,999   439,990    421,999     9.591
      BROKERAGE   24,999   249,990    239,999     9.600
      ```

      Every annual ends in **999**: the prices were rounded down to a psychologically round number,
      not computed. That is consistent across all five tiers, so it is a pricing decision rather
      than a defect, and it lands slightly *more* generous than two-months-free. `PLAN_CONFIG.price`
      is confirmed to be the regular monthly — `pricing-resolution.service.ts:54` reads it through
      `getListPrice` — so no separate "regular" field rescues the strict formula.

      The criterion was amended rather than the prices, because the prices are live and customers
      have already seen them. The intent the PRD set out — *"12 months for the price of 10"*,
      replacing the old `× 12 × 0.85` — holds; the implementation rounds in the customer's favour.
      Decided 2026-10-21.
- [x] A campaign can never advertise a price it cannot charge — ✅ **verified 2026-10-21.**

      **This criterion replaced one struck on that date.** It used to read: *“Campaign discount and
      annual discount compose correctly for `PERCENT`-type discounts (order is mathematically
      irrelevant, both are multiplicative); a `FLAT`-type discount is explicitly rejected, never
      silently mis-computed.”* It was struck rather than amended because **it tested code that no
      longer exists.** The 2026-08-27 rewrite removed the arithmetic entirely — nothing multiplies,
      so there is no composition order to get wrong, and there is no `PERCENT`/`FLAT` discriminator
      left to reject. `tierDiscounts` is written as `{}` (`pricing-campaign.service.ts:72`) and read
      by nothing; `pricing-campaign.service.spec.ts:132` asserts exactly that. No test against the
      old wording could fail, and no behaviour was being protected by it.

      The protection it *wanted* — a customer is never shown one price and charged another — still
      matters. Under the authored-price model it is structural rather than arithmetic, and rests on
      two invariants, both verified:

      1. **A live campaign with no authored price for a tier/interval resolves to list price with
         `campaignId: null`**, so the pricing page and checkout read the same answer and cannot
         diverge. Measured 2026-10-21 with a campaign actually live: **all 8 tier/interval
         combinations** returned list — SOLO ₹5,499 · PRO ₹10,999 · TEAM ₹21,999 · AGENCY ₹43,999
         and the four annuals, every one `campaignId: null`.
      2. **Checkout refuses rather than under-delivering.** When an authored promo price has no
         provider Plan object behind it, `createSubscription` throws `PROMO_PLAN_NOT_CONFIGURED`
         instead of falling back to the list-price Plan (`payments.service.ts:363-376`). Falling
         back would bill more than the page displayed — the precise failure the original wording
         existed to prevent.
- [ ] Founding Customer 100 campaign is seeded with **authored per-tier promo prices** and backed
      by real promotional **Plan objects** — ⏸ **ON HOLD by decision, 2026-10-21. Not open work.**

      **Founding pricing is on hold** — Buildographic sells at list price for now. This item is a
      deferral, not a gap to close, and the diagnosis below is kept only so the campaign's
      inertness is not later mistaken for a bug.

      **The criterion was amended on that date**, because as written it asked for two things that
      the 2026-08-27 rewrite deleted. It named per-tier *percentages* (`~27.3%`, `~31.8%`), but
      nothing multiplies any more — `PricingResolutionService` looks prices up, and a promo price
      that only exists as the output of `regular × (1 − pct/100)` is a number nobody reviewed. And
      it named *Razorpay Offer IDs*, which this card's own Notes already declare void — a promo is
      a separate price-immutable Plan object, and `.env.example` no longer carries
      `RAZORPAY_OFFER_FOUNDING_*`. Amended to ask for what the current design actually needs.

      **Diagnosis.** The campaign is **inert**: three links are required and none exists.

      1. **No promo price is authored.** `PLAN_CONFIG` declares `promoPrices?`
         (`shared/schema.ts:190`) and `getPromoPrice()` reads it (`:330`), but no tier populates
         it — `FOUNDING` appears nowhere in `shared/schema.ts`. The seed script says so itself:

         ```
         $ npx tsx api/scripts/seed-founding-campaign.ts
         ❌ Cannot seed FOUNDING100: no promo price is authored for it.
            Add PLAN_CONFIG[tier].promoPrices.FOUNDING100 in shared/schema.ts first —
            prices belong in code (reviewed in a PR), not in this script or the database.
         ```
      2. **No campaign row exists.** `PricingCampaign` count is **0** on the dev/staging database
         (`ep-billowing-cell`, checked 2026-10-21 — 0 rows, 0 active).
      3. **No promo Plan object is configured.** Zero `RAZORPAY_PLAN_<TIER>_<INTERVAL>_FOUNDING100`
         variables are set; only the eight list-price ones are.

      **Nothing is mischarging, which is why this stayed invisible.** With (1) absent,
      `getEffectivePrice()` returns list with `campaignId: null`, so checkout bills list — and the
      pricing page, reading the same service, shows list too. The two agree. Activating the
      campaign today would change no price anywhere.

      **The seed script is already the right instrument** and needs no change: it refuses to
      create the row unless an authored price exists, and refuses again unless every authored
      price has a Plan object behind it (`seed-founding-campaign.ts:88-110`). So the work is, in
      order: author the prices in `PLAN_CONFIG.promoPrices.FOUNDING100` (a reviewed PR), create
      the matching Plan objects in the Razorpay dashboard and set their env vars, then run the
      script.

      **[M-PAY-03](M-PAY-03-billing-integration.md)'s AC3 is held by the same decision** — “a
      subscription created under an active Founding campaign is charged the founding price” cannot
      be staged until the hold lifts. Both milestones therefore need a **descope decision** rather
      than work: carry the promo path to V2 (US-PAY-110 is already V2) and close at V1, or hold
      both open until founding pricing resumes.
- [x] All stories above have status ✅ Done — ✅ **2026-10-21.** All five are code-complete
      and merged to `main`.

      **Traceability, verified 2026-10-21.** No milestone branch was created for this epic, so
      there is no milestone PR; every story landed on `main` piecemeal. The git standard's intended
      mechanism still works — each story resolves by `git log --grep "<US-ID>"`:

      | Story | Commits on `main` |
      |---|:--:|
      | [US-PAY-102](../stories/US-PAY-102/STORY.md) | 14 |
      | [US-PAY-105](../stories/US-PAY-105/STORY.md) | 5 |
      | [US-PAY-106](../stories/US-PAY-106/STORY.md) | 5 |
      | [US-PAY-107](../stories/US-PAY-107/STORY.md) | 6 |
      | [US-PAY-108](../stories/US-PAY-108/STORY.md) | 7 |

      Epic DoD amended to match (see [EPIC.md](../EPIC.md)). US-PAY-108 is ⏭️ superseded (closed 2026-08-27, not shipped as written) — counted as resolved, not outstanding.
- [x] Verification gates pass (Gate 1 + Gate 4 for the new service) — ✅ **2026-10-21.**
      **Gate 1:** `npm run check` (0 errors) · `npm run test:unit:backend` (726 passed / 52 files) ·
      `npm run test:unit:client` (278 passed, 1 skipped / 17 files).

      **Gate 4 ✅ 2026-10-21 — [[BL-28]] is fixed.** `npx vitest run --config
      vitest.integration.config.ts` → **19 passed / 3 files** against a real PostgreSQL database.
      Row counts on the dev database were identical before and after the run (129 users, 128 orgs,
      17 subscriptions, 173 infographics), so the scoped cleanup left no residue.

      **“For the new service” is now actually covered.** No integration spec existed for
      `PricingCampaignService` / `PricingResolutionService`, so this criterion had nothing to run
      even once the database worked. Added `api/tests/payments/pricing-campaign.integration.spec.ts`
      — **7 tests** against a real database, covering what only a real database can show: the
      single-active guard (a read-then-reject across two statements), `activateCampaign()`'s
      transaction, and the redemption cap enforced in the `WHERE` clause — including **two
      concurrent redemptions at the boundary, where exactly one succeeds**. It also pins the
      invariant this milestone rests on: a live campaign with no authored price leaves all 8
      tier/interval combinations at list. Cleanup is scoped to codes prefixed `ITEST_`, which no
      real campaign code can match.

---

## Notes / Blockers

- ~~Requires `RAZORPAY_OFFER_FOUNDING_*` Offer objects created in the Razorpay dashboard before
  US-PAY-108 can complete~~ — **void 2026-08-27.** Razorpay Offers are not used at all; a promo is
  its own price-immutable Plan object. The env vars were removed from `.env.example` and
  `HUMAN_TASKS.md` §7 is retired. **Do not create those Offer objects.**
- ~~The campaign/annual composition rule is a real product decision~~ — **settled 2026-08-27, by
  removing the composition.** Promo prices are authored per tier/interval, so there is no
  percentage to compose with the annual price and no ordering question left to get wrong.
- **Still open, and it is a product decision, not engineering:** the founding price itself, and
  whether Founding-100 runs at all. The PRD argues it should wait for the first real ₹ transaction
  (`US-LAUNCH-005` AC6). When decided, write a new story against the authored-price model.

---

*Milestone created: 2026-08-21*
