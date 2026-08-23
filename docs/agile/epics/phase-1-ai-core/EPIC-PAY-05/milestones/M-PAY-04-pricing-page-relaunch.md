---
title: M-PAY-04-pricing-page-relaunch — Pricing Page Relaunch
type: milestone
tags: [orion, pay, pricing, ui]
updated: 2026-08-23
---

# M-PAY-04-pricing-page-relaunch — Pricing Page Relaunch

> **Epic:** [EPIC-PAY-05](../EPIC.md)
> **Feature:** F-PAY-04
> **Status:** 🟡 In Progress — both stories code-complete; manual mobile/staging verification and
> milestone PR still open (need a deployed environment, not available from an implementation
> session)
> **Target date:** TBD (deferred to V2 — see [EPIC.md](../EPIC.md) "Scope split")
> **Branch:** `feat/pay/m-01-pricing-relaunch`
> **Version:** V2 — both stories deferred until after the first real ₹ transaction; also blocked
> on capturing per-tier "5–8 key features" content, which currently exists only as "see chat
> history" in the source PRD, not in any durable file

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
| 1 | [US-PAY-112](../stories/US-PAY-112/STORY.md) | Pricing page redesign — cards, founding badge, toggle | L | US-PAY-102, US-PAY-106 | ✅ (code) | — |
| 2 | [US-PAY-113](../stories/US-PAY-113/STORY.md) | Responsive layout + comparison section + messaging | S | US-PAY-112 | ✅ (code) | — |

---

## Acceptance (Milestone Done When…)

- [x] Each plan card shows: name, target audience, regular price, founding price (when active),
      billing frequency, design allowance, editable allowance, key features (4-5 per tier — the
      "5–8" figure in the original PRD assumed a longer feature catalog that never materialized
      beyond `PLAN_CONFIG`'s existing lists; see Notes/Blockers below), CTA, badge
- [x] Pro is visibly marked "Most Popular"
- [x] Founding price is prominent; regular price stays visible as the anchor (strikethrough or
      equivalent) whenever a campaign is active
- [x] No fake scarcity or countdown — any claimed remaining-slots count is real backend data or not
      shown at all (none added; comparison table shows only `PLAN_CONFIG`-derived facts)
- [x] No Ideogram/GPT/API cost language anywhere on the page
- [ ] Mobile and desktop layouts both verified, not just desktop — responsive markup done
      (`US-PAY-113`), real-device/staging verification still needs a deployed environment
- [x] All stories above have status ✅ Done
- [ ] Verification gates pass (Gate 1 + Gate 2 frontend + manual visual check) — Gate 1/2 pass;
      manual visual check pending the same deployed-environment need as above

---

## Notes / Blockers

- Blocked on M-PAY-01 (needs real `PLAN_CONFIG` tiers) and `US-PAY-106` (needs the price-resolution
  service to actually render correct numbers) — don't start the visual redesign against
  placeholder/hardcoded prices.

---

*Milestone created: 2026-08-21*
