---
title: Story Card — US-EDIT-008
type: story
tags: [orion, edit, quota, billing-ux]
updated: 2026-08-26
---

# Story Card — US-EDIT-008

> **Status:** 🔲 Not Started
> **Epic:** [EPIC-EDIT-03](../../EPIC.md)
> **Milestone:** [M-EDIT-01-editable-menu-surfacing](../../milestones/M-EDIT-01-editable-menu-surfacing.md)
> **Size:** M
> **Deferred from:** [US-EDIT-005](../US-EDIT-005/STORY.md) AC4 — descoped 2026-08-26 so that
> story could close on the value it had actually delivered.
> **Created:** 2026-08-26 | **Closed:** —

---

## Story

*As* a customer on a paid plan
*I want* to see my editable-design allowance change at the exact moment an extraction is charged
*So that* I can tell a free extraction from one I paid for, instead of discovering the difference
on an invoice

---

## Why this is a separate story

US-EDIT-005 built the "Edit elements" control and delivered AC1/2/3/5. AC4 — the quota badge
decrementing at the moment of charge — could not be built honestly, for a **structural** reason
rather than an incomplete one:

`POST /:id/compose` never returns `isCacheHit` or `isExtraCompose` to the client. Both are local
variables in `generations.service.ts` (confirmed absent from `composed-design.types.ts` on
`main`). The client therefore has no way to distinguish:

- a **cache hit** — free on every tier
- a **first compose** — free under the FREE lifetime trial, and free as the first distinct
  variation on a paid tier
- an **extra compose** — the one case that actually spends a credit

Showing a charge-specific confirmation without that signal means guessing. US-EDIT-005
deliberately refused to fake it, and that refusal still stands — this story exists to supply the
missing signal rather than to work around its absence.

**Half the dependency already cleared.** `getEditableUsageQuota()` shipped to `main` with the
EPIC-PAY-05 merge (`GET /infographics/generations/usage/quota/editable`,
`generations.controller.ts:29`), so the quota *number* is already fetchable. What remains is the
per-call charge signal.

---

## Acceptance Criteria

- [ ] **AC1 [contract]:** The `/:id/compose` response carries an explicit, typed indication of
      whether that call was a cache hit and whether it consumed a credit. Added to
      `ComposedDesign` (or a wrapper) in `composed-design.types.ts` — a real field, not inferred
      client-side from timing or payload shape.
- [ ] **AC2 [happy-path]:** The control shows the real remaining editable allowance, sourced from
      `GET /infographics/generations/usage/quota/editable`. No second, parallel quota mechanism is
      introduced.
- [ ] **AC3 [happy-path]:** On a compose that **did** consume a credit, the displayed allowance
      decrements at that moment, with a visible confirmation naming what was charged.
- [ ] **AC4 [happy-path]:** On a cache hit or a free first compose, the allowance is **unchanged**
      and no charge confirmation appears — visibly distinct from AC3.
- [ ] **AC5 [error-path]:** If the quota endpoint fails or is slow, the control still works and
      composing is still possible — the badge degrades to absent, never to a wrong number and
      never to a blocked button.
- [ ] **AC6 [regression]:** US-EDIT-005's live spec still passes, including its assertion that
      placing a variation issues no compose call.

---

## Out of Scope

- **Changing what is charged, when.** The credit rules in `generations.service.ts`
  (FREE lifetime trial, first distinct variation free on paid tiers, extras metered) are correct
  and stay exactly as they are. This story makes the existing behaviour *legible*, it does not
  reprice it.
- **Any change to compose caching** (`US-AI-048`) or to the extraction pipeline.
- **A pre-purchase confirmation dialog** ("this will use 1 credit — continue?"). That is a
  different product decision about consent, not about display.
- **Surfacing quota anywhere other than this control** — pricing page, account page and usage
  dashboard are all out.

---

## Engineering / PR

- **Branch:** `feat/edit/us-edit-008-quota-badge`
- **PR:** #_____
- **Primary files touched:**
  - `api/src/modules/ai-generation/types/composed-design.types.ts` — response contract (AC1)
  - `api/src/modules/infographics/services/generations.service.ts` — return the existing local
    flags rather than discarding them
  - `client/src/lib/api.ts` — read the new fields
  - `client/src/components/editor/CanvasEditToolbar.tsx` — badge + charge confirmation
  - `e2e/us-edit-008-quota-badge.spec.ts` (new)

---

## AI Implementation Prompt

> Paste this block into Claude Code to implement the story.

```
Project context: see PROJECT_CONTEXT.yaml at repo root.

Story: US-EDIT-008 — editable quota badge + charge confirmation
Deferred from US-EDIT-005 AC4.

VERIFIED CONTEXT (do not re-derive):
- POST /:id/compose does NOT return isCacheHit / isExtraCompose. They are local variables in
  generations.service.ts and are absent from composed-design.types.ts. This is the whole reason
  AC4 could not be built in US-EDIT-005.
- getEditableUsageQuota() ALREADY EXISTS on main:
  GET /infographics/generations/usage/quota/editable (generations.controller.ts:29).
  Do NOT build a second quota mechanism.
- Charging rules already work and are correct: FREE gets one lifetime trial; paid tiers get the
  first distinct variation per generation free; extra distinct variations meter a credit.

Acceptance Criteria:
  AC1: /:id/compose response carries typed cache-hit + credit-consumed fields. A real field on
       the contract, never inferred client-side from timing.
  AC2: control shows real remaining allowance from the existing endpoint.
  AC3: credit consumed -> allowance decrements at that moment + visible confirmation.
  AC4: cache hit or free first compose -> allowance unchanged, no confirmation. Visibly distinct.
  AC5: quota endpoint failure -> badge absent, control still usable, compose still possible.
       Never a wrong number, never a blocked button.
  AC6: e2e/us-edit-005-canvas-edit-toolbar.spec.ts still passes.

Out of Scope:
  Changing what is charged or when. Compose caching (US-AI-048). Extraction pipeline. A
  pre-purchase confirmation dialog. Quota display anywhere other than this control.

Primary files (do NOT touch others):
  api/src/modules/ai-generation/types/composed-design.types.ts
  api/src/modules/infographics/services/generations.service.ts
  client/src/lib/api.ts
  client/src/components/editor/CanvasEditToolbar.tsx
  e2e/us-edit-008-quota-badge.spec.ts (new)

Rules:
- Touch ONLY the files listed above
- Do NOT implement anything in Out of Scope
- Backend change is additive: return flags that already exist, do not recompute them
- Run verification gates (PROJECT_CONTEXT.yaml.gates) before declaring done
- When done: list files changed, ACs checked, test command output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-EDIT-008-01 | Unit | P0 | `/compose` response includes the cache-hit and credit-consumed fields for each of: cache hit, free first compose, metered extra compose | 🔲 | |
| TC-EDIT-008-02 | E2E | P0 | Paid tier, extra distinct variation → allowance decrements at that moment with a visible confirmation | 🔲 | |
| TC-EDIT-008-03 | E2E | P0 | Cache hit on an already-composed variation → allowance unchanged, no confirmation | 🔲 | |
| TC-EDIT-008-04 | E2E | P1 | Quota endpoint returns 500 → badge absent, control still usable, compose still succeeds | 🔲 | |
| TC-EDIT-008-05 | E2E | P1 | US-EDIT-005 live spec still passes unchanged | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] Gate 1 passes (`npm run check`, `npm run test:unit`)
- [ ] Gate 2 passes (frontend, browser-verified)
- [ ] PR merged
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

*Story created: 2026-08-26 — deferred from US-EDIT-005 AC4*
