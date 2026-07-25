# Story Card — US-LAUNCH-004

> **Status:** 🟡 In Review — [PR #18](https://github.com/din-prajapati/infographic.io/pull/18)
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

- [x] **AC1 [happy-path]:** With `VITE_BETA_MODE=true`, the PricingPage shows a "Free during beta" notice and paid tiers render **without** checkout buttons (replaced by a disabled "Available after beta" state) — FREE tier signup unaffected
- [x] **AC2 [error-path]:** With `BETA_MODE=true` on the backend, the subscription-creation endpoint returns 403 with a clear `BETA_MODE_ACTIVE` error code (defense in depth — the UI hiding alone is not the gate)
- [x] **AC3 [happy-path]:** Generation results (editor result view and/or export flow) display a disclaimer: imagery may include AI-generated visuals and must be verified before being published to represent a real listing — exact copy in the story PR, no AI vendor names — fixed: same disclaimer paragraph added to `MessageBubble.tsx` (the conversation-view result surface), not just `ResultsVariations.tsx` (the pre-conversation default view)
- [x] **AC4 [edge-case]:** Setting both flags to `false` (or unset) restores current paid behavior with no other code change — single-switch revenue-on
- [x] **AC5 [happy-path]:** `npm run test:unit` includes a test for the 403 beta guard

---

## Out of Scope

- Waitlist / invite codes — beta is open
- Feature-flag service or DB-driven flags — env vars are the Phase 1 answer
- Any change to plan enforcement/limits (FREE=3/mo stays as is)
- Turning the flags ON in production (deploy/ops decision, not this PR)

---

## Engineering / PR

- **Branch:** `feat/launch-us-launch-004-beta-mode`
- **PR:** [#18](https://github.com/din-prajapati/infographic.io/pull/18)
- **Primary files touched:**
  - `client/src/pages/PricingPage.tsx`
  - `api/src/modules/payments/controllers/payments.controller.ts`
  - `client/src/components/ai-chat/ResultsVariations.tsx` (pre-conversation result surface)
  - `client/src/components/ai-chat/MessageBubble.tsx` (conversation-view result surface — added post-implementation, during test-story, when E2E testing found the disclaimer was unreachable once a conversation starts)
  - `.env.example`
  - `api/tests/payments/beta-guard.spec.ts` (new)
  - `e2e/us-launch-004-beta-mode.spec.ts` (new)

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
| TC-LAUNCH-004-01-01 | Auto (E2E) | P0 | Given VITE_BETA_MODE=true, when viewing /pricing (Individual), then "Free during beta" banner is visible | ✅ | Ran against a local server started with `VITE_BETA_MODE=true` |
| TC-LAUNCH-004-01-02 | Auto (E2E) | P0 | Given VITE_BETA_MODE=true, when viewing SOLO card, then CTA reads "Available after beta" and is disabled | ✅ | Ran against a local server started with `VITE_BETA_MODE=true` |
| TC-LAUNCH-004-01-03 | Auto (E2E) | P1 | Given VITE_BETA_MODE=true, when viewing Enterprise segment, then TEAM and BROKERAGE CTAs are also disabled | ✅ | Ran against a local server started with `VITE_BETA_MODE=true` |
| TC-LAUNCH-004-01-04 | Auto (E2E) | P0 | Given VITE_BETA_MODE=true, when viewing FREE card, then its CTA is unaffected (enabled, normal label) | ✅ | Ran against a local server started with `VITE_BETA_MODE=true` |
| TC-LAUNCH-004-01-05 | Auto (E2E) | P0 | Given VITE_BETA_MODE unset/false, when viewing /pricing, then no beta banner and normal paid CTAs render (AC4 frontend half) | ✅ | Ran against default (beta-off) local server, passed |
| TC-LAUNCH-004-02 | Auto (unit) | P0 | Given BETA_MODE=true, when POST subscription-create, then 403 BETA_MODE_ACTIVE, status 403, non-empty message | ✅ | 5/5 sub-assertions pass |
| TC-LAUNCH-004-02-06 | Auto (unit) | P1 | Given BETA_MODE='TRUE' (uppercase), when POST subscription-create, then guard is bypassed (case-sensitive — ops must set lowercase `true`) | ⚠️ | Confirmed: guard is case-sensitive, `BETA_MODE=TRUE` silently does NOT lock checkout. Real footgun for Railway dashboard entry — flag in ops runbook |
| TC-LAUNCH-004-03 | Auto (unit) | P0 | Given BETA_MODE unset or 'false', when POST subscription-create, then existing behavior unchanged (AC4 backend half) | ✅ | Pass |
| TC-LAUNCH-004-04-01 | Auto (E2E) | P1 | Given a completed generation, then the AI-content disclaimer is visible on the result surface | ✅ | Was failing (disclaimer unreachable in conversation view); fixed by adding the disclaimer to `MessageBubble.tsx`; re-ran and confirmed passing against both beta-on and beta-off local servers |
| TC-LAUNCH-004-04-02 | Auto (E2E) | P1 | Given VITE_BETA_MODE unset, then the disclaimer still renders (it is unconditional, not beta-gated) | ✅ | Same fix as TC-04-01; confirmed unconditional across both beta states |
| TC-LAUNCH-004-04-03 | Manual | P1 | Human sign-off: disclaimer copy contains no AI vendor names | 🔲 | Copy is vendor-name-free (verified by code read); still needs a named human sign-off per the manual-gate rule |
| TC-LAUNCH-004-03-03 | Manual | P1 | Given VITE_BETA_MODE=true but BETA_MODE unset on backend (split misconfig), when a direct API call is made, then it succeeds — documents that both flags must be set together for the gate to hold | 🔲 | ⚠️ Deployment-config risk, not a code bug — see ENV.yaml / runbook |

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
