---
title: PR Task List — US-PAY-112
type: template
tags: [orion, template]
updated: 2026-08-24
---

# PR Task List — US-PAY-112

> **Story:** [STORY.md](./STORY.md)
> **Milestone branch:** `feat/pay/m-01-pricing-relaunch`
> **PR:** #_____
> **Linear:** LIN-XXX

---

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md filled
- [ ] **Muscle** — T1-T3 with exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded

---

## PR Scope Summary

**One-liner:** Redesign pricing cards — real-estate messaging, founding badge, Pro "Most Popular", monthly/annual toggle.

```
feat(pay): redesign pricing cards with founding badge and annual toggle — US-PAY-112
```

---

## Task Breakdown

### T1 — Pricing API endpoint (if none exists) exposing getEffectivePrice()
- **File:** `api/src/modules/payments/controllers/pricing.controller.ts` (new, if no existing
  pricing-read endpoint) or extend an existing one
- **Type:** `feat`
- **AC(s) covered:** AC1, AC3
- **Changes:**
  - `GET /api/v1/pricing` — returns `getEffectivePrice()` output for every tier × interval,
    read-only, no auth required (public pricing page)

**Commit:**
```bash
git add api/src/modules/payments/controllers/pricing.controller.ts
git commit -m "feat(pay): add public pricing-resolution endpoint — US-PAY-112"
```

---

### T2 — PricingPage.tsx card redesign
- **File:** `client/src/pages/PricingPage.tsx`
- **Type:** `feat`
- **AC(s) covered:** AC1, AC2, AC4
- **Changes:**
  - Cards for Free/Solo/Pro/Team/Agency/Enterprise per STORY.md AC1
  - Monthly/annual toggle switching displayed prices
  - Founding badge + struck-through regular price only when a campaign is active
  - Pro "MOST POPULAR" badge

**Commit:**
```bash
git add client/src/pages/PricingPage.tsx
git commit -m "feat(pay): redesign pricing cards with founding badge, toggle, Pro badge — US-PAY-112"
```

---

### T3 — LandingPage.tsx pricing section parity
- **File:** `client/src/pages/LandingPage.tsx`
- **Type:** `feat`
- **AC(s) covered:** AC1
- **Changes:**
  - Update the embedded pricing section to match `PricingPage.tsx`'s new source of truth (same
    `getEffectivePrice()` API call, same card summary)

**Commit:**
```bash
git add client/src/pages/LandingPage.tsx
git commit -m "feat(pay): update LandingPage pricing section to match relaunch — US-PAY-112"
```

---

### T4 — Tests
- **File:** `client/src/pages/__tests__/PricingPage.spec.tsx` (extend)
- **Type:** `test`
- **AC(s) covered:** AC1, AC2, AC4
- **Changes:** Cover TC-PAY-112-03

**Commit:**
```bash
git add client/src/pages/__tests__/PricingPage.spec.tsx
git commit -m "test(pay): cover pricing card rendering against getEffectivePrice() — US-PAY-112"
```

---

### T5 — Full visual re-skin to `design-preview-pricing.html` (added 2026-08-24)
- **File:** `client/src/pages/PricingPage.tsx`, `design-preview-pricing.html` (new, design reference)
- **Type:** `feat`
- **AC(s) covered:** AC5
- **Changes:** see STORY.md's 2026-08-23/24 Implementation Update entry — full nav/hero/card/section
  rebuild; existing data wiring (T1-T4 above) reused unchanged.

**Commit:** `381651d` — `feat(pay): visual redesign of pricing page to final curated mockup — US-PAY-112`

---

### T6 — Aesthetic correction after mockup comparison (added 2026-08-24)
- **File:** `client/src/pages/PricingPage.tsx`
- **Type:** `fix`
- **AC(s) covered:** AC5
- **Changes:** bespoke per-tier `planFeatureBullets` (replacing generic feature-string rendering +
  per-tier icons), 3-category comparison-table regroup, PDF-claim correction to match the page's
  own FAQ.

**Commit:** `7a31823` — `fix(pay): closer aesthetic match on pricing cards + comparison table — US-PAY-112`

---

### T7 — PRO checkout button live ahead of Razorpay config (added 2026-08-24)
- **File:** `client/src/pages/PricingPage.tsx`
- **Type:** `fix`
- **AC(s) covered:** none directly — a scoped, time-boxed exception to the `US-LAUNCH-007`
  unconfigured-tier gate, per explicit user direction
- **Changes:** excluded PRO specifically from `unconfiguredPaidTiers` at the CTA render site;
  documented the accepted risk inline and in STORY.md's DoD.

**Commit:** `7068039` — `fix(pay): PRO checkout button live ahead of Razorpay Plan setup — US-PAY-112`

---

### T8 — Comparison-table tick+label styling (added 2026-08-24)
- **File:** `client/src/pages/PricingPage.tsx`
- **Type:** `style`
- **AC(s) covered:** AC5
- **Changes:** `renderComparisonRow()` now renders a check icon + text label together, colored per
  column (brand-orange for PRO, dark elsewhere) — same rows as before, no new content (two content
  additions from the mockup's fuller table were explicitly declined, see STORY.md).

**Commit:** `ff6209f` — `style(pay): colored tick+label comparison-table cells — US-PAY-112`

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `pricing.controller.ts` | T1 | AC1, AC3 | new, if needed |
| `PricingPage.tsx` | T2, T5, T6, T7, T8 | AC1, AC2, AC4, AC5 | main redesign, then full visual pass |
| `LandingPage.tsx` | T3 | AC1 | parity as of 2026-08-23; **not** updated for the T5-T8 visual pass — known gap |
| `PricingPage.spec.tsx` | T4 | AC1, AC2, AC4 | unchanged by T5-T8 — same 15 tests still pass |
| `design-preview-pricing.html` | T5 | — | design reference, committed not authored |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
```

---

## Task Checklist

- [x] T1 — pricing API endpoint (file: `pricing.controller.ts`, type: `feat`)
- [x] T2 — card redesign (file: `PricingPage.tsx`, type: `feat`)
- [x] T3 — landing page parity (file: `LandingPage.tsx`, type: `feat`)
- [x] T4 — tests (file: `PricingPage.spec.tsx`, type: `test`)
- [x] T5 — full visual re-skin (file: `PricingPage.tsx`, type: `feat`) — commit `381651d`
- [x] T6 — aesthetic correction after mockup comparison (file: `PricingPage.tsx`, type: `fix`) — commit `7a31823`
- [x] T7 — PRO checkout button live ahead of config (file: `PricingPage.tsx`, type: `fix`) — commit `7068039`
- [x] T8 — comparison-table tick+label styling (file: `PricingPage.tsx`, type: `style`) — commit `ff6209f`
- [x] Gate 1 passes ✅ (`npm run check` + `npm run test:unit` — 33+14 files, 663 tests green as of 2026-08-23; re-verified `npm run test:unit:client` — 254/254, 1 pre-existing skip — after each of T5-T8)
- [x] Gate 2 passes ✅ (card/teaser display logic unit-tested via extracted pure functions; T5-T8's visual correctness verified via local Playwright screenshots, not a formal Gate 2 review)
- [ ] Manual test verified (staging, with and without active campaign) — blocked on US-PAY-109 human task (Razorpay Plan objects) for a real checkout click-through. T7 deliberately made PRO's button live ahead of this — accepted, time-boxed risk, see STORY.md.
- [ ] PR opened with story card as description — milestone PR not yet opened
- [x] STORY.md ACs ticked off ✅ (AC5 added for the visual pass)
- [x] EPIC.md "Implementation Update" log appended ✅ (2026-08-24 entry added for T5-T8)

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT recompute discounted prices client-side — always call the pricing API / server-resolved
  value.
- Do NOT add fake countdown timers or "X spots left" unless backed by real
  `redemptionsUsed`/`maxRedemptions` data.

---

*Tasks created: 2026-08-21*
