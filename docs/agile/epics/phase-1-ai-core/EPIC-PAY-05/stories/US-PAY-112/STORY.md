---
title: Story Card — US-PAY-112
type: story
tags: [orion, pay, pricing, ui]
updated: 2026-08-21
---

# Story Card — US-PAY-112

> **Status:** 🔲 Not Started
> **Feature:** F-PAY-04 — Pricing Page Relaunch
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-04-pricing-page-relaunch](../../milestones/M-PAY-04-pricing-page-relaunch.md)
> **Linear:** LIN-XXX
> **Size:** L
> **Created:** 2026-08-21 | **Closed:** —

---

## Story

*As* a prospective customer landing on `/pricing`
*I want* to immediately see the right plan for me — real-estate-specialized messaging, the correct
regular/founding price with the founding price prominent and the regular price kept visible as the
anchor, and Pro marked "Most Popular"
*So that* I can choose confidently without wading through cost-center clutter or fake urgency

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** Each plan card (Free/Solo/Pro/Team/Agency/Enterprise) renders via
      `getEffectivePrice()` (from `US-PAY-106`, called through a pricing API endpoint or server
      component — never re-implemented client-side) showing: name, target audience one-liner,
      regular price, founding price when a campaign is active, billing frequency toggle
      (monthly/annual), design allowance, editable allowance, 5–8 key features, CTA, and Pro's
      "MOST POPULAR" badge.
- [ ] **AC2 [error-path]:** When no campaign is active (`PricingCampaign.isActive` is false for
      all rows), cards show only the regular price — no leftover founding-badge markup, no broken
      strikethrough with nothing to strike through.
- [ ] **AC3 [security]:** The page never renders a client-computed discounted price — the number
      shown is exactly what `getEffectivePrice()` returned from the server, and checkout is passed
      that same resolved tier/interval, never a client-side recalculation.
- [ ] **AC4 [currency-edge]:** Every displayed price is formatted from integer paise correctly
      (`549900` → `₹5,499`, not `₹5499.00` or a rounding artifact) using the page's single existing
      formatting helper (fixed in `US-PAY-104`).

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
|-------|------|:--------:|----------|:------:|---------|
| TC-PAY-112-01 | Manual | P0 | Given the Founding campaign active on staging, when /pricing loads, then every paid card shows founding price prominent + regular price struck through | 🔲 | |
| TC-PAY-112-02 | Manual | P0 | Given no active campaign, when /pricing loads, then only regular prices show, no orphaned badge | 🔲 | |
| TC-PAY-112-03 | Unit | P1 | Given each PLAN_CONFIG tier, when rendered, then displayed price matches getEffectivePrice() output exactly | 🔲 | |
| TC-PAY-112-04 | Manual | P1 | Given the Pro card, when /pricing loads, then it's visibly marked "MOST POPULAR" | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] Gate 1 passes
- [ ] Gate 2 passes (frontend)
- [ ] Manual flow verified on staging
- [ ] PR merged
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

## Implementation Update (log)

---

*Story created: 2026-08-21*
