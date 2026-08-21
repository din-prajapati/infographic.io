---
title: Story Card — US-PAY-104
type: story
tags: [orion, pay, pricing, bugfix]
updated: 2026-08-21
---

# Story Card — US-PAY-104

> **Status:** 🔲 Not Started
> **Feature:** F-PAY-01 — Pricing Configuration & Entitlements
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-01-pricing-foundation](../../milestones/M-PAY-01-pricing-foundation.md)
> **Linear:** LIN-XXX
> **Size:** XS
> **Created:** 2026-08-21 | **Closed:** —

---

## Story

*As* a developer maintaining pricing
*I want* `PricingPage.tsx`'s test-mode banner text to derive from `PLAN_CONFIG` instead of a
hardcoded literal string
*So that* the displayed price can never drift from the real config again — a pre-existing bug found
during this epic's feasibility pass, independent of the relaunch itself

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** `PricingPage.tsx:468-469`'s literal string ("Solo ₹2,999/mo, Team
      ₹6,999/mo, or annual equivalent") is replaced with a template that reads `SOLO`/`TEAM` prices
      directly from `PLAN_CONFIG` at render time.
- [ ] **AC2 [error-path]:** If a tier's price in `PLAN_CONFIG` changes, this banner text changes on
      the next render with zero code edits — verified by a test that mutates the config value and
      asserts the rendered text updates.
- [ ] **AC3 [security]:** N/A for this story (display-only, no data flow change) — mark this AC
      `N/A` explicitly rather than deleting it, per harden convention.
- [ ] **AC4 [currency-edge]:** The rendered price string formats paise as rupees correctly (e.g.
      `549900` → `₹5,499`) using the same formatting helper the rest of the page already uses, not a
      new one-off implementation.

---

## Out of Scope

- Any other visual change to `PricingPage.tsx` (F-PAY-04 handles the real redesign).
- The `/83` hardcoded USD-conversion divisor elsewhere on the page — separate, unrelated issue, not
  touched here.

---

## Engineering / PR

- **Branch:** `feat/pay/m-01-pricing-relaunch`
- **PR:** #_____ (milestone PR)
- **Primary files touched:**
  - `client/src/pages/PricingPage.tsx` — replace the hardcoded string at lines ~468-469

---

## AI Implementation Prompt

```
Project context: see PROJECT_CONTEXT.yaml at repo root.

Story: US-PAY-104 — Fix PricingPage.tsx hardcoded price-text drift

As a developer maintaining pricing, I want the test-mode banner text to derive from PLAN_CONFIG
instead of a hardcoded literal, so it can never drift from the real config again.

Acceptance Criteria:
  AC1 [happy-path]: replace the hardcoded "Solo ₹2,999/mo, Team ₹6,999/mo..." string with a
    PLAN_CONFIG-driven template.
  AC2 [error-path]: changing a PLAN_CONFIG price changes this text with zero code edits — test this.
  AC3 [security]: N/A — display-only story.
  AC4 [currency-edge]: paise-to-rupee formatting reuses the page's existing formatting helper.

Out of Scope:
  Any other visual change to PricingPage.tsx. The unrelated /83 USD-conversion divisor.

Primary files to touch (do NOT touch other files):
  client/src/pages/PricingPage.tsx

Rules:
- Touch ONLY the file listed above
- Do NOT implement anything in Out of Scope
- Run verification gates before declaring done
- When done: list files changed, ACs checked ✅, test commands output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-PAY-104-01 | Unit | P1 | Given PLAN_CONFIG.SOLO.price mutated to a different value, when the banner renders, then the new value appears | 🔲 | |
| TC-PAY-104-02 | Manual | P2 | Visual check on staging: banner text matches PLAN_CONFIG exactly | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] Gate 1 passes
- [ ] Gate 2 passes (frontend)
- [ ] Manual flow verified
- [ ] PR merged
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

## Implementation Update (log)

---

*Story created: 2026-08-21*
