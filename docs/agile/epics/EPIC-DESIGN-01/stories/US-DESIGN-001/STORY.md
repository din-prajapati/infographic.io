# Story Card — US-DESIGN-001

> **Status:** 🟡 In Progress — AC4–7 ✅ auto-verified 2026-04-13, AC1–3 🔲 human pending  
> **Feature:** F-DESIGN-01 — Theme System Correctness  
> **Epic:** [EPIC-DESIGN-01](../../EPIC.md)  
> **Milestone:** [M-DESIGN-01 — Theme & Global QA](../../milestones/M-DESIGN-01-theme-QA.md)  
> **Linear:** LIN-XXX  
> **Created:** 2026-04-13 | **Closed:** —

---

## Story

*As a* real estate agent using InfographicAI  
*I want* the app to respect my Light / Dark / System theme preference  
*So that* I can work comfortably in my preferred environment across all screens

---

## Acceptance Criteria

- [ ] **AC1:** Theme toggle (Account → Appearance) cycles correctly: Light → Dark → System — 🔲 HUMAN
- [ ] **AC2:** All non-editor screens render correctly in Light mode — 🔲 HUMAN (visual contrast check)
- [ ] **AC3:** All non-editor screens render correctly in Dark mode — 🔲 HUMAN (visual contrast check)
- [x] **AC4:** System mode matches OS setting and updates live without reload — ✅ AUTO 2026-04-13
- [x] **AC5:** Theme selection persists across browser refresh (localStorage key `theme`) — ✅ AUTO 2026-04-13
- [x] **AC6:** AppHeader navigation tabs and profile dropdown legible in both modes — ✅ AUTO 2026-04-13
- [x] **AC7:** Zero theme-related console errors in both modes — ✅ AUTO 2026-04-13

---

## Out of Scope

- Editor component dark/light (covered in US-DESIGN-002)
- Landing page dark mode (intentionally always-dark — document decision if needed)

---

## Engineering / PR

- **Branch:** `feat/design-us-design-001-theme-human-qa` (only if code changes needed after manual QA)
- **PR:** #_____ (only if code changes surface from AC1–3 manual walk-through)
- **Primary files (if changes needed):**
  - `client/src/lib/theme-provider.tsx`
  - `client/src/index.css`
  - `client/src/components/UserProfileDropdown.tsx`

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DS-001-01 | Auto | P0 | Dark mode: all 6 app pages WCAG ≥3.5:1 contrast | ✅ PASS 2026-04-13 | All 5 theme-responsive pages pass. Auth excluded (intentional photo bg). |
| TC-DS-001-02 | Auto | P0 | Light mode: all 6 app pages WCAG ≥3.5:1 contrast | ✅ PASS 2026-04-13 | Same. |
| TC-DS-001-03 | Auto | P0 | System mode → change OS to dark → app switches within 2s | ✅ PASS 2026-04-13 | `matchMedia` listener confirmed. |
| TC-DS-001-04 | Auto | P1 | Hard-refresh in Dark → still Dark (localStorage) | ✅ PASS 2026-04-13 | Both Light and Dark survive hard reload. |
| TC-DS-001-05 | Auto | P1 | AppHeader in Dark: logo, nav links, active tab visible | ✅ PASS 2026-04-13 | All 3 tabs + logo visible in both modes. |
| TC-DS-001-06 | Auto | P1 | Pricing page plan cards: text contrast OK in both modes | ✅ PASS 2026-04-13 | Solo heading and plan descriptions visible. |
| TC-DS-001-07 | Auto | P2 | Browser console: zero theme errors in both modes | ✅ PASS 2026-04-13 | Zero errors. |
| TC-DS-001-08 | Manual | P0 | Theme toggle walk-through: Light → Dark → System all work visually | 🔲 HUMAN | Requires manual walk-through in Account → Appearance |
| TC-DS-001-09 | Manual | P0 | Light mode full visual readability on each page | 🔲 HUMAN | Visual contrast + readability spot-check |
| TC-DS-001-10 | Manual | P0 | Dark mode full visual readability on each page | 🔲 HUMAN | Visual contrast + readability spot-check |

---

## Definition of Done

- [ ] AC1–3 verified manually and checked ✅
- [x] AC4–7 auto-verified 2026-04-13
- [x] All auto TCs run and recorded
- [ ] Manual TCs (TC-DS-001-08/09/10) run and recorded
- [ ] Any code changes: `npm run check` passes
- [ ] STORY.md status updated to ✅ Done
