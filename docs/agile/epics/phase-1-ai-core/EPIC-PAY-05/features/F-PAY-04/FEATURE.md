---
title: F-PAY-04 — Pricing Page Relaunch
type: feature
tags: [orion, pay, pricing, ui]
updated: 2026-08-21
---

# F-PAY-04 — Pricing Page Relaunch

> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Phase:** Phase 1 — Revenue Strategy
> **Status:** 🔲 Not Started
> **Domain:** PAY
> **Created:** 2026-08-21 | **Closed:** —

---

## Feature Summary

**What:** A redesigned `/pricing` page — real-estate-specialization messaging, 5-tier cards with
founding badge and regular-price anchor, monthly/annual toggle, a separate comparison section
instead of 20-row cards, mobile and desktop layouts.

**Why:** This is the customer-facing surface the entire epic exists to serve — correct backend
pricing/campaign logic is wasted if the page doesn't communicate it clearly or convert.

**Who:** Every prospective customer landing on the pricing page.

**Success signal:** A visitor immediately understands "AI Marketing Studio for Real Estate," sees
the right price for their situation (regular or founding), and can complete signup without
confusion, on both mobile and desktop.

---

## Milestones in this Feature

| Milestone | Goal | Target | Status | Stories |
|-----------|------|--------|:------:|---------|
| [M-PAY-04-pricing-page-relaunch](../../milestones/M-PAY-04-pricing-page-relaunch.md) | Card redesign + responsive + comparison | TBD | 🔲 | US-PAY-112, 113 |

---

## Stories in this Feature

| Story ID | Title | Milestone | Size | Status | PR |
|----------|-------|-----------|:----:|:------:|:--:|
| [US-PAY-112](../../stories/US-PAY-112/STORY.md) | Pricing page redesign — cards, founding badge, toggle | M-PAY-04 | L | 🔲 | — |
| [US-PAY-113](../../stories/US-PAY-113/STORY.md) | Responsive layout + comparison section + messaging | M-PAY-04 | S | 🔲 | — |

---

## Out of Scope (Feature Level)

- Any backend pricing/campaign/billing logic (F-PAY-01/02/03) — this feature only renders what
  those already compute.
- Competitor comparison claims beyond the PRD's approved framing (no "Save ₹40,000/month" without
  explicit illustrative labeling).

---

## Dependencies

| Type | Description | Owner |
|------|-------------|-------|
| Requires | F-PAY-01 (real tiers), F-PAY-02 (`getEffectivePrice()` for correct numbers) | — |
| Blocks | — (last feature in the epic) | — |
| External | None | — |

---

## Definition of Done (Feature)

- [ ] All milestones in this feature are ✅ Done
- [ ] All stories are ✅ Done (STORY.md status + PR merged)
- [ ] Feature is demonstrable end-to-end locally on both mobile and desktop viewports
- [ ] Verified on staging (if applicable)
- [ ] EPIC.md feature row updated to ✅ Done
- [ ] PHASE_TRACKER.md updated

---

*Feature created: 2026-08-21*
