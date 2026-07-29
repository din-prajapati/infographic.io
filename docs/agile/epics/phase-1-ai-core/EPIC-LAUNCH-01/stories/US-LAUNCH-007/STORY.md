# Story Card — US-LAUNCH-007

> **Status:** ✅ Done
> **Feature:** F-LAUNCH-04 — Payments Go-Live
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-02-revenue-on](../../milestones/M-LAUNCH-02-revenue-on.md)
> **Size:** S
> **Resolves:** PT-06 (BROKERAGE plan IDs not configured)
> **Linear:** LIN-XXX
> **Created:** 2026-07-07 | **Closed:** 2026-07-29

---

## Story

*As a* brokerage visitor on the pricing page
*I want* the BROKERAGE tier to lead somewhere real (a contact CTA) instead of a checkout that cannot work
*So that* the pricing page never offers a dead purchase path — BROKERAGE has no RazorPay plan IDs configured in any environment (PT-06).

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** `PricingPage.tsx` renders the BROKERAGE tier with a "Contact us" CTA (mailto or contact link) instead of a checkout/subscribe button — decision recorded here: **gate, don't configure** (creating live BROKERAGE plans is deferred until first brokerage demand)
- [x] **AC2 [edge-case]:** The gate is driven by plan-ID availability, not hardcoded to BROKERAGE: any tier whose RazorPay plan ID env vars are unset renders without a checkout button (BROKERAGE today; protects against future misconfig of SOLO/TEAM)
- [x] **AC3 [error-path]:** Backend: a create-subscription request for a tier with no configured plan ID returns 400 with a clear error code (e.g. `PLAN_NOT_AVAILABLE`), not a 500 from a missing env var
- [x] **AC4 [regression]:** Unit test covers AC3; PT-06 marked resolved in PROJECT_CONTEXT.md Known Issues with a pointer to this story

---

## Out of Scope

- Creating BROKERAGE plans in RazorPay (test or live) — deferred to first brokerage lead
- White-label features implied by the BROKERAGE description
- Contact form / CRM integration — a mailto link is sufficient
- Changes to SOLO/TEAM checkout behavior

---

## Engineering / PR

- **Branch:** `feat/launch/m-02-emails-and-gate`
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
| TC-LAUNCH-007-01 | Manual | P0 | Given /pricing, when viewing BROKERAGE, then "Contact us" CTA shown and no checkout can be initiated | ✅ | Verified live on production (buildographic.com/pricing → Enterprise tab, 2026-07-29): BROKERAGE renders a distinct "Contact us" button, not a checkout CTA |
| TC-LAUNCH-007-02 | Auto (unit) | P0 | Given create-subscription for BROKERAGE (no plan IDs), then 400 PLAN_NOT_AVAILABLE, not 500 | ✅ | Implemented as `plan-availability.spec.ts` TC-LAUNCH-007-01 |
| TC-LAUNCH-007-03 | Manual | P1 | Given SOLO/TEAM with configured plan IDs, then checkout behavior unchanged | ✅ | Verified live on production (2026-07-29): SOLO and TEAM both show a "Try Buildographic" checkout CTA, unaffected by the BROKERAGE gate |
| TC-LAUNCH-007-04 | Auto (unit) | P1 | Given BROKERAGE has no plan-ID env var, then `getAvailablePlans()` returns `configured: false` for it | ✅ | Implemented as `plan-availability.spec.ts` TC-LAUNCH-007-02 (added during implementation — the `configured` field wasn't in the original spec) |
| TC-LAUNCH-007-05 | Auto (unit) | P1 | Given BROKERAGE's plan-ID env var is set, then `getAvailablePlans()` returns `configured: true` for it | ✅ | Implemented as `plan-availability.spec.ts` TC-LAUNCH-007-03 |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded
- [x] `npm run check` passes
- [x] `npm run test:unit` passes
- [x] Manual flow verified — TC-01/03 confirmed live on production 2026-07-29 (see Test Cases)
- [x] PR merged — no PR; deployed via direct commit, documented exception below
- [x] [TASKS.md](./TASKS.md) task list fully checked

> **DoD exception:** No PR was opened — code shipped via direct commit `fa1d345` to `main`, consistent with this repo's own precedent for US-LAUNCH-001/002/003/009/010/011. Gate 1 passed on the commit. Approved by: Dinesh, 2026-07-29.

---

*Story created: 2026-07-07*
