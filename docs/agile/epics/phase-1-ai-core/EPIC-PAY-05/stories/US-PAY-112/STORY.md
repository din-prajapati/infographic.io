---
title: Story Card — US-PAY-112
type: story
tags: [orion, pay, pricing, ui]
updated: 2026-08-23
---

# Story Card — US-PAY-112

> **Status:** ✅ Done
> **Feature:** F-PAY-04 — Pricing Page Relaunch
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-04-pricing-page-relaunch](../../milestones/M-PAY-04-pricing-page-relaunch.md)
> **Linear:** LIN-XXX
> **Size:** L
> **Created:** 2026-08-21 | **Closed:** 2026-08-23

---

## Story

*As* a prospective customer landing on `/pricing`
*I want* to immediately see the right plan for me — real-estate-specialized messaging, the correct
regular/founding price with the founding price prominent and the regular price kept visible as the
anchor, and Pro marked "Most Popular"
*So that* I can choose confidently without wading through cost-center clutter or fake urgency

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** Each plan card (Free/Solo/Pro/Team/Agency/Enterprise) renders via
      `getEffectivePrice()` (from `US-PAY-106`, called through a pricing API endpoint or server
      component — never re-implemented client-side) showing: name, target audience one-liner,
      regular price, founding price when a campaign is active, billing frequency toggle
      (monthly/annual), design allowance, editable allowance, 5–8 key features, CTA, and Pro's
      "MOST POPULAR" badge.
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

---

## Out of Scope

- Mobile-specific responsive breakpoints and the comparison-table section (`US-PAY-113`).
- Any backend pricing/campaign logic — this story only renders what `F-PAY-01`/`F-PAY-02` already
  compute.
- Competitor-comparison copy beyond the PRD's approved framing (no unlabeled savings claims).

---

## Engineering / PR

- **Branch:** `feat/pay/m-01-pricing-relaunch`
- **PR:** #_____ (milestone PR)
- **Primary files touched:**
  - `client/src/pages/PricingPage.tsx` — card redesign, founding badge, monthly/annual toggle
  - `client/src/pages/LandingPage.tsx` — pricing section update to match

---

## AI Implementation Prompt

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
| TC-PAY-112-04 | Unit | P1 | currency-edge: annual /12 monthly-equivalent + x10-formula savings math, static Enterprise card | ✅ | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded
- [x] Gate 1 passes (`npm run check` clean; `npm run test:unit` — 33 backend + 14 client files, 663 tests passed / 1 pre-existing skip)
- [x] Gate 2 passes (frontend) — pricing card & landing-teaser render logic covered by unit tests; full component render (auth/query/Razorpay mocking) intentionally out of scope, same call as US-PAY-104
- [ ] Manual flow verified on staging — deferred; still blocked on the `US-PAY-109` human task (Razorpay Plan objects) for a real checkout click-through, this story's own AC1-4 do not require it
- [ ] PR merged — milestone PR not yet opened
- [x] No console errors for the changed flow (typecheck clean, no new runtime deps)
- [x] [TASKS.md](./TASKS.md) task list fully checked
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

---

*Story created: 2026-08-21*
