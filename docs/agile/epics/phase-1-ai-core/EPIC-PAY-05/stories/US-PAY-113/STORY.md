---
title: Story Card — US-PAY-113
type: story
tags: [orion, pay, pricing, ui]
updated: 2026-08-24
---

# Story Card — US-PAY-113

> **Status:** ✅ Done — this story's own deliverables (`buildComparisonRows()`, the responsive
> breakpoint fix, the original RE-specialization messaging) shipped and closed 2026-08-23. A later,
> unrelated visual rebuild of the whole page (`US-PAY-112`'s 2026-08-23/24 visual pass) rendered
> over parts of this story's surface — see the 2026-08-24 note below for exactly what still stands
> as this story's own work versus what changed underneath it.
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

## 2026-08-24 note — `US-PAY-112`'s visual pass rendered over part of this story's surface

`US-PAY-112` closed 2026-08-23 with an explicit Out-of-Scope line excluding "the comparison-table
section (`US-PAY-113`)" — i.e. this story. A day later the user supplied a full page mockup and,
per explicit direction, that redesign was implemented as an amendment to `US-PAY-112` rather than a
new story, and it touched this story's surface anyway because one visual language had to span the
whole page. What that means concretely, so this story's own record stays accurate:

- **Still this story's own, unchanged work:** `buildComparisonRows()` — the union/first-seen-order/
  presence logic, its exported signature, and all 5 of its own unit tests — was never touched by the
  visual pass. It's still the single source of truth for *which* features appear in the comparison
  table; only how those rows are *drawn* changed elsewhere.
- **Rendering moved into `US-PAY-112`'s scope:** the comparison table's visual treatment — originally
  a flat single-category checkmark table (this story's T2) — is now a 3-category layout (Creation &
  Output / Branding & Customization / Platform & Support) with colored tick+label cells, built in
  `US-PAY-112`'s T5/T8. The table still calls `buildComparisonRows()` from this story unchanged; only
  its JSX wrapper changed. `ComparisonSectionBoundary` and the `VITE_PRICING_COMPARISON_ENABLED` gate
  (both this story's AC2 delivery) are also untouched.
- **AC2's specific messaging was replaced, not just restyled.** This story's exact PRD-approved
  headline/subhead ("Create professional real-estate marketing creatives in minutes — without hiring
  a designer" / "AI-powered property marketing, branding and campaign creation built specifically for
  real estate") is no longer on the page — the visual pass replaced it with the mockup's own hero
  copy ("AI Marketing for Real Estate. Priced by Output." / "Create property creatives, campaigns and
  editable designs without the designer bottleneck."). The real-estate specialization *intent* AC2
  asked for is still met by the new copy, but the specific PRD-approved wording this story shipped is
  gone — worth a product read if that exact phrasing mattered for a reason not visible in this file.
- **AC1's specific breakpoint implementation was replaced, not just its outcome.** This story's fix
  was `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (6-card grid, this story's T1 commit `b0d0c66`).
  The current grid is `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5` (5-card grid, since
  `US-PAY-112`'s visual pass dropped the 6th Enterprise card) — a different breakpoint scheme
  entirely, not a tweak of this one. The underlying goal AC1 asked for (no horizontal overflow, usable
  toggle/CTAs on a phone) is still the intent of the new grid, but it has not been re-verified against
  a real mobile viewport since this change — same open gap TC-PAY-113-01 already had.
  The nav's `hidden md:flex` responsive fix (this story's other T1 contribution) is untouched.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** `/pricing` renders correctly at mobile viewport widths (cards stack,
      no horizontal overflow, toggle and CTAs remain usable) — verified on at least one real mobile
      viewport size, not just desktop-narrowed. **2026-08-24:** the specific breakpoint markup this
      verified against was since replaced by `US-PAY-112`'s visual pass (see note above) — the intent
      still holds in the new grid but hasn't been independently re-verified on a real mobile
      viewport; still deferred the same way the original manual/staging check always was (DoD below).
- [x] **AC2 [error-path]:** A separate comparison section below the cards holds the full feature
      matrix (the detail cut from the 5–8-item card summaries) — if this section fails to load or a
      feature flag is off, the cards above still function standalone. **2026-08-24:** the isolation
      mechanism (`ComparisonSectionBoundary` + `VITE_PRICING_COMPARISON_ENABLED`) is untouched and
      still true; the specific PRD-approved messaging this AC also delivered was replaced by the
      mockup's copy in the same visual pass (see note above) — flagged, not silently absorbed.
- [x] **AC3 [security]:** N/A — pure display/layout story, no data flow change.
- [x] **AC4 [currency-edge]:** N/A — no monetary computation in this story (prices are already
      resolved by `US-PAY-112`).

---

## Out of Scope

- Card content/pricing logic itself (`US-PAY-112`).
- **2026-08-24:** the comparison table's *visual rendering* (categorization, tick+label styling) is
  no longer this story's active surface — it now lives in `US-PAY-112`'s visual pass (see note
  above). This story's own `buildComparisonRows()` data logic remains authoritative and unchanged.
- Any backend change.

---

## Engineering / PR

- **Branch:** `feat/pay/m-01-pricing-relaunch`
- **PR:** #_____ (milestone PR)
- **Primary files touched:**
  - `client/src/pages/PricingPage.tsx` — responsive breakpoints, comparison section, real-estate
    specialization messaging ("Create professional real-estate marketing creatives in minutes —
    without hiring a designer") — **2026-08-24: the breakpoint markup and messaging text listed
    here were both since replaced by `US-PAY-112`'s visual pass on the same file; see the
    2026-08-24 note above.** `buildComparisonRows()` and the comparison section's isolation
    mechanism, this story's real logic contribution, are untouched.

---

## AI Implementation Prompt

> Historical — this is the original 2026-08-21 prompt. The breakpoint scheme and messaging text it
> describes were both superseded by `US-PAY-112`'s 2026-08-23/24 visual pass; see the 2026-08-24
> note above for what actually renders today. `buildComparisonRows()` itself is unaffected.

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
| TC-PAY-113-01 | Unit | P0 | happy-path: explicit grid-cols-1/sm:2/lg:3 + nav hidden below md — no horizontal overflow | ✅ | 2026-08-24: the grid-cols-1/sm:2/lg:3 markup this passed against is gone (`US-PAY-112`'s visual pass replaced it with grid-cols-1/md:2/lg:3/xl:5, 5-card grid) — the nav's `hidden md:flex` half is unchanged. Not re-run against the new markup; same deferred-to-staging gap as before, not a new one. |
| TC-PAY-113-02 | Unit | P0 | error-path: buildComparisonRows() union/ordering/presence logic (5 tests); ComparisonSectionBoundary isolates failures | ✅ | Still passes unchanged — this logic was never touched by `US-PAY-112`'s visual pass |
| TC-PAY-113-03 | Unit | P1 | security: N/A — pure display/layout story, no data flow change | ✅ N/A | |
| TC-PAY-113-04 | Unit | P1 | currency-edge: N/A — no monetary computation in this story | ✅ N/A | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

## Definition of Done

- [x] All ACs checked ✅ (or explicitly N/A)
- [x] All test cases run and recorded
- [x] Gate 1 passes (`npm run check` clean; `npm run test:unit:client` — 14 files, 254 tests passed / 1 pre-existing skip)
- [x] Gate 2 passes (frontend) — layout/comparison-table logic covered by unit tests (extracted pure `buildComparisonRows()`), same call as US-PAY-112
- [ ] Manual flow verified on staging, mobile + desktop — deferred; needs a deployed environment + a real device, not available from this session. **2026-08-24:** verify against the current 5-card `md:2/lg:3/xl:5` grid, not the original 6-card `sm:2/lg:3` markup this AC was written against.
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

### 2026-08-24 — Cross-reference note: `US-PAY-112`'s visual pass rendered over this story's surface

Not a re-implementation of this story — recording what changed underneath it. `US-PAY-112` closed a
day after this story with an explicit Out-of-Scope line excluding the comparison-table section
(this story). The user then supplied a full-page mockup and, per their direction, that redesign was
implemented as an amendment to `US-PAY-112` on the same branch — and it touched this story's
surface anyway, since the redesign had to be one consistent visual language across the whole page.

- `buildComparisonRows()` (this story's actual logic contribution) is untouched — same signature,
  same 5 tests, still green.
- The comparison table's *rendering* (flat single-category table → 3-category layout with colored
  tick+label cells) now lives in `US-PAY-112`'s T5/T8 (commits `381651d`, `ff6209f`).
- This story's exact PRD-approved messaging ("Create professional real-estate marketing creatives in
  minutes...") was replaced by the mockup's own hero copy in the same pass — not restyled, replaced.
- This story's exact breakpoint fix (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, commit `b0d0c66`)
  was replaced by a different scheme (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`) as
  part of dropping the 6th Enterprise card — the nav's `hidden md:flex` fix from the same T1 is
  untouched.
- Full detail, decisions, and verification evidence for the visual pass itself live in
  `US-PAY-112/STORY.md`'s 2026-08-24 note and Implementation Update entry, and in
  `EPIC.md`'s matching 2026-08-24 log entry — not duplicated here.
- **Still open:** a real mobile-device/staging verification of the *current* grid (this story's
  original deferred item, now against different markup than what TC-PAY-113-01 originally covered).

---

*Story created: 2026-08-21*
