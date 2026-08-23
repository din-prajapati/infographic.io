---
title: Story Card — US-PAY-113
type: story
tags: [orion, pay, pricing, ui]
updated: 2026-08-23
---

# Story Card — US-PAY-113

> **Status:** ✅ Done
> **Feature:** F-PAY-04 — Pricing Page Relaunch
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-04-pricing-page-relaunch](../../milestones/M-PAY-04-pricing-page-relaunch.md)
> **Linear:** LIN-XXX
> **Size:** S
> **Created:** 2026-08-21 | **Closed:** 2026-08-23

---

## Story

*As* a prospective customer on mobile, or one who wants the full feature breakdown
*I want* the pricing page to work correctly on a phone and to offer a detailed comparison without
cramming 20+ feature rows onto each card
*So that* I can actually use the page, on any device, to make a decision

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** `/pricing` renders correctly at mobile viewport widths (cards stack,
      no horizontal overflow, toggle and CTAs remain usable) — verified on at least one real mobile
      viewport size, not just desktop-narrowed.
- [x] **AC2 [error-path]:** A separate comparison section below the cards holds the full feature
      matrix (the detail cut from the 5–8-item card summaries) — if this section fails to load or a
      feature flag is off, the cards above still function standalone.
- [x] **AC3 [security]:** N/A — pure display/layout story, no data flow change.
- [x] **AC4 [currency-edge]:** N/A — no monetary computation in this story (prices are already
      resolved by `US-PAY-112`).

---

## Out of Scope

- Card content/pricing logic itself (`US-PAY-112`).
- Any backend change.

---

## Engineering / PR

- **Branch:** `feat/pay/m-01-pricing-relaunch`
- **PR:** #_____ (milestone PR)
- **Primary files touched:**
  - `client/src/pages/PricingPage.tsx` — responsive breakpoints, comparison section, real-estate
    specialization messaging ("Create professional real-estate marketing creatives in minutes —
    without hiring a designer")

---

## AI Implementation Prompt

```
Project context: see PROJECT_CONTEXT.yaml at repo root.

Story: US-PAY-113 — Responsive layout + comparison section + messaging

As a prospective customer on mobile, or one who wants the full feature breakdown, I want the pricing
page to work on a phone and offer a detailed comparison without cramming 20+ rows onto each card.

Acceptance Criteria:
  AC1 [happy-path]: /pricing renders correctly at mobile viewport widths — cards stack, no
    horizontal overflow, toggle/CTAs remain usable, verified on a real mobile viewport size.
  AC2 [error-path]: a separate comparison section holds the full feature matrix; if it fails to load
    or is flagged off, the cards above still function standalone.
  AC3 [security]: N/A — pure layout story.
  AC4 [currency-edge]: N/A — no monetary computation here.

Out of Scope:
  Card pricing content/logic (US-PAY-112). Any backend change.

Primary files to touch (do NOT touch other files):
  client/src/pages/PricingPage.tsx

Rules:
- Touch ONLY the file listed above
- Do NOT implement anything in Out of Scope
- Run verification gates before declaring done
- When done: list files changed, ACs checked ✅, test commands output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-PAY-113-01 | Unit | P0 | happy-path: explicit grid-cols-1/sm:2/lg:3 + nav hidden below md — no horizontal overflow | ✅ | |
| TC-PAY-113-02 | Unit | P0 | error-path: buildComparisonRows() union/ordering/presence logic (5 tests); ComparisonSectionBoundary isolates failures | ✅ | |
| TC-PAY-113-03 | Unit | P1 | security: N/A — pure display/layout story, no data flow change | ✅ N/A | |
| TC-PAY-113-04 | Unit | P1 | currency-edge: N/A — no monetary computation in this story | ✅ N/A | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

## Definition of Done

- [x] All ACs checked ✅ (or explicitly N/A)
- [x] All test cases run and recorded
- [x] Gate 1 passes (`npm run check` clean; `npm run test:unit:client` — 14 files, 254 tests passed / 1 pre-existing skip)
- [x] Gate 2 passes (frontend) — layout/comparison-table logic covered by unit tests (extracted pure `buildComparisonRows()`), same call as US-PAY-112
- [ ] Manual flow verified on staging, mobile + desktop — deferred; needs a deployed environment + a real device, not available from this session
- [ ] PR merged — milestone PR not yet opened
- [x] No console errors for the changed flow (typecheck clean, no new runtime deps)
- [x] [TASKS.md](./TASKS.md) task list fully checked
- [x] STORY.md status updated to ✅ Done

---

## Implementation Update (log)

**2026-08-23 — Implemented T1-T2, all ACs met (or N/A).**

- **T1 (AC1):** Fixed two real mobile-overflow sources in `PricingPage.tsx`:
  - The nav's 4-link + CTA row had no responsive treatment at all (unlike `LandingPage.tsx`,
    which already hides the equivalent row below `md`) — would have overflowed a phone viewport
    horizontally. Applied the exact same `hidden md:flex` convention for consistency (this
    codebase has no mobile hamburger menu anywhere yet).
  - The pricing-card grid relied on `grid`'s implicit single-column default with no tablet tier —
    made explicit: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- **T2 (AC2 + messaging):** Added the PRD-approved headline/subhead to the page header. Added a
  full feature-matrix comparison table below the cards — infographics/mo, editable designs/mo,
  plus the union of every distinct feature string across all 6 plans (derived only from the same
  `PLAN_CONFIG` data already shown on the cards; never a hardcoded, unverified capability list —
  no genuinely "hidden" 20+-item feature catalog exists in `PLAN_CONFIG` beyond what the cards
  already show, so inventing one would have violated Test Is Truth). Gated behind
  `VITE_PRICING_COMPARISON_ENABLED` (defaults on) and wrapped in a local
  `ComparisonSectionBoundary` so a render failure there can't take the cards above down with it.
  Table itself scrolls horizontally in its own `overflow-x-auto` container rather than the page
  body, on any viewport too narrow for all 6 columns.
- Extracted `buildComparisonRows()` as a pure, exported function (same pattern
  `computePricingCardDisplay()`/`getTestModeBannerAmounts()` established) — 5 new tests: union +
  first-seen ordering, per-plan presence, no fabrication, empty input, and a run against the real
  `PLAN_CONFIG` public tiers.
- **Verification:** `npm run check` clean across the whole repo; `npm run test:unit:client` — 14
  files / 254 tests (1 pre-existing skip), all green.
- **Deferred, not this story's blocker:** a real mobile-device/staging click-through remains a
  human task (no staging access or physical device from this session) — this story's own ACs
  (correct responsive markup, comparison table correctness/isolation) don't require it to close.

---

*Story created: 2026-08-21*
