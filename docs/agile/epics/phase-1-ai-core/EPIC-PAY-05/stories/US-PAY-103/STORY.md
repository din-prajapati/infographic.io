---
title: Story Card — US-PAY-103
type: story
tags: [orion, pay, pricing]
updated: 2026-08-21
---

# Story Card — US-PAY-103

> **Status:** 🔲 Not Started
> **Feature:** F-PAY-01 — Pricing Configuration & Entitlements
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-01-pricing-foundation](../../milestones/M-PAY-01-pricing-foundation.md)
> **Linear:** LIN-XXX
> **Size:** S
> **Created:** 2026-08-21 | **Closed:** —

---

## Story

*As* a paying customer
*I want* to see "X editable designs remaining this month" that accurately reflects what I'll
actually be charged for
*So that* the number on screen matches real behavior — without Buildographic reversing the
already-shipped, already-tested `US-LAUNCH-015` editable-compose policy to do it

---

## Decision this story implements (see EPIC.md for the full reasoning)

Path A: **keep** the shipped mechanism (first compose per generation free on paid tiers, additional
distinct-variation composes meter against the shared credit pool, FREE gets a lifetime trial) —
**only** change what's displayed. This is NOT the original PRD's literal "always-deducted separate
counter" model (Path B) — that reversal was considered and explicitly not chosen.

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** A paid-tier user's account/usage UI shows `{editableLimit} editable
      designs remaining this month` (e.g. "10 editable designs remaining" for SOLO) where the
      displayed count decrements only when `generations.service.ts`'s `getComposedDesign()` actually
      charges a credit (`isExtraCompose === true`), matching real US-LAUNCH-015 behavior — never on
      the free first compose.
- [ ] **AC2 [error-path]:** A FREE-tier user who has already used their lifetime trial compose
      (`hasUsedEditableTrial()` returns true) sees "0 editable designs remaining" and any further
      attempt surfaces the existing `EditableRequiresUpgradeException` (402,
      `EDITABLE_REQUIRES_UPGRADE`) message, unchanged.
- [ ] **AC3 [security]:** The displayed remaining-editable count is computed server-side from real
      `UsageRecord`/`composedDesigns` data, never trusted from client state.
- [ ] **AC4 [currency-edge]:** When a customer's plan changes mid-cycle (upgrade/downgrade), the
      displayed editable limit reflects the new tier's `editableLimit` immediately, not a stale
      cached value from the prior tier.

---

## Out of Scope

- Any change to `generations.service.ts`'s actual gating logic (`isExtraCompose`,
  `hasUsedEditableTrial`, the 402 exception) — this story is display-only.
- Reversing to a literal separate always-deducted editable counter (Path B) — explicitly rejected,
  see EPIC.md.
- Any UI redesign beyond the remaining-count text (F-PAY-04).

---

## Engineering / PR

- **Branch:** `feat/pay/m-01-pricing-relaunch`
- **PR:** #_____ (milestone PR)
- **Primary files touched:**
  - `api/src/modules/infographics/services/usage-limit.service.ts` — add a display-only
    `getEditableUsageQuota(organizationId)` method (remaining = `editableLimit` − count of
    credit-charged composes this cycle)
  - `client/src/components/*` usage display component(s) that currently show AI-design remaining
    count (extend, don't duplicate)

---

## AI Implementation Prompt

```
Project context: see PROJECT_CONTEXT.yaml at repo root.

Story: US-PAY-103 — Editable-design limit relabel (Path A)

As a paying customer, I want to see "X editable designs remaining" that accurately reflects what
I'll actually be charged for, so the number matches real US-LAUNCH-015 behavior without reversing
that shipped policy.

Acceptance Criteria:
  AC1 [happy-path]: paid-tier usage UI shows editableLimit-minus-charged-composes, decrementing only
    when getComposedDesign() actually charges a credit — never on the free first compose.
  AC2 [error-path]: FREE-tier user past their lifetime trial sees 0 remaining; existing 402
    EDITABLE_REQUIRES_UPGRADE behavior is unchanged.
  AC3 [security]: remaining count computed server-side from real UsageRecord data, never client-trusted.
  AC4 [currency-edge]: plan change mid-cycle updates the displayed limit to the new tier immediately.

Out of Scope:
  Any change to the actual gating logic in generations.service.ts. Reversing to a separate
  always-deducted counter. Any UI redesign beyond the remaining-count text.

Primary files to touch (do NOT touch other files):
  api/src/modules/infographics/services/usage-limit.service.ts
  client/src/components/* (the existing usage-remaining display component)

Rules:
- Touch ONLY the files listed above
- Do NOT implement anything in Out of Scope
- Run verification gates before declaring done
- When done: list files changed, ACs checked ✅, test commands output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-PAY-103-01 | Unit | P0 | Given a SOLO org with 3 credit-charged composes this cycle, when getEditableUsageQuota() is called, then it returns 7 remaining | 🔲 | |
| TC-PAY-103-02 | Unit | P0 | Given a FREE org that already used its lifetime trial, when queried, then remaining = 0 | 🔲 | |
| TC-PAY-103-03 | Unit | P1 | Given a first (free) compose on a paid tier, when charged, then remaining count does NOT decrement | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] Gate 1 passes
- [ ] Gate 4 passes (backend)
- [ ] Manual flow verified
- [ ] PR merged
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

## Implementation Update (log)

---

*Story created: 2026-08-21*
