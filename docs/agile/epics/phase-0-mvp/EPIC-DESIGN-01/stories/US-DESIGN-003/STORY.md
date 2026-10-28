# Story Card — US-DESIGN-003

> **Status:** ✅ Done — closed 2026-10-28. All 6 ACs verified. AC3 closed on staging 2026-10-27 (real generation: 3 result cards, 2560×1440 16:9, fully loaded; usage counter 7 → 8); TC-DS-003-08 verified by the product owner.
> **Feature:** F-DESIGN-03 — AI Generation Flow Design  
> **Epic:** [EPIC-DESIGN-01](../../EPIC.md)  
> **Milestone:** [M-DESIGN-02 — Editor Token Fix](../../milestones/M-DESIGN-02-editor-tokens.md)  
> **Linear:** LIN-XXX  
> **Created:** 2026-04-13 | **Closed:** 2026-10-28

---

## Story

*As a* real estate agent generating my first infographic  
*I want* to see clear progress, a polished result, and a helpful error state  
*So that* I know the app is working and feel confident in the output quality

---

## Acceptance Criteria

- [x] **AC1:** Generation form (AI chat panel) renders and opens correctly in both Light and Dark modes — ✅ AUTO TC-DS-003-07/07b PASS 2026-04-29
- [x] **AC2:** Loading/progress state visible in both themes (not white-on-white or white-on-dark) — ✅ AUTO TC-DS-003-01/02 PASS 2026-04-29 · Light `rgb(248,248,246)` · Dark `rgb(13,12,7)` (warm tokens, not white)
- [x] **AC3:** After successful generation: result card at correct size, image loads, usage counter updates — ✅ UI contract automated 2026-06-03 (mock-backed); ✅ live on staging 2026-10-27, QA account: 3 cards rendered, each image 2560×1440 (16:9) and fully decoded, headline text correct at full size; Usage page went 7 → 8 designs after one generation.
- [x] **AC4:** Error state shows styled message, not raw JSON — ✅ STATIC VERIFIED 2026-04-29 · `MessageBubble.tsx` uses `bg-destructive/10 border border-destructive/30` (token-based bubble, no raw JSON leakage)
- [x] **AC5:** "Use This Design" button visible with primary style — ✅ STATIC VERIFIED 2026-04-29 · `bg-primary hover:bg-primary/90 text-primary-foreground` in `ConversationToolbar.tsx`, `ResultsVariations.tsx`, `AIChatBox.tsx`
- [x] **AC6:** Generation UI correct in both themes — ✅ AUTO TC-DS-003-07/07b PASS 2026-04-29 · panel renders correctly in both Light and Dark

---

## Out of Scope

- AI model quality or output accuracy
- Backend timeout values
- Webhook events

---

## Engineering / PR

- **Branch:** Only if code changes needed beyond US-DESIGN-002 fixes
- **PR:** none — verification-only story; the token fixes shipped in US-DESIGN-002 ([#1](https://github.com/din-prajapati/infographic.io/pull/1))
- **Primary paths:** `client/src/components/ai-chat/` (already in US-DESIGN-002 scope)
- **Tests added:** `e2e/us-design-003-generation-ux.spec.ts` — mock-backed (intercepts `POST /conversations`, `POST /infographics/generations`, `GET .../status`, `GET .../variations`; forces the WebSocket→polling fallback) to verify the generation UX **frontend contract** without the live Ideogram API. Run: `npx playwright test e2e/us-design-003-generation-ux.spec.ts`.

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DS-003-01 | Auto | P0 | Light: spinner/progress visible (not white-on-white) | ✅ PASS 2026-04-29 | Input wrapper `rgb(248,248,246)` · panel `rgb(248,248,246)` — both warm cream token. Fix confirmed from US-DESIGN-002. |
| TC-DS-003-02 | Auto | P0 | Dark: generate → spinner visible (not jarring white box) | ✅ PASS 2026-04-29 | Input wrapper `rgb(13,12,7)` · panel `rgb(13,12,7)` — warm black token. No white-on-dark. |
| TC-DS-003-03 | Auto (mock) + Manual | P0 | Generation completes → result cards render, image decodes, proportions preserved | ✅ PASS — auto (mock) 2026-06-03 · live staging 2026-10-27, QA account | Real generation: 3 cards, 2560×1440 16:9, `complete`, no broken card; Variation 2 opened full size, text correct. Finding: one variation printed the address twice — added to BL-47. |
| TC-DS-003-04 | Manual | P0 | Usage counter updates after generation (e.g. 1/3 FREE tier) | ✅ PASS staging 2026-10-27, QA account | Usage page before → after one generation: design credits 7 → 8, this month 7 → 8, total 53 → 54. Finding: the "Current Plan" card reads FREE for this Enterprise account — BL-49. |
| TC-DS-003-05 | Static + Auto (mock) | P1 | "Use This Design" button uses primary style | ✅ STATIC 2026-04-29 · ✅ AUTO (mock) 2026-06-03 | `bg-primary hover:bg-primary/90 text-primary-foreground` confirmed in ConversationToolbar, ResultsVariations, AIChatBox. E2E now asserts the toolbar button is visible + carries `bg-primary` after a completed generation. |
| TC-DS-003-06 | Static | P1 | Error state shows styled token bubble, not raw JSON | ✅ STATIC 2026-04-29 | MessageBubble isError path → `bg-destructive/10 border border-destructive/30`. No JSON leakage path exists. Human re-verify appearance on staging. |
| TC-DS-003-07 | Auto | P1 | AI chat panel opens in Dark mode | ✅ PASS 2026-04-29 | Panel visible, renders correctly (12.1s) |
| TC-DS-003-07b | Auto | P1 | AI chat panel opens in Light mode | ✅ PASS 2026-04-29 | Panel visible, renders correctly |
| TC-DS-003-08 | Manual | P2 | Generate 3 → 4th blocked with correct limit message (FREE tier) | ✅ PASS 2026-10-27 (human) | Verified by the product owner on a Free account at its limit: the 4th generation is blocked with the monthly-limit message and upgrade option, and the typed prompt is kept (BL-45 fix, PR #69). |
| TC-DS-003-09 | Auto (offline) | P1 | Invalid prompt (missing price) → styled "Missing Information" guidance, no API call, no raw JSON | ✅ AUTO 2026-06-03 | Mock-backed E2E: amber guidance bubble shown, `POST /generations` never fired. Validates AC4 "styled message, not raw JSON" for the guidance path. |

---

## Automation Coverage Summary — updated 2026-06-03

| AC | Method | Result | Remaining |
|----|--------|--------|-----------|
| AC1 | Auto (Playwright) | ✅ PASS | — |
| AC2 | Auto (Playwright) | ✅ PASS | — |
| AC3 | Auto (Playwright, mock-backed) + Human | ✅ PASS | UI contract 2026-06-03; live fidelity + usage increment on staging 2026-10-27, QA account |
| AC4 | Static + Auto (guidance path) | ✅ PASS | Visual spot-check of error bubble on staging recommended |
| AC5 | Static + Auto (mock-backed) | ✅ PASS | Visual spot-check on staging recommended |
| AC6 | Auto (Playwright) | ✅ PASS | — |

**6 of 6 ACs now have automated coverage.** AC3's *frontend contract* is automated (mock-backed); only the **live-API fidelity** of a real render + the **real usage-counter increment** remain as a human task on staging.

### New automated coverage — 2026-06-03 (`e2e/us-design-003-generation-ux.spec.ts`)
Mock-backed (no live Ideogram API): intercepts the REST contract and forces the WebSocket→polling fallback so the deterministic UX states are testable in CI.
- **TC-DS-003-03 (AC3):** completed generation renders 3 result cards, images decode (`naturalWidth>0`), 16:9 proportions preserved, "Complete" badge shown.
- **TC-DS-003-05 (AC5):** "Use This Design" toolbar button visible with `bg-primary` styling after a result.
- **TC-DS-003-09 (AC4):** invalid prompt → styled amber "Missing Information" guidance, no `POST /generations`, no raw JSON.

### What still needs a human on staging (live Ideogram API / server-side state)
- TC-DS-003-03 (fidelity only): visual quality/cropping of a *real* Ideogram render (the mock asserts layout + load + ratio, not artwork).
- TC-DS-003-04: Usage counter increment (1/3, 2/3…) — server-side, shown on Account/Usage.
- TC-DS-003-08: Rate limiting at 4th generation (FREE tier) — backend enforcement; in-chat limit message is not surfaced in an active conversation.

### What Was Automatable Beyond Initial Expectation
- AC4 and AC5 were originally marked HUMAN but are fully verifiable via static source analysis — the styling is baked into component code, no runtime API needed.
- TC-DS-003-06 (error bubble) verified statically; the error path in `MessageBubble.tsx` renders a token-styled bubble. No code path outputs raw JSON to UI.

---

*Story created: 2026-04-13 | Automation run: 2026-04-29 | UI-contract automation added: 2026-06-03 (`e2e/us-design-003-generation-ux.spec.ts`) | Remaining: live-API fidelity + usage increment — human on staging*
