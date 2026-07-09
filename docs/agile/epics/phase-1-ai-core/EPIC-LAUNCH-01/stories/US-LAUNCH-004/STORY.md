# Story Card — US-LAUNCH-004

> **Status:** 🔲 Not Started
> **Feature:** F-LAUNCH-03 — Beta Launch Mode
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-01-public-beta](../../milestones/M-LAUNCH-01-public-beta.md)
> **Size:** S
> **Linear:** LIN-XXX
> **Created:** 2026-07-07 | **Closed:** —

---

## Story

*As the* product operator launching a free public beta
*I want* paid checkout disabled behind a single flag and an AI-content disclaimer on generation output
*So that* real agents can use the product before EPIC-AI-06 ships, with the synthetic-photo limitation disclosed as a beta limitation rather than mis-sold as listing marketing.

---

## Acceptance Criteria

- [ ] **AC1:** With `VITE_BETA_MODE=true`, the PricingPage shows a "Free during beta" notice and paid tiers render **without** checkout buttons (replaced by a disabled "Available after beta" state) — FREE tier signup unaffected
- [ ] **AC2:** With `BETA_MODE=true` on the backend, the subscription-creation endpoint returns 403 with a clear `BETA_MODE_ACTIVE` error code (defense in depth — the UI hiding alone is not the gate)
- [ ] **AC3:** Generation results (editor result view and/or export flow) display a disclaimer: imagery may include AI-generated visuals and must be verified before being published to represent a real listing — exact copy in the story PR, no AI vendor names
- [ ] **AC4:** Setting both flags to `false` (or unset) restores current paid behavior with no other code change — single-switch revenue-on
- [ ] **AC5:** `npm run test:unit` includes a test for the 403 beta guard

---

## Out of Scope

- Waitlist / invite codes — beta is open
- Feature-flag service or DB-driven flags — env vars are the Phase 1 answer
- Any change to plan enforcement/limits (FREE=3/mo stays as is)
- Turning the flags ON in production (deploy/ops decision, not this PR)

---

## Engineering / PR

- **Branch:** `feat/launch-us-launch-004-beta-mode`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/pages/PricingPage.tsx`
  - `api/src/modules/payments/controllers/payments.controller.ts` `(TBC — subscription create endpoint)`
  - `client/src/components/editor/` result/export component `(TBC — locate generation result surface)`
  - `.env.example`
  - `api/tests/payments/beta-guard.spec.ts` (new)

---

## AI Implementation Prompt

> Copy this block into Claude Code / Cursor to implement the story.

```
Context: InfographicAI SaaS — NestJS API (3001) + React frontend (5000). See CLAUDE.md.

Story: US-LAUNCH-004 — Beta launch mode

Frontend: when import.meta.env.VITE_BETA_MODE === 'true', PricingPage renders paid tiers
with a disabled "Available after beta" button + "Free during beta" banner. Add an
AI-content disclaimer line on the generation result surface: "This image may include
AI-generated visuals. Verify before publishing to represent a real listing." (no vendor names).
Backend: when process.env.BETA_MODE === 'true', subscription-create returns 403
{ code: 'BETA_MODE_ACTIVE' }. Unit test the guard. Update .env.example.

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- Do NOT implement anything in "Out of scope"
- Flags off must be byte-for-byte current behavior
- When done: list files changed, ACs checked, test command to run
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-LAUNCH-004-01 | Manual | P0 | Given VITE_BETA_MODE=true, when viewing /pricing, then no paid checkout button is clickable and beta notice shows | 🔲 | |
| TC-LAUNCH-004-02 | Auto (unit) | P0 | Given BETA_MODE=true, when POST subscription-create, then 403 BETA_MODE_ACTIVE | 🔲 | |
| TC-LAUNCH-004-03 | Auto (unit) | P0 | Given BETA_MODE unset, when POST subscription-create, then existing behavior unchanged | 🔲 | |
| TC-LAUNCH-004-04 | Manual | P1 | Given a completed generation, then the AI-content disclaimer is visible on the result surface | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual flow verified on `localhost:5000`
- [ ] PR merged (PR #_____)
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-07-07*
