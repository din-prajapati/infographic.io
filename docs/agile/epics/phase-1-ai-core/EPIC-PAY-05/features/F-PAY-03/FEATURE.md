---
title: F-PAY-03 — Billing Integration (Razorpay)
type: feature
tags: [orion, pay, pricing, razorpay]
updated: 2026-08-21
---

# F-PAY-03 — Billing Integration (Razorpay)

> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Phase:** Phase 1 — Revenue Strategy
> **Status:** 🔲 Not Started
> **Domain:** PAY
> **Created:** 2026-08-21 | **Closed:** —

---

## Feature Summary

**What:** Real Razorpay Plan IDs for PRO/AGENCY, checkout that passes `offer_id` server-side instead
of trusting a client-computed discount, and webhook-driven entitlement activation for the new tiers.

**Why:** Pricing and campaign config mean nothing until money actually moves correctly — this
feature is where the relaunch becomes real, chargeable, and safe against a classic "trust the client
price" bug.

**Who:** Any customer completing checkout on a new or existing tier.

**Success signal:** A test subscription on staging, under an active Founding campaign, is charged
the correct founding amount — verified against the real Razorpay payment record.

---

## Milestones in this Feature

| Milestone | Goal | Target | Status | Stories |
|-----------|------|--------|:------:|---------|
| [M-PAY-03-billing-integration](../../milestones/M-PAY-03-billing-integration.md) | Plan IDs, checkout offer_id, webhook mapping | TBD | 🔲 | US-PAY-109, 110, 111 |

---

## Stories in this Feature

| Story ID | Title | Milestone | Size | Status | PR |
|----------|-------|-----------|:----:|:------:|:--:|
| [US-PAY-109](../../stories/US-PAY-109/STORY.md) | New Razorpay Plan IDs for PRO/AGENCY tiers | M-PAY-03 | S | 🔲 | — |
| [US-PAY-110](../../stories/US-PAY-110/STORY.md) | Checkout passes `offer_id` server-side | M-PAY-03 | M | 🔲 | — |
| [US-PAY-111](../../stories/US-PAY-111/STORY.md) | Webhook/entitlement mapping for new tiers | M-PAY-03 | S | 🔲 | — |

---

## Out of Scope (Feature Level)

- Stripe (secondary provider, disabled by default — untouched).
- Any change to existing SOLO/TEAM/BROKERAGE Plan IDs already configured.
- UI display of billing state (F-PAY-04 / existing `SubscriptionCard.tsx`).

---

## Dependencies

| Type | Description | Owner |
|------|-------------|-------|
| Requires | F-PAY-01 (tiers must exist), F-PAY-02 (`getEffectivePrice()` + a real campaign to test `offer_id` against) | — |
| Blocks | F-PAY-04's founding-price display should be verified against real checkout behavior, not just config | — |
| External | Razorpay dashboard Plan creation (human task) — see [ENV.yaml](../../ENV.yaml) | Dinesh |

---

## Definition of Done (Feature)

- [ ] All milestones in this feature are ✅ Done
- [ ] All stories are ✅ Done (STORY.md status + PR merged)
- [ ] A real test checkout (staging, Razorpay test mode) on PRO or AGENCY succeeds at the correct
      amount, with and without an active campaign
- [ ] Verified on staging
- [ ] EPIC.md feature row updated to ✅ Done
- [ ] PHASE_TRACKER.md updated

---

*Feature created: 2026-08-21*
