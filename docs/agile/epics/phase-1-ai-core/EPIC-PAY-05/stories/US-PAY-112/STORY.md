---
title: Story Card — US-PAY-112
type: story
tags: [orion, pay, pricing, ui]
updated: 2026-08-24
---

# Story Card — US-PAY-112

> **Status:** ✅ Done — code-complete through two passes: the original data/founding-badge build
> (2026-08-23) and a full visual rebuild to a later-supplied "final curated mockup"
> (`design-preview-pricing.html`, 2026-08-23/24). See the 2026-08-24 note below and the
> Implementation Update log for what changed between the two.
> **Feature:** F-PAY-04 — Pricing Page Relaunch
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-04-pricing-page-relaunch](../../milestones/M-PAY-04-pricing-page-relaunch.md)
> **Linear:** LIN-XXX
> **Size:** L → grew past its original estimate — the visual pass alone (below) was effectively a
> second L-sized piece of work on the same file.
> **Created:** 2026-08-21 | **Closed:** 2026-08-23 (data/founding-badge) — visual pass followed on
> the same story, 2026-08-23/24

---

## Story

*As* a prospective customer landing on `/pricing`
*I want* to immediately see the right plan for me — real-estate-specialized messaging, the correct
regular/founding price with the founding price prominent and the regular price kept visible as the
anchor, and Pro marked "Most Popular"
*So that* I can choose confidently without wading through cost-center clutter or fake urgency

---

## 2026-08-24 note — scope grew into a full visual rebuild, on this same story

The user supplied a "final curated mockup design" (`design-preview-pricing.html`, committed at repo
root as the design reference) well after this story's original 2026-08-23 close, and asked for a
full implementation plan, then explicit approval to build it — a light "Rocket"-style rebrand
replacing the page's original dark app-shell theme entirely (new nav, hero, card visual system,
new "What is a Design?" gallery, Platform Capabilities section, marquee, restyled FAQ/footer/
Enterprise banner), not just the founding-badge/toggle work this story originally scoped.

Per explicit user direction, this was implemented **as an amendment to this same story** (not a new
milestone/story) — "we later on change the story description as per plan" is this update. Real
consequences worth recording here rather than only in commit messages:

- **This story's original Out of Scope explicitly excluded "the comparison-table section
  (`US-PAY-113`)."** The visual pass touched it anyway — restyled into a 3-category layout with
  colored tick+label cells — because a single visual language had to span the whole page. The
  comparison table's *data logic* (`buildComparisonRows()`, its extraction, its tests) is still
  `US-PAY-113`'s authorship and untouched; only its *rendering* changed here. `US-PAY-113`'s own
  STORY.md still needs a matching note — not yet done, flagged, not silently skipped.
- **AC1's 6-card grid (5 tiers + a static Enterprise card) is gone.** Confirmed with the user:
  dropped the Enterprise card to match the mockup's clean 5-card grid; Enterprise now lives only in
  Agency's inline "Contact Sales" link and a full-width CTA banner near the bottom. AC1 below is
  revised to reflect this rather than left describing a card that no longer exists.
- **`LandingPage.tsx` was explicitly left untouched this pass** (unlike the original T3, which did
  update it) — its pricing teaser still reflects the *old* dark theme, now visually inconsistent
  with `/pricing`. Known gap, not a miss; scoped out to keep this pass to one file.
- **New product decisions made during this pass, not in the original ACs:**
  - Real `PLAN_CONFIG` prices/×10 annual formula kept authoritative over the mockup's own
    (lower, illustrative) numbers and its `×12×0.8` formula.
  - Currency toggle kept in the UI but gated server-side on `ProviderInfo.stripeEnabled` — hidden
    behind an INR-only badge until USD billing is actually confirmed live.
  - PRO's checkout button was deliberately taken off the "unconfigured tier → Contact us" safety
    gate ahead of its Razorpay Plan IDs actually existing, per explicit, time-boxed user direction
    ("we will configure it in Razorpay in a couple of days") — **a real, accepted risk**: clicking
    "Choose Pro" today can fail server-side until `HUMAN_TASKS.md` #6 closes.
  - Comparison-table content stays limited to rows backed by a real `PLAN_CONFIG` field or shipped
    capability — confirmed twice with the user, who supplied the mockup's fuller table (including
    a PDF-export claim that contradicts this page's own FAQ, plus rendering-priority/support-tier
    claims with no backing anywhere) and both times chose to keep the page accurate over matching
    the mockup's marketing copy verbatim.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** Each plan card (Free/Solo/Pro/Team/Agency — **revised 2026-08-24, no
      6th static Enterprise card**, see note above) renders via `getEffectivePrice()` (from
      `US-PAY-106`, called through a pricing API endpoint — never re-implemented client-side)
      showing: name, target audience one-liner, regular price, founding price when a campaign is
      active, a billing frequency toggle (monthly/annual — **revised 2026-08-24: one global toggle
      in the hero, not a per-card switch**), design allowance, bespoke per-tier feature bullets, CTA,
      and Pro's "MOST POPULAR" badge. Enterprise is reached via Agency's inline "Contact Sales" link
      and the bottom CTA banner instead of its own card.
- [x] **AC2 [error-path]:** When no campaign is active (`PricingCampaign.isActive` is false for
      all rows), cards show only the regular price — no leftover founding-badge markup, no broken
      strikethrough with nothing to strike through.
- [x] **AC3 [security]:** The page never renders a client-computed discounted price — the number
      shown is exactly what `getEffectivePrice()` returned from the server, and checkout is passed
      that same resolved tier/interval, never a client-side recalculation.
- [x] **AC4 [currency-edge]:** Every displayed price is formatted correctly from the integer-rupee
      values `getEffectivePrice()` returns (PLAN_CONFIG prices are integer rupees, not paise — e.g.
      `5499` → `₹5,499`, not `₹5499.00` or a rounding artifact) using the page's single existing
      `.toLocaleString()` formatting convention (fixed in `US-PAY-104`).
- [x] **AC5 [visual, added 2026-08-24]:** The page's full visual system matches
      `design-preview-pricing.html` — nav, hero, card grid, and every section below it — while every
      *number and capability claim* still traces to `PLAN_CONFIG`/the pricing API, never the
      mockup's own (lower, illustrative) figures or its unbacked marketing rows. See the 2026-08-24
      note above for the specific decisions this required.

---

## Out of Scope

- Any backend pricing/campaign logic — this story only renders what `F-PAY-01`/`F-PAY-02` already
  compute.
- Competitor-comparison copy beyond the PRD's approved framing (no unlabeled savings claims).
- **Revised 2026-08-24:** the comparison table's visual restyling is now IN scope for this story
  (see note above) — its underlying data logic stays `US-PAY-113`'s. `LandingPage.tsx` parity with
  the new visual system is explicitly OUT of scope for this pass (known gap, not yet done).
- Real USD billing / a live currency toggle — the toggle exists in the UI but is gated off
  (`ProviderInfo.stripeEnabled`) until Stripe/USD support is actually confirmed live; wiring real
  conversion is separate future work.
- Fixing the PDF-export / rendering-priority / support-tier claims from the mockup's fuller
  comparison table — those aren't real capabilities yet; adding them for real is a future story once
  (if) the underlying product work ships, not a documentation fix here.

---

## Engineering / PR

- **Branch:** `feat/pay/m-01-pricing-relaunch`
- **PR:** #_____ (milestone PR)
- **Primary files touched:**
  - **2026-08-23 (data/founding-badge pass):** `client/src/pages/PricingPage.tsx` (card redesign,
    founding badge, monthly/annual toggle), `client/src/pages/LandingPage.tsx` (pricing section
    parity), `api/src/modules/payments/controllers/pricing.controller.ts` (new)
  - **2026-08-23/24 (visual pass):** `client/src/pages/PricingPage.tsx` only — full re-skin, no
    other file touched (see the 2026-08-24 note's `LandingPage.tsx` gap above).
    `design-preview-pricing.html` committed at repo root as the design reference.

---

## AI Implementation Prompt

> Historical — this is the original 2026-08-21 prompt for the data/founding-badge pass (T1-T4).
> It was not rewritten for the 2026-08-23/24 visual pass (T5-T8); see the 2026-08-24 note and the
> Implementation Update log above for that scope instead.

```
Project context: see PROJECT_CONTEXT.yaml at repo root.

Story: US-PAY-112 — Pricing page redesign — cards, founding badge, toggle

As a prospective customer landing on /pricing, I want to immediately see the right plan for me —
real-estate-specialized messaging, correct regular/founding price with founding prominent and
regular kept as the anchor, Pro marked Most Popular.

Acceptance Criteria:
  AC1 [happy-path]: each card renders via getEffectivePrice() (never re-implemented client-side)
    showing name, audience, regular price, founding price if active, billing toggle, design/editable
    allowance, 5-8 features, CTA, Pro's MOST POPULAR badge.
  AC2 [error-path]: with no active campaign, cards show only regular price — no orphaned
    founding-badge markup.
  AC3 [security]: displayed price is exactly what getEffectivePrice() returned server-side; checkout
    uses that same resolved value, never a client recalculation.
  AC4 [currency-edge]: every price formats correctly from integer paise using the single existing
    formatting helper.

Out of Scope:
  Mobile responsive breakpoints and comparison table (US-PAY-113). Backend pricing/campaign logic.
  Unlabeled competitor savings claims.

Primary files to touch (do NOT touch other files):
  client/src/pages/PricingPage.tsx
  client/src/pages/LandingPage.tsx

Rules:
- Touch ONLY the files listed above
- Do NOT implement anything in Out of Scope
- Run verification gates before declaring done
- When done: list files changed, ACs checked ✅, test commands output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-PAY-112-01 | Unit | P0 | happy-path: active founding campaign surfaces regular + effective price, Pro badge unaffected | ✅ | |
| TC-PAY-112-02 | Unit | P0 | error-path: no active campaign -> no strikethrough/badge; redemption-cap edge case | ✅ | |
| TC-PAY-112-03 | Unit | P1 | security: PricingController forwards getEffectivePrice() untouched, no client recompute | ✅ | |
| TC-PAY-112-04 | Unit | P1 | currency-edge: annual /12 monthly-equivalent + x10-formula savings math, static Enterprise card | ✅ | Note (2026-08-24): "static Enterprise card" fixture case still passes — `computePricingCardDisplay()`'s `isStatic` param is unchanged — but the card itself no longer exists in the rendered grid (see AC1 revision). The function-level test still legitimately covers a card that could be static (e.g. a future re-add), it just doesn't correspond to live UI today. |
| TC-PAY-112-05 | Manual | P1 | visual (added 2026-08-24): rendered page matches `design-preview-pricing.html` section-by-section; real `PLAN_CONFIG` prices/×10 annual math shown, not the mockup's own numbers; currency toggle hidden (INR-only) since `stripeEnabled` is false | ✅ | Verified via local Playwright screenshots against the dev server and against the mockup file directly, side-by-side, across three review passes (initial build, aesthetic fix-up, comparison-table styling) |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded
- [x] Gate 1 passes (`npm run check` clean; `npm run test:unit:client` — 14 files, 254 tests passed / 1 pre-existing skip, re-verified after each of the 4 visual-pass commits)
- [x] Gate 2 passes (frontend) — pricing card & comparison-table logic covered by unit tests (`computePricingCardDisplay`/`buildComparisonRows` signatures unchanged); full component render (auth/query/Razorpay mocking) intentionally out of scope, same call as US-PAY-104. Visual correctness verified via local Playwright screenshots, not a formal Gate 2 review.
- [ ] Manual flow verified on staging — deferred; still blocked on the `US-PAY-109` human task (Razorpay Plan objects) for a real checkout click-through. **New since 2026-08-24:** PRO's button is deliberately live ahead of this (see note above) — its real checkout attempt will fail until `HUMAN_TASKS.md` #6 closes; this is an accepted, time-boxed risk, not an oversight.
- [ ] PR merged — milestone PR not yet opened
- [x] No console errors for the changed flow (typecheck clean throughout; local Playwright runs confirmed 0 console errors on each visual-pass commit)
- [x] [TASKS.md](./TASKS.md) task list fully checked (T5–T8 added for the visual pass)
- [x] STORY.md status updated to ✅ Done

---

## Implementation Update (log)

**2026-08-23 — Implemented T1-T4, all ACs met.**

- **T1:** Added `GET /api/v1/pricing` (`api/src/modules/payments/controllers/pricing.controller.ts`),
  a thin public/unauthenticated orchestrator returning `PricingResolutionService.getEffectivePrice()`
  for both intervals across the five public tiers (FREE/SOLO/PRO/TEAM/AGENCY — BROKERAGE excluded,
  being phased out; ENTERPRISE excluded, static/no `PLAN_CONFIG` entry). Registered in
  `payments.module.ts`. Added `pricingApi.getPricing()` + `EffectivePriceResult` type to
  `client/src/lib/api.ts`. Covered by `api/tests/payments/pricing.controller.spec.ts` (4 tests).
- **T2:** Redesigned `PricingPage.tsx`'s card grid to source every price from the new endpoint
  instead of computing annual/discount math client-side (retired `calculateAnnualPrice`/
  `calculateMonthlySavings`, the stale ×12×0.85 formula, and the `plan.price` field). Added the PRO
  + AGENCY cards, dropped the old Individual/Enterprise segment toggle in favor of one unified
  5-tier grid plus a static Enterprise card (Custom price, "Contact Sales" CTA, no annual toggle,
  never calls `handleSubscribe` with a non-`PlanTier` value). Added the founding-campaign badge +
  strikethrough regular price (shown only when the resolved result's `campaignId` is non-null and
  `effectivePrice !== regularPrice` — closes AC2's "no orphaned markup" requirement, including the
  redemption-cap-reached edge case where a campaign is still active but has no discount left to
  give). Added PRO's "MOST POPULAR" ribbon.
- **T3:** Updated `LandingPage.tsx`'s pricing teaser (kept at its existing 3-tier FREE/SOLO/TEAM
  scope — the 5-tier grid stays exclusive to `/pricing`) to pull from the same
  `GET /api/v1/pricing` endpoint, so a founding badge/price can never drift between the two pages.
  Retired the same stale ×12×0.85 local formula there.
- **T4:** Extracted the per-card pricing derivation into a pure, exported
  `computePricingCardDisplay()` function (same pattern `getTestModeBannerAmounts()` established for
  US-PAY-104) and added 8 tests covering: active founding campaign, no campaign, the
  redemption-cap-reached edge case, annual ÷12 monthly-equivalent math, the ×10-formula's 2-months-
  free savings amount, the free tier (no annual toggle), the static Enterprise card, and undefined
  pricing (API not yet loaded).
- **Verification:** `npm run check` clean across the whole repo; `npm run test:unit` — 33 backend
  files / 414 tests + 14 client files / 249 tests (1 pre-existing skip), all green.
- **Deferred to the human task list, not this story's scope:** an actual staging checkout
  click-through remains blocked on `US-PAY-109`'s Razorpay Plan objects (`HUMAN_TASKS.md` #6); this
  story's ACs are about correct price *display*, not checkout completion.

### 2026-08-23/24 — Visual pass: full rebuild to the "final curated mockup" (T5–T8)

User supplied `design-preview-pricing.html` well after the above close, asked for a plan, then
approved it (with two locked decisions: keep real `PLAN_CONFIG` numbers over the mockup's own, drop
the 6th static Enterprise card) and explicit process direction to implement in one pass on this same
story rather than opening a new milestone. Four commits, three review rounds:

- **T5 (`381651d`) — full re-skin.** Replaced the page's dark app-shell theme (glass panels,
  `--page-bg` gradient, Unsplash CTA photo) with a forced-light "Rocket"-style system matching the
  mockup exactly — new nav (dropped the currency capsule initially), gradient hero with a single
  global Monthly/Yearly toggle (replacing the old per-card `annualToggles` state; "2 months free"
  badge instead of a flat percentage, since only `×10` is uniformly true across tiers), the 5-card
  grid (6th Enterprise card removed per the locked decision), a new "What is an AI Marketing
  Design?" example gallery, a restyled comparison table (2 categories, PLAN_CONFIG-backed rows
  only), a new Platform Capabilities section, a real-estate marquee (reusing the existing
  `<Marquee>` component from `LandingPage.tsx`), restyled FAQ/Enterprise-banner/footer. All existing
  data wiring (`computePricingCardDisplay`, `buildComparisonRows`, `handleSubscribe` →
  `createSubscriptionMutation` → `openRazorpayCheckout`) reused unchanged — this was a rendering
  pass, not a logic rewrite. `design-preview-pricing.html` committed as the design reference.
  Verified: `npm run check` (0 errors), `npm run test:unit:client` (254/254, 1 pre-existing skip).
- **T6 (`7a31823`) — aesthetic correction after direct mockup comparison.** A side-by-side
  Playwright screenshot diff against the mockup file caught two real gaps in T5: the cards had
  fallen back to generic `PLAN_CONFIG.features` strings with per-tier icons the mockup doesn't use,
  instead of the mockup's bespoke per-tier bullet copy; and the comparison table's flat row list
  duplicated the numeric design-count row in a confusing, sparse way. Fixed both — added
  `planFeatureBullets` (bespoke per-tier card copy, local to this file, not written into
  `PLAN_CONFIG`) and re-grouped the comparison table into 3 categories (Creation & Output /
  Branding & Customization / Platform & Support). **Caught and fixed a real content bug**, not just
  copied from the mockup: the mockup's SOLO card claims "PDF, JPG & PNG Export," which contradicts
  this same page's own FAQ ("PDF export is coming soon") — reworded rather than shipping a
  self-contradicting page.
- **T7 (`7068039`) — PRO checkout button, time-boxed ahead of config.** PRO was falling into the
  `unconfiguredPaidTiers` safety gate (`US-LAUNCH-007`) and showing a dark "Contact us" mailto
  instead of a real checkout button, because its Razorpay Plan IDs genuinely aren't in `.env` yet
  (confirmed directly — `HUMAN_TASKS.md` #6, `US-PAY-109` T0, still open). Asked the user before
  changing this (real payment-integrity implication); they confirmed: exclude PRO specifically from
  the gate now, real Plan IDs are coming "in a couple of days." AGENCY and any other genuinely
  unconfigured tier still correctly falls back to "Contact us" — this is a targeted, documented
  exception, not a removal of the safety mechanism.
- **T8 (`ff6209f`) — comparison-table visual polish, content request declined twice.** User pasted
  the mockup's full comparison-table data (richer rows: multi-format export claims, Agent Headshot
  badges, Rendering Priority tiers, Customer Support tiers) and asked to match its "tick icon and
  text both in color" look. Asked before implementing: (1) the mockup's PDF claim would
  self-contradict the FAQ again — user chose to keep the FAQ authoritative; (2) the remaining new
  rows have no `PLAN_CONFIG` field or shipped capability behind any of them — user chose to skip
  them, same discipline as T6. Shipped only the visual ask: `renderComparisonRow()` now renders a
  check icon + text label ("Included"/"Permanent") together, colored per column (brand-orange for
  PRO, dark elsewhere) — applied to the same real rows already in the table, no new content added.
- **Verification across all four commits:** `npm run check` (0 errors each time), `npm run
  test:unit:client` (254 passed / 1 pre-existing skip, unchanged throughout — `computePricingCardDisplay`/
  `buildComparisonRows`'s signatures and behavior were never touched, only their rendering), and a
  local Playwright screenshot pass against the actual dev server after each commit (0 console
  errors each time).
- **Still open, not this pass's blocker:** `LandingPage.tsx` parity with the new visual system;
  `US-PAY-113`'s own STORY.md doesn't yet reflect that its comparison-table rendering moved into
  this story's scope; a real staging/mobile click-through (same human-environment gap as before);
  and the PRO-button risk noted in the DoD above, time-boxed by the user.

---

*Story created: 2026-08-21*
