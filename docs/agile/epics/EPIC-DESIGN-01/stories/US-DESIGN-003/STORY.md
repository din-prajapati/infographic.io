# Story Card — US-DESIGN-003

> **Status:** 🟡 In Progress — AC1 ✅ auto, AC2–6 🔲 human (requires live Ideogram API)  
> **Feature:** F-DESIGN-03 — AI Generation Flow Design  
> **Epic:** [EPIC-DESIGN-01](../../EPIC.md)  
> **Milestone:** [M-DESIGN-02 — Editor Token Fix](../../milestones/M-DESIGN-02-editor-tokens.md)  
> **Linear:** LIN-XXX  
> **Created:** 2026-04-13 | **Closed:** —

---

## Story

*As a* real estate agent generating my first infographic  
*I want* to see clear progress, a polished result, and a helpful error state  
*So that* I know the app is working and feel confident in the output quality

---

## Acceptance Criteria

- [x] **AC1:** Generation form (AI chat panel) renders and opens correctly in both Light and Dark modes — ✅ AUTO 2026-04-13
- [ ] **AC2:** Loading/progress state visible in both themes (not white-on-white or white-on-dark) — 🔲 Re-run / verify on staging after [US-DESIGN-002 PR #1](https://github.com/din-prajapati/infographic.io/pull/1) merged (2026-04-17)
- [ ] **AC3:** After successful generation: result card at correct size, image loads, usage counter updates — 🔲 HUMAN (live Ideogram API)
- [ ] **AC4:** Error state shows styled message, not raw JSON — 🔲 HUMAN (intentional failure)
- [ ] **AC5:** "Use This Design" button visible with primary style — 🔲 HUMAN (completed generation)
- [ ] **AC6:** Generation UI correct in both themes — 🔲 HUMAN (verify on staging; US-DESIGN-002 merged 2026-04-17)

---

## Out of Scope

- AI model quality or output accuracy
- Backend timeout values
- Webhook events

---

## Engineering / PR

- **Branch:** Only if code changes needed beyond US-DESIGN-002 fixes
- **PR:** #_____ (likely none — token fixes handled in US-DESIGN-002)
- **Primary paths:** `client/src/components/ai-chat/` (already in US-DESIGN-002 scope)

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DS-003-01 | Auto | P0 | Light: enter prompt → spinner visible (not white-on-white) | ⚠️ PASS+FINDING 2026-04-13 | Hardcoded `bg-white` in AIChatBox.tsx:991, AIChatInputField.tsx:224, GenerationProgressBar.tsx:55 — added to US-DESIGN-002 scope |
| TC-DS-003-02 | Auto | P0 | Dark: generate → spinner visible (not jarring white box) | ⚠️ PASS+FINDING 2026-04-13 | Same root cause — `bg-white` in dark panel. Fix in US-DESIGN-002. |
| TC-DS-003-03 | Manual | P0 | Generation completes → result image at correct proportions | 🔲 HUMAN | Requires live Ideogram API |
| TC-DS-003-04 | Manual | P0 | Usage counter updates after generation (e.g. 1/3 FREE tier) | 🔲 HUMAN | Requires completed generation + live backend |
| TC-DS-003-05 | Manual | P1 | "Use This Design" button is prominent (primary style) | 🔲 HUMAN | Requires completed generation |
| TC-DS-003-06 | Manual | P1 | Error state shows styled red message, not raw JSON | 🔲 HUMAN | Requires intentional API failure |
| TC-DS-003-07 | Auto | P1 | AI chat panel opens and renders in both themes | ✅ PASS 2026-04-13 | Panel visible in Light and Dark |
| TC-DS-003-08 | Manual | P2 | Generate 3 → 4th blocked with correct limit message (FREE tier) | 🔲 HUMAN | Requires FREE account + 3 generations |

---

## Note

TC-DS-003-01/02 findings (hardcoded `bg-white`) were fixed in US-DESIGN-002 ([PR #1](https://github.com/din-prajapati/infographic.io/pull/1), merged 2026-04-17). Re-run the automated tests on `main` / staging to confirm AC2 and AC6 pass.

---

*Story created: 2026-04-13 | See US-DESIGN-002 for code fix; this story handles human QA after*
