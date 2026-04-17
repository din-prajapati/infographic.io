# M-DESIGN-01 — Theme & Global Page QA

> **Epic:** [EPIC-DESIGN-01](../EPIC.md)  
> **Status:** ✅ Done — QA run 2026-04-13  
> **Target date:** 2026-04-13 · **Closed:** 2026-04-13

---

## Goal

Run automated + manual QA on all non-editor pages in Light, Dark, and System mode. Produce a verified baseline before any code changes. Document findings that feed into M-DESIGN-02.

---

## Stories in this Milestone

| Story | Title | Status | PR |
|-------|-------|--------|----|
| [US-DESIGN-001](../stories/US-DESIGN-001/STORY.md) | Theme system works on all non-editor screens | 🟡 AC4–7 ✅, AC1–3 🔲 human | — |
| [US-DESIGN-004](../stories/US-DESIGN-004/STORY.md) | All pages consistent typography and nav | 🟡 AC1,5 ✅, AC2–4,6 🔲 human | — |

---

## Acceptance (Milestone Done When…)

- [x] 35 automated test cases run via Playwright (`e2e/design-consistency.spec.ts` + `e2e/design-contrast.spec.ts`)
- [x] All auto-pass TCs recorded in story STORY.md files
- [x] All findings documented (TC-DS-003-01/02 findings fed into US-DESIGN-002 scope)
- [x] Human-required TCs listed with reason for deferral to M-DESIGN-02
- [x] Pre-finding (hardcoded `bg-white` in AI chat) documented and added to US-DESIGN-002 scope

---

## QA Summary (2026-04-13)

| Result | Count |
|--------|-------|
| ✅ Auto-PASS | 33 |
| ⚠️ PASS with Finding | 2 |
| 🔲 HUMAN required | 6 |
| ❌ Auto-FAIL | 0 |
| **Total** | **35 + 6 = 41** |

Key finding: `AIChatBox.tsx`, `AIChatInputField.tsx`, `GenerationProgressBar.tsx`, `GenerationProgress.tsx` use hardcoded `bg-white/border-gray-200` — added to US-DESIGN-002 scope.

---

*Milestone created: 2026-04-13 | Closed: 2026-04-13*
