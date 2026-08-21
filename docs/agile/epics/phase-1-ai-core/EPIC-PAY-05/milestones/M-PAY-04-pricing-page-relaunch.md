---
title: M-PAY-04-pricing-page-relaunch — Pricing Page Relaunch
type: milestone
tags: [orion, pay, pricing, ui]
updated: 2026-08-21
---

# M-PAY-04-pricing-page-relaunch — Pricing Page Relaunch

> **Epic:** [EPIC-PAY-05](../EPIC.md)
> **Feature:** F-PAY-04
> **Status:** 🔲 Not Started
> **Target date:** TBD
> **Branch:** `feat/pay/m-01-pricing-relaunch`

---

## Goal

A customer looking at the pricing page immediately understands the real-estate specialization, sees
the correct regular/founding price with the founding price displayed prominently and the regular
price kept visible as the anchor, and the page works on mobile and desktop without a 20-row feature
wall.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-PAY-112](../stories/US-PAY-112/STORY.md) | Pricing page redesign — cards, founding badge, toggle | L | US-PAY-102, US-PAY-106 | 🔲 | — |
| 2 | [US-PAY-113](../stories/US-PAY-113/STORY.md) | Responsive layout + comparison section + messaging | S | US-PAY-112 | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] Each plan card shows: name, target audience, regular price, founding price (when active),
      billing frequency, design allowance, editable allowance, 5–8 key features, CTA, badge
- [ ] Pro is visibly marked "Most Popular"
- [ ] Founding price is prominent; regular price stays visible as the anchor (strikethrough or
      equivalent) whenever a campaign is active
- [ ] No fake scarcity or countdown — any claimed remaining-slots count is real backend data or not
      shown at all
- [ ] No Ideogram/GPT/API cost language anywhere on the page
- [ ] Mobile and desktop layouts both verified, not just desktop
- [ ] All stories above have status ✅ Done
- [ ] Verification gates pass (Gate 1 + Gate 2 frontend + manual visual check)

---

## Notes / Blockers

- Blocked on M-PAY-01 (needs real `PLAN_CONFIG` tiers) and `US-PAY-106` (needs the price-resolution
  service to actually render correct numbers) — don't start the visual redesign against
  placeholder/hardcoded prices.

---

*Milestone created: 2026-08-21*
