---
title: M-PAY-03-billing-integration — Billing Integration
type: milestone
tags: [orion, pay, pricing, razorpay]
updated: 2026-08-25
---

# M-PAY-03-billing-integration — Billing Integration

> **Epic:** [EPIC-PAY-05](../EPIC.md)
> **Feature:** F-PAY-03
> **Status:** 🟡 In Progress — US-PAY-109 blocked on T0 HUMAN task (**live-mode** Razorpay Plan
> objects; test-mode set created + verified 2026-08-27); US-PAY-111 code-complete (manual/PR still
> open); US-PAY-110 **rescoped 2026-08-27 and code-complete** — its `offer_id` dependency on
> US-PAY-108 is gone, since a promo is now its own Plan object
> **Target date:** TBD
> **Branch:** `feat/pay/m-01-pricing-relaunch`
> **Version:** **Mixed** — US-PAY-109 and US-PAY-111 are V1 (PRO/AGENCY sellable at launch);
> US-PAY-110 is V2 (needs the V2 campaign/Offer stories first). See [EPIC.md](../EPIC.md) "Scope split."

---

## Goal

Real Razorpay Plan IDs exist for PRO and AGENCY, checkout charges the correct amount by passing
`offer_id` to Razorpay (never a client-computed discounted price), and webhook-driven entitlement
activation recognizes the new tiers.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR | Version |
|:-----:|-------|-------|:----:|------------|:------:|:--:|:---:|
| 1 | [US-PAY-109](../stories/US-PAY-109/STORY.md) | New Razorpay Plan IDs for PRO/AGENCY tiers | S | US-PAY-102 (M-PAY-01) | 🟡 (blocked) | — | **V1** |
| 2 | [US-PAY-111](../stories/US-PAY-111/STORY.md) | Webhook/entitlement mapping for new tiers | S | US-PAY-109 | ✅ (code) | — | **V1** |
| 2 | [US-PAY-110](../stories/US-PAY-110/STORY.md) | Checkout selects the promo Plan server-side | M | US-PAY-106, US-PAY-109 | 🟡 (rescoped, code done) | — | V2 |

---

## Acceptance (Milestone Done When…)

- [ ] `RAZORPAY_PLAN_PRO_MONTHLY/_ANNUAL` and `RAZORPAY_PLAN_AGENCY_MONTHLY/_ANNUAL` are real,
      configured plan IDs (staging at minimum) — no `|| 'plan_pro'` placeholder fallback silently
      shipping to production
- [ ] Checkout request never accepts a client-supplied discounted amount — the backend resolves
      price via `getEffectivePrice()` and passes `offer_id`, Razorpay computes and validates the
      real charge
- [ ] A subscription created under an active Founding campaign is charged the founding price on
      Razorpay's side, verified against the actual Razorpay order/payment record, not just the app's
      own display
- [ ] Webhook handler correctly activates PRO/AGENCY tier entitlements on `subscription.charged`
- [ ] All stories above have status ✅ Done
- [ ] Verification gates pass (Gate 1 + Gate 4)

---

## Notes / Blockers

- Blocked on the Razorpay dashboard Plan/Offer creation documented in [ENV.yaml](../ENV.yaml) —
  same human-task category as the existing `docs/payments/RAZORPAY_SETUP_GUIDE.md`.
- US-PAY-110 depends on both M-PAY-02 (needs a real campaign + resolution service to test against)
  and this milestone's own US-PAY-109 (needs the Plan IDs to check out against).

---

*Milestone created: 2026-08-21*
