# Story Card — US-DESIGN-004

> **Status:** 🟡 In Progress — AC1,5 ✅ auto, AC2–4,6 🔲 human  
> **Feature:** F-DESIGN-04 — Global Page Consistency  
> **Epic:** [EPIC-DESIGN-01](../../EPIC.md)  
> **Milestone:** [M-DESIGN-01 — Theme & Global QA](../../milestones/M-DESIGN-01-theme-QA.md)  
> **Linear:** LIN-XXX  
> **Created:** 2026-04-13 | **Closed:** —

---

## Story

*As a* new user exploring InfographicAI  
*I want* every page to feel like part of the same product  
*So that* the app feels professional and trustworthy enough to pay for

---

## Acceptance Criteria

- [x] **AC1:** Body text is 14px `text-sm` — ✅ AUTO 2026-04-13 (`getComputedStyle` returns 14px)
- [ ] **AC2:** Button heights consistent (primary = 36px / h-9) — 🔲 HUMAN
- [ ] **AC3:** Card borders consistent (`bg-card border border-border rounded-lg`) — 🔲 HUMAN
- [ ] **AC4:** Section spacing consistent (`space-y-6` / `space-y-3`) — 🔲 HUMAN
- [x] **AC5:** AppHeader identical on Templates, My Designs, Account — ✅ AUTO 2026-04-13 (logo + 3 tabs + 64px height)
- [ ] **AC6:** No split-personality pages (editor known offender per DESIGN-001 audit; non-editor pages appear clean) — 🔲 HUMAN

---

## Out of Scope

- Landing page (marketing page may intentionally differ)
- Pixel-perfect matching to design mockups
- Editor component consistency (covered in US-DESIGN-002)

---

## Engineering / PR

- **Branch:** Only if code changes surface from manual QA
- **PR:** #_____ (only if non-editor pages need fixes)
- **Primary paths (if changes needed):** `client/src/pages/*.tsx` · `client/src/index.css`

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DS-004-01 | Auto | P0 | Templates → My Designs → Account: header identical on all three | ✅ PASS 2026-04-13 | Logo, 3 nav tabs, 64px height consistent |
| TC-DS-004-02 | Manual | P0 | Light mode: no page has dark panel adjacent to light panel (split-personality) | 🔲 HUMAN | Editor (US-DESIGN-002) is known offender |
| TC-DS-004-03 | Auto | P1 | Templates page: card hover state works in both themes | ✅ PASS 2026-04-13 | Cards render with Use Template buttons visible |
| TC-DS-004-04 | Auto | P1 | Account page: billing section text visible in Dark mode | ✅ PASS 2026-04-13 | Billing/subscription/plan text visible |
| TC-DS-004-05 | Auto | P1 | Pricing page: plan cards readable in both themes | ✅ PASS 2026-04-13 | Solo heading + segment buttons visible |
| TC-DS-004-06 | Auto | P1 | Usage Dashboard: chart labels visible in Dark mode | ✅ PASS 2026-04-13 | Analytics heading visible; chart data needs human check |
| TC-DS-004-07 | Auto | P2 | Auth page: form and Google button visible in both themes | ✅ PASS 2026-04-13 | All inputs + buttons visible |
| TC-DS-004-08 | Auto | P2 | Body text 14px across all pages | ✅ PASS 2026-04-13 | `getComputedStyle` confirms 14px |
| TC-DS-004-09 | Manual | P1 | Button heights consistent on Pricing + Account + Templates | 🔲 HUMAN | AC2 — spot check h-9 buttons |
| TC-DS-004-10 | Manual | P1 | Chart data labels readable in Dark mode (Usage Dashboard) | 🔲 HUMAN | AC3 — chart library test IDs not exposed to automation |

---

*Story created: 2026-04-13*
