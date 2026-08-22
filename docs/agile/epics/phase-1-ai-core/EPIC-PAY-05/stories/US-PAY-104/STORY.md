---
title: Story Card — US-PAY-104
type: story
tags: [orion, pay, pricing, bugfix]
updated: 2026-08-21
---

# Story Card — US-PAY-104

> **Status:** ✅ Done (code) — manual/PR still open, see TASKS.md
> **Feature:** F-PAY-01 — Pricing Configuration & Entitlements
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-01-pricing-foundation](../../milestones/M-PAY-01-pricing-foundation.md)
> **Linear:** LIN-XXX
> **Size:** XS
> **Created:** 2026-08-21 | **Closed:** 2026-08-22 (code) — full DoD pending

---

## Story

*As* a developer maintaining pricing
*I want* `PricingPage.tsx`'s test-mode banner text to derive from `PLAN_CONFIG` instead of a
hardcoded literal string
*So that* the displayed price can never drift from the real config again — a pre-existing bug found
during this epic's feasibility pass, independent of the relaunch itself

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** `PricingPage.tsx:468-469`'s literal string ("Solo ₹2,999/mo, Team
      ₹6,999/mo, or annual equivalent") is replaced with a template that reads `SOLO`/`TEAM` prices
      directly from `PLAN_CONFIG` at render time. Done via `getTestModeBannerAmounts()`.
- [x] **AC2 [error-path]:** If a tier's price in `PLAN_CONFIG` changes, this banner text changes on
      the next render with zero code edits — verified by a test that mutates the config value and
      asserts the rendered text updates. Verified — `PricingPage.spec.tsx` (independently re-run,
      not just trusted from the implementation pass).
- [x] **AC3 [security]:** N/A for this story (display-only, no data flow change) — marked `N/A`
      explicitly per harden convention.
- [x] **AC4 [currency-edge]:** The rendered price string formats paise as rupees correctly (e.g.
      `549900` → `₹5,499`) using the same formatting helper the rest of the page already uses, not a
      new one-off implementation. **Correction:** `PLAN_CONFIG.SOLO`/`TEAM.price` are already
      integer rupees (`2999`/`6999`), not paise — see `US-PAY-102`'s log for why that unit matters.
      `.toLocaleString()` is the correct, existing convention here; no paise-to-rupee division
      needed for these two tiers.

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
| TC-PAY-104-01 | Unit | P1 | Given PLAN_CONFIG.SOLO.price mutated to a different value, when the banner renders, then the new value appears | ✅ | |
| TC-PAY-104-02 | Manual | P2 | Visual check on staging: banner text matches PLAN_CONFIG exactly | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded (TC-02 manual, still pending)
- [x] Gate 1 passes
- [ ] Gate 2 passes (frontend) — not separately run this pass
- [ ] Manual flow verified (TC-PAY-104-02)
- [ ] PR merged
- [ ] No console errors for the changed flow
- [x] [TASKS.md](./TASKS.md) task list fully checked (except manual/PR, tracked open)
- [x] STORY.md status updated to ✅ Done (code)

---

## Implementation Update (log)

**2026-08-22.** Completed after an earlier tooling run left this uncommitted (banner fix + test
file both already correct). Independently re-verified rather than trusted: re-ran
`npx vitest run src/pages/__tests__/PricingPage.spec.tsx` myself before committing — 2/2 pass.
Also verified `PLAN_CONFIG.SOLO`/`TEAM.price` are genuinely rupees (not paise) before trusting
AC4's paise-to-rupee framing — see `US-PAY-102`'s log for why that distinction mattered elsewhere
in this same session. Same file also carried `US-PAY-107`'s annual-formula fix (unrelated to this
story, kept, not closed here — see commit message). 2 commits, one per task
(`be5ea37`, `dd4dd3b`). Gate 1: `npm run check` (0 errors), `npm run test:unit:client` (236/237).

---

*Story created: 2026-08-21*
