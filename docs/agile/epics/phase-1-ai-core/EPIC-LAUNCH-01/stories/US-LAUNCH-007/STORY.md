# Story Card — US-LAUNCH-007

> **Status:** 🔲 Not Started
> **Feature:** F-LAUNCH-04 — Payments Go-Live
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-02-revenue-on](../../milestones/M-LAUNCH-02-revenue-on.md)
> **Size:** S
> **Resolves:** PT-06 (BROKERAGE plan IDs not configured)
> **Linear:** LIN-XXX
> **Created:** 2026-07-07 | **Closed:** —

---

## Story

*As a* brokerage visitor on the pricing page
*I want* the BROKERAGE tier to lead somewhere real (a contact CTA) instead of a checkout that cannot work
*So that* the pricing page never offers a dead purchase path — BROKERAGE has no RazorPay plan IDs configured in any environment (PT-06).

---

## Acceptance Criteria

- [ ] **AC1:** `PricingPage.tsx` renders the BROKERAGE tier with a "Contact us" CTA (mailto or contact link) instead of a checkout/subscribe button — decision recorded here: **gate, don't configure** (creating live BROKERAGE plans is deferred until first brokerage demand)
- [ ] **AC2:** The gate is driven by plan-ID availability, not hardcoded to BROKERAGE: any tier whose RazorPay plan ID env vars are unset renders without a checkout button (BROKERAGE today; protects against future misconfig of SOLO/TEAM)
- [ ] **AC3:** Backend: a create-subscription request for a tier with no configured plan ID returns 400 with a clear error code (e.g. `PLAN_NOT_AVAILABLE`), not a 500 from a missing env var
- [ ] **AC4:** Unit test covers AC3; PT-06 marked resolved in PROJECT_CONTEXT.md Known Issues with a pointer to this story

---

## Out of Scope

- Creating BROKERAGE plans in RazorPay (test or live) — deferred to first brokerage lead
- White-label features implied by the BROKERAGE description
- Contact form / CRM integration — a mailto link is sufficient
- Changes to SOLO/TEAM checkout behavior

---

## Engineering / PR

- **Branch:** `feat/launch-us-launch-007-brokerage-gate`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/pages/PricingPage.tsx`
  - `api/src/modules/payments/services/payments.service.ts` `(TBC — plan-ID resolution point)`
  - `api/tests/payments/plan-availability.spec.ts` (new)
  - `docs/agile/PROJECT_CONTEXT.md` (PT-06 row)

---

## AI Implementation Prompt

> Copy this block into Claude Code / Cursor to implement the story.

```
Context: InfographicAI SaaS — NestJS API + React frontend. See CLAUDE.md. RazorPay plan IDs
come from env vars (RAZORPAY_PLAN_SOLO_MONTHLY etc.). BROKERAGE has none configured (PT-06).

Story: US-LAUNCH-007 — BROKERAGE tier gate on pricing page

Frontend: tiers without an available plan render a "Contact us" CTA (mailto) instead of
checkout. Availability should flow from the backend plans/pricing endpoint if one exists
(TBC — inspect how PricingPage gets plan data) rather than a hardcoded tier list.
Backend: create-subscription for a tier lacking a configured plan ID → 400 PLAN_NOT_AVAILABLE
(never a 500). Unit test the 400 path. Update PROJECT_CONTEXT.md Known Issues: PT-06 →
✅ Resolved via US-LAUNCH-007 (gated, plans deferred to first brokerage demand).

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- Do NOT create RazorPay plans or change SOLO/TEAM behavior
- When done: list files changed, ACs checked, test command to run
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-LAUNCH-007-01 | Manual | P0 | Given /pricing, when viewing BROKERAGE, then "Contact us" CTA shown and no checkout can be initiated | 🔲 | |
| TC-LAUNCH-007-02 | Auto (unit) | P0 | Given create-subscription for BROKERAGE (no plan IDs), then 400 PLAN_NOT_AVAILABLE, not 500 | 🔲 | |
| TC-LAUNCH-007-03 | Manual | P1 | Given SOLO/TEAM with configured plan IDs, then checkout behavior unchanged | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual flow verified on `localhost:5000`
- [ ] PR merged (PR #_____)
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-07-07*
