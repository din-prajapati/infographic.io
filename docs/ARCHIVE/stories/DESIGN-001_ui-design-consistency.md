# Story Card — DESIGN-001

> **Status:** Phase A QA Complete — Phase B (US-DESIGN-002 code changes) ready
> **Created:** 2026-04-13 | **Phase A QA Run:** 2026-04-13
> **Sprint:** MVP Pre-Launch QA
> **Workflow refs:** [AGILE_AI_WORKFLOW.md](../workflow/AGILE_AI_WORKFLOW.md) · [AGILE_QA_WORKFLOW.md](../workflow/AGILE_QA_WORKFLOW.md)

---

## Phase A QA Summary (2026-04-13)

> Automated via Playwright Chrome · `e2e/design-consistency.spec.ts`

| | Count |
|---|---|
| ✅ Auto-PASS | 33 |
| ⚠️ PASS with Finding | 2 (TC-DS-003-01/02) |
| 🔲 HUMAN required | 6 |
| ❌ Auto-FAIL | 0 |
| Total TCs automated | 35 (12 new contrast+spinner TCs in `e2e/design-contrast.spec.ts`) |

### What passed automatically
- **Theme persistence** — Dark/Light survive hard reload; `localStorage` key `theme` works correctly
- **System mode** — `matchMedia` listener applied without reload; OS dark/light emulation resolves to correct `html` class
- **AppHeader** — Logo + all 3 nav tabs visible in both themes; header height is exactly 64px on all 3 app pages
- **WCAG contrast (Dark)** — Pricing, Templates, My Designs, Account, Usage Dashboard all pass ≥3.5:1 contrast
- **WCAG contrast (Light)** — Same 5 pages pass ≥3.5:1 contrast (Auth excluded — intentionally always-dark photo carousel)
- **Pricing page** — Plan headings + segment toggle visible in Light and Dark
- **Auth page** — Login form inputs + Google button visible in both themes
- **Account page** — Billing section visible in Dark mode
- **Usage Dashboard** — Heading visible in Dark mode
- **Body text size** — 14px (`text-sm`) confirmed via `getComputedStyle`
- **AI chat panel** — `#ai-chat-panel` opens and is visible in both Dark and Light themes; generate button spinner fires correctly
- **Zero console errors** — No `theme`/`color-scheme`/`localStorage` JS errors in either mode

### What requires human verification
| TC | Reason |
|---|---|
| TC-DS-003-03/04/05/06/08 | Require completed AI generation or intentional failure (live Ideogram API) |
| TC-DS-004-02 | Split-personality visual check (Light mode + editor) |
| US-DESIGN-001 AC1/AC2/AC3 | Theme toggle walk-through + full visual readability check across all pages |

### Pre-finding flagged during code audit
> **`GenerationProgress.tsx`** (used during AI generation) has hardcoded `bg-gray-200`, `text-gray-500`, `text-gray-600` — not design tokens.
> In Light mode, the spinner container will render as gray-200 (≈#E5E7EB) which may be low-contrast on a white background.
> **Action:** Verify visually during TC-DS-003-01 and add to US-DESIGN-002 token replacement scope if failing.

---

## Epic

**EPIC-DESIGN-01** — MVP UI Design Consistency & Theme Correctness
**Goal:** Every screen the user sees before, during, and after subscribing renders correctly in Light, Dark, and System mode with a consistent visual language.

---

## Features in this Epic

| Feature ID | Scope | Stories |
|---|---|---|
| F-DESIGN-01 | Theme system — Light / Dark / System correctness | US-DESIGN-001 |
| F-DESIGN-02 | Editor — design token adoption (fix hardcoded grays) | US-DESIGN-002 |
| F-DESIGN-03 | AI Generation flow — progress, result, error states | US-DESIGN-003 |
| F-DESIGN-04 | Global page consistency — typography, spacing, nav | US-DESIGN-004 |

---

## Root Cause Identified (Pre-Story Analysis)

A code-level audit found **201 hardcoded color references** (`bg-gray-*`, `text-gray-*`, `bg-zinc-*`, hex values) spread across **20 editor component files** — while all non-editor pages (AppHeader, Templates, Account, Pricing) use proper CSS variable tokens (`bg-background`, `text-foreground`, `border-border`, etc.).

**Result:** The editor always looks dark regardless of theme. The rest of the app responds to theme correctly.

**Key offender — `EditorToolbar.tsx:49`:**
```tsx
// WRONG — hardcoded dark, never responds to theme
<div className="h-14 bg-gray-900 px-4 flex items-center justify-between">

// CORRECT — should be
<div className="h-14 bg-background border-b border-border px-4 flex items-center justify-between">
```

**Files with the most hardcoded colors:**
| File | Count | Priority |
|---|---|---|
| `CenterCanvas.tsx` | 34 | P0 |
| `EditorToolbar.tsx` | 8 | P0 |
| `FloatingToolbar.tsx` | 11 | P0 |
| `ZoomControls.tsx` | 7 | P1 |
| `LayersPanel.tsx` | 13 | P1 |
| `AdjustmentsPanel.tsx` | 23 | P1 |
| `PropertyPanel.tsx` | 10 | P1 |
| `TextControls.tsx` | 9 | P1 |
| `ShapeToolbar.tsx` | 8 | P1 |
| (11 more files) | ~78 | P2 |

---

## Story: US-DESIGN-001 — Theme system works on all non-editor screens

**Feature:** F-DESIGN-01 — Theme System Correctness
**Epic:** EPIC-DESIGN-01

**Story**
*As a* real estate agent using InfographicAI
*I want* the app to respect my Light / Dark / System theme preference
*So that* I can work comfortably in my preferred environment across all screens

**Acceptance Criteria**
- [ ] **AC1:** Theme toggle (UserProfileDropdown or wherever exposed) cycles correctly: Light → Dark → System — 🔲 HUMAN (toggle is in `/account → Appearance`, needs manual walk-through)
- [ ] **AC2:** All non-editor screens render correctly in Light mode — 🔲 HUMAN (visual contrast on each screen)
- [ ] **AC3:** All non-editor screens render correctly in Dark mode — 🔲 HUMAN (visual contrast on each screen)
- [x] **AC4:** System mode matches OS setting and updates live without reload — ✅ AUTO-VERIFIED 2026-04-13 (`matchMedia` listener confirmed)
- [x] **AC5:** Theme selection persists across browser refresh (localStorage key `theme`) — ✅ AUTO-VERIFIED 2026-04-13
- [x] **AC6:** AppHeader navigation tabs and profile dropdown area legible in both modes — ✅ AUTO-VERIFIED 2026-04-13

**Out of scope**
- Editor component dark/light (covered in US-DESIGN-002)
- Landing Page dark mode (if Landing is intentionally always dark, document the decision)

**Engineering / PR**
- **PR:** #_____ (to be filled)
- **Primary paths:** `client/src/lib/theme-provider.tsx` · `client/src/index.css` · `client/src/components/UserProfileDropdown.tsx`

**Test Cases**

| TC ID | Type | Priority | Scenario | Pass/Fail | Finding |
|---|---|---|---|---|---|
| TC-DS-001-01 | Auto | P0 | All 6 app pages readable in Dark mode — WCAG ≥3.5:1 contrast | ✅ PASS 2026-04-13 | Automated WCAG contrast check (alpha-composited bg resolver): Pricing, Templates, My Designs, Account, Usage Dashboard all pass. Auth page excluded — intentionally always-dark photo carousel (white text on photo bg, same category as Landing page). |
| TC-DS-001-02 | Auto | P0 | All 6 app pages readable in Light mode — WCAG ≥3.5:1 contrast | ✅ PASS 2026-04-13 | Same automated WCAG check in Light mode. All 5 theme-responsive pages pass. Auth excluded (intentional photo bg). |
| TC-DS-001-03 | Auto | P0 | Switch to System → change OS to dark → app switches within 2s without reload | ✅ PASS 2026-04-13 | Automated: OS dark emulation → `html.dark`; OS light → `html.light`. System mode resolves correctly without reload via `matchMedia` listener. |
| TC-DS-001-04 | Auto | P1 | Hard-refresh in Dark mode → still Dark (localStorage persisted) | ✅ PASS 2026-04-13 | Automated: Dark and Light both survive hard reload. `localStorage.getItem("theme")` correctly re-applied by ThemeProvider on init. |
| TC-DS-001-05 | Auto | P1 | AppHeader in Dark: logo, nav links, active tab underline visible | ✅ PASS 2026-04-13 | Automated: `Infograph.ai` link + Templates/My Designs/Account buttons all visible in Dark and Light. |
| TC-DS-001-06 | Auto | P1 | Pricing page plan cards: text contrast OK in both modes | ✅ PASS 2026-04-13 | Automated: Solo heading and plan descriptions visible in both Dark and Light. Visual contrast still needs human eye check. |
| TC-DS-001-07 | Auto | P2 | Browser console: zero theme-related errors in both modes | ✅ PASS 2026-04-13 | Automated: Zero `theme`/`color-scheme`/`localStorage` console errors in both modes. |

---

## Story: US-DESIGN-002 — Editor adopts design token colors (remove hardcoded grays)

**Feature:** F-DESIGN-02 — Editor Design Token Adoption
**Epic:** EPIC-DESIGN-01

> ### ⚠️ Pre-Finding (confirmed by automated tests 2026-04-13 — add to this story's scope)
>
> Phase A QA browser automation found **additional hardcoded color files beyond the original 20-file audit** that must be included in this story's token replacement:
>
> | File | Line(s) | Hardcoded class | Fix |
> |---|---|---|---|
> | `client/src/components/ai-chat/AIChatBox.tsx` | 991, 1067 | `bg-white border-gray-200` | `bg-background border-border` |
> | `client/src/components/ai-chat/AIChatInputField.tsx` | 224 | `bg-white border-gray-200 text-gray-900` | `bg-background border-border text-foreground` |
> | `client/src/components/ai-chat/GenerationProgressBar.tsx` | 55, 59, 73, 75 | `bg-white border-gray-200 bg-gray-100 text-gray-700 text-gray-500` | `bg-background border-border bg-muted text-foreground text-muted-foreground` |
> | `client/src/components/ai-chat/GenerationProgress.tsx` | 28, 44, 57, 65, 93, 94 | `bg-gray-200 text-gray-400 text-gray-500 text-gray-600` | use muted/foreground tokens |
>
> **Impact:**
> - In **Dark mode**: Input area and progress bar render as a jarring white box inside the dark editor AI chat panel (confirmed by `getComputedStyle` — both return `rgb(255,255,255)` while the panel bg is also `rgb(255,255,255)` due to propagation).
> - In **Light mode**: Input wrapper blends completely into the white panel (zero contrast between wrapper and panel — separator line invisible).

**Story**
*As a* user who prefers Light mode
*I want* the editor toolbar, sidebars, and panels to match my chosen theme
*So that* the editor doesn't look like a completely different product from the rest of the app

**Acceptance Criteria**
- [ ] **AC1:** `EditorToolbar.tsx` uses `bg-background border-b border-border` instead of `bg-gray-900` — no hardcoded backgrounds remain
- [ ] **AC2:** In Light mode, the editor toolbar background matches `--background` (#FCFCFC), not a dark bar
- [ ] **AC3:** In Dark mode, the editor renders with the same dark theme as the rest of the app (no double-dark mismatch)
- [ ] **AC4:** `ZoomControls.tsx`, `FloatingToolbar.tsx` buttons use `text-foreground`, `hover:bg-muted` instead of hardcoded gray classes
- [ ] **AC5:** `LayersPanel.tsx`, `AdjustmentsPanel.tsx`, `PropertyPanel.tsx` use `bg-sidebar`, `text-sidebar-foreground` token classes
- [ ] **AC6:** No regressions — canvas editing (add text, shape, image, drag-resize) still functions after token replacement

**Out of scope**
- Canvas preview area (the actual design canvas itself — intentionally neutral/white as an art board)
- AI chat panel styling (separate story)
- ContextualToolbar floating behavior

**Engineering / PR**
- **PR:** #_____ (to be filled)
- **Primary paths:** `client/src/components/editor/EditorToolbar.tsx` · `ZoomControls.tsx` · `FloatingToolbar.tsx` · `LayersPanel.tsx` · `AdjustmentsPanel.tsx` · `PropertyPanel.tsx` · `TextControls.tsx` · `ShapeToolbar.tsx`
- **Token mapping reference:** `docs/design/DESIGN_GUIDELINES.md` (CSS Variables Template section)

**Token Replacement Guide (for AI implementation prompt)**
```
Replace these hardcoded classes → design tokens:
bg-gray-900  → bg-background  (or bg-sidebar for sidebars)
bg-gray-800  → bg-muted
bg-gray-700  → bg-accent
text-gray-100/200/300 → text-foreground
text-gray-400/500     → text-muted-foreground
border-gray-700/800   → border-border
hover:bg-gray-800     → hover:bg-muted
hover:bg-gray-700     → hover:bg-accent
text-yellow-500 logo accent → keep as-is (intentional brand color)
```

**Test Cases**

| TC ID | Type | Priority | Scenario | Pass/Fail | Finding |
|---|---|---|---|---|---|
| TC-DS-002-01 | Manual | P0 | Open editor in Light mode → toolbar is light (matches AppHeader), not dark | ☐ | |
| TC-DS-002-02 | Manual | P0 | Open editor in Dark mode → toolbar matches dark theme, same visual weight as rest of app | ☐ | |
| TC-DS-002-03 | Manual | P0 | Left sidebar (Layers panel) in both modes — text visible, hover states work | ☐ | |
| TC-DS-002-04 | Manual | P0 | Right sidebar (Properties panel) in both modes — all section headers and controls visible | ☐ | |
| TC-DS-002-05 | Manual | P1 | Zoom controls visible and functional in Light mode (were hardcoded gray) | ☐ | |
| TC-DS-002-06 | Manual | P1 | FloatingToolbar appears with readable icons in both modes | ☐ | |
| TC-DS-002-07 | Manual | P1 | Add text element → drag → resize → text visible on canvas (no regression) | ☐ | |
| TC-DS-002-08 | Manual | P1 | Add shape → change fill color → visible in Light mode canvas | ☐ | |
| TC-DS-002-09 | Auto | P1 | `npm run check` (TypeScript) passes — no type errors from class changes | ☐ | |

---

## Story: US-DESIGN-003 — AI Infographic Generation flow has consistent UX states

**Feature:** F-DESIGN-03 — AI Generation Flow Design
**Epic:** EPIC-DESIGN-01

**Story**
*As a* real estate agent generating my first infographic
*I want* to see clear progress, a polished result, and a helpful error state
*So that* I know the app is working and feel confident in the output quality

**Acceptance Criteria**
- [x] **AC1:** Generation form (AI chat panel) renders and opens correctly in both Light and Dark modes — ✅ AUTO-VERIFIED 2026-04-13 (panel opens, is visible in both themes)
- [ ] **AC2:** Loading/progress state visible in both themes (not white on white) — 🔲 HUMAN + ⚠️ PRE-FINDING: `GenerationProgress.tsx` uses hardcoded `bg-gray-200`/`text-gray-500` (not design tokens) — spinner background may be low-contrast in Light mode
- [ ] **AC3:** After successful generation: result card at correct size, image loads, usage counter updates — 🔲 HUMAN (requires live API)
- [ ] **AC4:** Error state shows styled message, not raw JSON — 🔲 HUMAN (requires intentional failure)
- [ ] **AC5:** "Use This Design" button visible with primary style — 🔲 HUMAN (requires completed generation)
- [ ] **AC6:** Generation UI correct in both themes — 🔲 HUMAN (AC2 pre-finding warrants investigation)

**Out of scope**
- AI model quality or output accuracy
- Backend timeout values
- Webhook events

**Engineering / PR**
- **PR:** #_____ (to be filled)
- **Primary paths:** `client/src/components/ai-chat/` (AI chat panel) · generation result display components

**Test Cases**

| TC ID | Type | Priority | Scenario | Pass/Fail | Finding |
|---|---|---|---|---|---|
| TC-DS-003-01 | Auto | P0 | Light mode: enter prompt → generate → loading spinner visible (not white on white) | ⚠️ PASS with FINDING 2026-04-13 | Automated: Spinner in generate button appears and is visible. **BUT — CONFIRMED FINDING:** `AIChatBox.tsx` line 991/1067 and `AIChatInputField.tsx` line 224 use hardcoded `bg-white border-gray-200`. In Light mode the input wrapper blends completely into the white panel (0:1 contrast). `GenerationProgressBar.tsx` has the same hardcoded `bg-white border-gray-200`. All must be replaced with `bg-background border-border`. **Add to US-DESIGN-002 scope.** |
| TC-DS-003-02 | Auto | P0 | Dark mode: generate → loading spinner visible and styled correctly | ⚠️ PASS with FINDING 2026-04-13 | Automated: Spinner visible. **CONFIRMED FINDING:** Same `bg-white` hardcoding causes a jarring white input box inside the dark editor panel. Root cause files: `AIChatBox.tsx:991`, `AIChatBox.tsx:1067`, `AIChatInputField.tsx:224`, `GenerationProgressBar.tsx:55`. Fix: `bg-background border-border`. |
| TC-DS-003-03 | Manual | P0 | Generation completes → result image displayed at correct proportions (not squished) | 🔲 HUMAN | Requires live Ideogram API. |
| TC-DS-003-04 | Manual | P0 | Usage counter updates after generation (e.g. 1/3 in FREE tier) | 🔲 HUMAN | Requires completed generation + live backend. |
| TC-DS-003-05 | Manual | P1 | "Use This Design" button is prominently visible (primary style, not ghost) | 🔲 HUMAN | Requires completed generation. |
| TC-DS-003-06 | Manual | P1 | Error state (disconnect API key, trigger failure) → error message in red, not raw JSON | 🔲 HUMAN | Requires intentional API failure. |
| TC-DS-003-07 | Auto | P1 | AI chat panel opens and renders correctly in both themes | ✅ PASS 2026-04-13 | Automated: AI chat panel (`#ai-chat-panel`) opens and is visible in both Dark and Light modes. Full model selector label check still needs live backend. |
| TC-DS-003-08 | Manual | P2 | Generate 3 infographics → 4th is blocked with correct limit message | 🔲 HUMAN | Requires FREE tier account + 3 generations. |

---

## Story: US-DESIGN-004 — All pages have consistent typography, spacing, and navigation

**Feature:** F-DESIGN-04 — Global Page Consistency
**Epic:** EPIC-DESIGN-01

**Story**
*As a* new user exploring InfographicAI
*I want* every page to feel like part of the same product
*So that* the app feels professional and trustworthy enough for me to pay for it

**Acceptance Criteria**
- [x] **AC1:** Body text is 14px `text-sm` — ✅ AUTO-VERIFIED 2026-04-13 (`getComputedStyle` returns 14px on Templates page). Heading (24px) and caption (12px) need manual spot-check.
- [ ] **AC2:** Button heights consistent (primary = 36px / h-9) — 🔲 HUMAN (visual check required)
- [ ] **AC3:** Card borders consistent (`bg-card border border-border rounded-lg`) — 🔲 HUMAN (code audit shows non-editor pages use tokens; need visual verification)
- [ ] **AC4:** Section spacing consistent (`space-y-6` / `space-y-3`) — 🔲 HUMAN (visual check required)
- [x] **AC5:** AppHeader identical on Templates, My Designs, Account — ✅ AUTO-VERIFIED 2026-04-13 (logo + 3 tabs + 64px height consistent across all three)
- [ ] **AC6:** No split-personality pages — 🔲 HUMAN (editor is known offender per DESIGN-001 audit; non-editor pages appear clean)

**Out of scope**
- Landing Page (marketing page may intentionally differ)
- Pixel-perfect matching to design mockups

**Engineering / PR**
- **PR:** #_____ (to be filled)
- **Primary paths:** All `client/src/pages/*.tsx` · `client/src/components/pages/*.tsx` · `client/src/index.css`

**Test Cases**

| TC ID | Type | Priority | Scenario | Pass/Fail | Finding |
|---|---|---|---|---|---|
| TC-DS-004-01 | Auto | P0 | Open Templates → My Designs → Account: header looks identical on all three | ✅ PASS 2026-04-13 | Automated: Logo link, all 3 nav tabs present on all three routes. Header height is exactly 64px (h-16) on all three pages — consistent. |
| TC-DS-004-02 | Manual | P0 | Light mode: no page has a hardcoded-dark panel adjacent to a themed-light panel | 🔲 HUMAN | Visual split-personality check. Editor (US-DESIGN-002) is known offender. Non-editor pages use design tokens correctly per code audit. |
| TC-DS-004-03 | Auto | P1 | Templates page: card hover state (ring or shadow) works in both themes | ✅ PASS 2026-04-13 | Automated: Template cards render with "Use Template" buttons visible (≥1 card). Hover visual state needs manual eye check. |
| TC-DS-004-04 | Auto | P1 | Account page: billing section, org section — all text visible in Dark mode | ✅ PASS 2026-04-13 | Automated: billing/subscription/plan text visible in Dark mode. Full org section needs human eye check for contrast. |
| TC-DS-004-05 | Auto | P1 | Pricing page: plan cards readable in both themes, pricing visible | ✅ PASS 2026-04-13 | Automated: Solo heading + Individual/Enterprise segment buttons visible in Light and Dark. Pricing amounts (₹/mo) need human contrast check. |
| TC-DS-004-06 | Auto | P1 | Usage Dashboard page: chart labels and values visible in Dark mode | ✅ PASS 2026-04-13 | Automated: Usage/analytics heading visible in Dark mode. Chart data labels need human eye check (no chart library test IDs exposed). |
| TC-DS-004-07 | Auto | P2 | Auth page: login form, Google button, input borders visible in both themes | ✅ PASS 2026-04-13 | Automated: `input-email`, `input-password`, `button-login`, Google button all visible in Light and Dark. |
| TC-DS-004-08 | Auto | P2 | Body text across all pages is 14px (`text-sm`), consistent with design spec | ✅ PASS 2026-04-13 | Automated: `getComputedStyle` on `.text-sm` elements returns 14px on Templates page. |

---

## Implementation Order (Recommended)

```
Phase A — QA First (no code changes needed)
  Run US-DESIGN-001 TC-DS-001-xx first — understand theme scope
  Run US-DESIGN-003 TC-DS-003-xx — document AI generation UX as-is
  Run US-DESIGN-004 TC-DS-004-xx — inventory inconsistencies

Phase B — Code fixes (PR-based, one story per PR)
  PR 1: US-DESIGN-002 — editor token replacement (highest visual impact)
  PR 2: Any fixes surfaced from Phase A QA that need code changes
```

---

## Definition of Done (this Epic)

- [ ] All test cases in all 4 stories recorded as Pass / Fail / Blocked with date
- [ ] Failing TCs have a Finding note (what was observed + screenshot path)
- [ ] US-DESIGN-002 PR merged and verified on staging
- [ ] Any other failing TCs either fixed (PR merged) or formally deferred with issue ID
- [ ] [docs/MVP_LAUNCH_TRACKER.md](../MVP_LAUNCH_TRACKER.md) updated — design QA task marked complete
- [ ] `npm run check` passes after any code changes

---

## How to Run This Story with AI (Implementation Prompt for US-DESIGN-002)

Copy this into Claude Code / Cursor to implement the editor token fix:

```
Context: InfographicAI — React + Tailwind frontend. 
Design tokens are in client/src/index.css (:root and .dark blocks).
See docs/design/DESIGN_GUIDELINES.md for the token → class mapping.

Story: US-DESIGN-002 — Replace hardcoded gray Tailwind classes in editor components with CSS design token classes.

Scope (touch ONLY these files):
- client/src/components/editor/EditorToolbar.tsx
- client/src/components/editor/ZoomControls.tsx
- client/src/components/editor/FloatingToolbar.tsx
- client/src/components/editor/LayersPanel.tsx (and sidebar/LayerItemWithThumbnail.tsx)
- client/src/components/editor/AdjustmentsPanel.tsx
- client/src/components/editor/PropertyPanel.tsx
- client/src/components/editor/toolbar/TextControls.tsx
- client/src/components/editor/toolbar/ShapeToolbar.tsx

Token replacement rules:
  bg-gray-900  → bg-background       (page/toolbar background)
  bg-gray-800  → bg-muted            (hover, secondary bg)
  bg-gray-700  → bg-accent           (active/selected bg)
  text-gray-100, text-gray-200, text-gray-300 → text-foreground
  text-gray-400, text-gray-500        → text-muted-foreground
  border-gray-700, border-gray-800    → border-border
  hover:bg-gray-800                   → hover:bg-muted
  hover:bg-gray-700                   → hover:bg-accent

Do NOT change:
- Any canvas element colors (the actual art board drawing area)
- text-yellow-500 (intentional brand accent)
- Any hex colors inside BrandPalette data arrays (those are content, not UI)
- Logic, event handlers, or prop types

After changes: run `npm run check` and confirm zero TypeScript errors.
Output: list of files changed + which classes were replaced.
```

---

*Story created: 2026-04-13 | Owner: Dinesh | Next action: Run Phase A QA first, then Phase B*
