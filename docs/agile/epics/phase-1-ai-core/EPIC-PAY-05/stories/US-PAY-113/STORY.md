---
title: Story Card — US-PAY-113
type: story
tags: [orion, pay, pricing, ui]
updated: 2026-08-21
---

# Story Card — US-PAY-113

> **Status:** 🔲 Not Started
> **Feature:** F-PAY-04 — Pricing Page Relaunch
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-04-pricing-page-relaunch](../../milestones/M-PAY-04-pricing-page-relaunch.md)
> **Linear:** LIN-XXX
> **Size:** S
> **Created:** 2026-08-21 | **Closed:** —

---

## Story

*As* a prospective customer on mobile, or one who wants the full feature breakdown
*I want* the pricing page to work correctly on a phone and to offer a detailed comparison without
cramming 20+ feature rows onto each card
*So that* I can actually use the page, on any device, to make a decision

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** `/pricing` renders correctly at mobile viewport widths (cards stack,
      no horizontal overflow, toggle and CTAs remain usable) — verified on at least one real mobile
      viewport size, not just desktop-narrowed.
- [ ] **AC2 [error-path]:** A separate comparison section below the cards holds the full feature
      matrix (the detail cut from the 5–8-item card summaries) — if this section fails to load or a
      feature flag is off, the cards above still function standalone.
- [ ] **AC3 [security]:** N/A — pure display/layout story, no data flow change. Mark explicitly
      `N/A` per harden convention.
- [ ] **AC4 [currency-edge]:** N/A — no monetary computation in this story (prices are already
      resolved by `US-PAY-112`); mark explicitly `N/A`.

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
|-------|------|:--------:|----------|:------:|---------|
| TC-PAY-113-01 | Manual | P0 | Given a 375px-wide mobile viewport, when /pricing loads, then no horizontal scroll and all CTAs are tappable | 🔲 | |
| TC-PAY-113-02 | Manual | P1 | Given the comparison section, when loaded, then the full feature matrix is visible and readable | 🔲 | |
| TC-PAY-113-03 | Manual | P2 | Given the page's primary/supporting messaging, when read, then real-estate specialization is immediately clear (not generic AI image tool framing) | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅ (or explicitly N/A)
- [ ] All test cases run and recorded
- [ ] Gate 1 passes
- [ ] Gate 2 passes (frontend)
- [ ] Manual flow verified on staging, mobile + desktop
- [ ] PR merged
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

## Implementation Update (log)

---

*Story created: 2026-08-21*
