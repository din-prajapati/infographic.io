# EPIC-DESIGN-01 — MVP UI Design Consistency & Theme Correctness

> **Phase:** Phase 0 — MVP Launch  
> **Status:** 🟡 In Progress  
> **Linear Project:** LIN-EPIC-01 (create when setting up Linear)  
> **Target date:** 2026-04-30  
> **Owner:** Dinesh

---

## Goal

**Outcome:** Every screen the user sees before, during, and after subscribing renders correctly in Light, Dark, and System mode with a consistent visual language — no hardcoded dark panels next to themed-light panels.

**Why now:** Pre-launch polish. A 2026-04 audit found **201 hardcoded color references** across ~20 editor files; non-editor pages already use tokens. US-DESIGN-002 delivered a broad token pass + shared popover + Quick Style contrast; **AI Chat** now has **zero** `gray-*` / `zinc-*` / `bg-white` matches in `.tsx` (verified 2026-04-15). **Editor** still has **residual** gray/white utilities in secondary UI — see [M-DESIGN-02](milestones/M-DESIGN-02-editor-tokens.md).

**Success metric:** Theme toggle walks through Light → Dark → System on all pages including the editor, with no visual inconsistencies. All TC-DS-xxx test cases pass or have a recorded finding.

---

## Milestones

| Milestone | Scope | Target | Status |
|-----------|-------|--------|--------|
| [M-DESIGN-01 — Theme & Global QA](milestones/M-DESIGN-01-theme-QA.md) | QA all non-editor pages (no code changes) | 2026-04-13 | ✅ Done |
| [M-DESIGN-02 — Editor Token Fix](milestones/M-DESIGN-02-editor-tokens.md) | US-002 token pass (editor + AI chat + popovers); AI chat grep-clean; editor residuals optional follow-up | 2026-04-30 | 🟡 In Progress |

---

## Stories in this Epic

| Story ID | Title | Milestone | Status | PR |
|----------|-------|-----------|--------|----|
| [US-DESIGN-001](stories/US-DESIGN-001/STORY.md) | Theme system works on all non-editor screens | M-DESIGN-01 | 🟡 Partial (ACs 4–7 ✅ auto, ACs 1–3 🔲 human) | — |
| [US-DESIGN-002](stories/US-DESIGN-002/STORY.md) | Editor + AI chat adopt design tokens + dark-mode polish | M-DESIGN-02 | ✅ Done | [#1](https://github.com/din-prajapati/infographic.io/pull/1) |
| [US-DESIGN-003](stories/US-DESIGN-003/STORY.md) | AI Generation flow has consistent UX states | M-DESIGN-02 | 🟡 AC1 ✅ auto, AC2–6 🔲 human | — |
| [US-DESIGN-004](stories/US-DESIGN-004/STORY.md) | All pages have consistent typography and nav | M-DESIGN-01 | 🟡 AC1,5 ✅ auto, AC2–4,6 🔲 human | — |

---

## Features in this Epic

| Feature ID | Scope | Stories |
|------------|-------|---------|
| F-DESIGN-01 | Theme system — Light / Dark / System correctness | US-DESIGN-001 |
| F-DESIGN-02 | Editor — design token adoption (fix hardcoded grays) | US-DESIGN-002 |
| F-DESIGN-03 | AI Generation flow — progress, result, error states | US-DESIGN-003 |
| F-DESIGN-04 | Global page consistency — typography, spacing, nav | US-DESIGN-004 |

---

## Root Cause (Pre-Story Analysis)

A code-level audit found **201 hardcoded color references** (`bg-gray-*`, `text-gray-*`, `bg-zinc-*`, hex values) across **20 editor component files**. All non-editor pages use proper CSS variable tokens.

**Result:** Editor always looks dark regardless of theme. Non-editor pages respond correctly.

**Top offender files for US-DESIGN-002:**
| File | Hardcoded count | Priority |
|------|----------------|----------|
| `client/src/components/editor/CenterCanvas.tsx` | 34 | P0 |
| `client/src/components/editor/AdjustmentsPanel.tsx` | 23 | P1 |
| `client/src/components/editor/LayersPanel.tsx` | 13 | P1 |
| `client/src/components/editor/FloatingToolbar.tsx` | 11 | P1 |
| `client/src/components/editor/PropertyPanel.tsx` | 10 | P1 |
| `client/src/components/editor/EditorToolbar.tsx` | 8 | P0 |
| `client/src/components/editor/toolbar/TextControls.tsx` | 9 | P1 |
| `client/src/components/editor/toolbar/ShapeToolbar.tsx` | 8 | P1 |
| `client/src/components/editor/ZoomControls.tsx` | 7 | P1 |
| (11 more files) | ~78 | P2 |

**AI chat files (found during Phase A QA — add to US-DESIGN-002 scope):**
| File | Lines | Issue |
|------|-------|-------|
| `client/src/components/ai-chat/AIChatBox.tsx` | 991, 1067 | `bg-white border-gray-200` |
| `client/src/components/ai-chat/AIChatInputField.tsx` | 224 | `bg-white border-gray-200 text-gray-900` |
| `client/src/components/ai-chat/GenerationProgressBar.tsx` | 55, 59, 73, 75 | `bg-white border-gray-200 bg-gray-100` |
| `client/src/components/ai-chat/GenerationProgress.tsx` | 28, 44, 57, 65, 93, 94 | `bg-gray-200 text-gray-400/500/600` |

---

## Out of Scope (Epic Level)

- Canvas preview area (the actual art board — intentionally neutral)
- Landing page dark mode (intentionally always-dark)
- Design mockup pixel-perfect matching
- AI model quality or output accuracy

---

## Architecture Notes

```
Design tokens: client/src/index.css (:root and .dark blocks)
Token guide:   docs/design/DESIGN_GUIDELINES.md
Editor root:   client/src/components/editor/
AI chat:       client/src/components/ai-chat/
Shared UI:     client/src/components/ui/dropdown-menu.tsx (popover surfaces — theme tokens, not hardcoded glass)
Theme provider: client/src/lib/theme-provider.tsx
```

Token replacement table (for AI prompts):
```
bg-gray-900   → bg-background    (toolbar/page background)
bg-gray-800   → bg-muted         (secondary bg, hover)
bg-gray-700   → bg-accent        (active/selected)
text-gray-100/200/300 → text-foreground
text-gray-400/500     → text-muted-foreground
border-gray-700/800   → border-border
hover:bg-gray-800     → hover:bg-muted
hover:bg-gray-700     → hover:bg-accent
bg-white              → bg-background   (AI chat input/progress)
border-gray-200       → border-border
text-gray-900         → text-foreground
```

---

## Implementation update (2026-04-16)

- **US-DESIGN-002:** Broad token pass on `feat/design-us-design-002-editor-tokens` (editor + AI chat + canvas selection; see [STORY.md](stories/US-DESIGN-002/STORY.md)).
- **Verification (2026-04-15):** `ai-chat/*.tsx` — **no** `gray-*` / `zinc-*` / `bg-white` matches. `editor/` — **residual** matches remain (toolbar helpers, `EditableTitle`, preview/template chrome, etc.) — list in [M-DESIGN-02](milestones/M-DESIGN-02-editor-tokens.md).
- **Shared menus:** `dropdown-menu.tsx` — `bg-popover` / `border-border`; `DropdownMenuSubContent` forwards `{...props}`.
- **Right sidebar:** Quick Styles — preview chip + canvas-aware `getColorForStyle()`.

**Remaining for M-DESIGN-02:** Merge US-DESIGN-002 PR, staging verify, **US-DESIGN-003** human TCs; optional sweep for **editor** residual Tailwind grays.

---

## Definition of Done (Epic)

- [x] M-DESIGN-01 closed ✅
- [ ] M-DESIGN-02 closed (waiting on PR merge + US-DESIGN-003 QA wrap-up)
- [ ] US-DESIGN-002 PR merged and verified on staging
- [ ] All 4 stories have status ✅ Done or remaining TCs formally deferred with issue ID
- [ ] `npm run check` + `npm run test:unit` passing after code changes
- [ ] [docs/MVP_LAUNCH_TRACKER.md](../../../../MVP_LAUNCH_TRACKER.md) design QA task ticked
- [ ] AGILE_INDEX.md epic row updated to ✅ Done

---

*Epic created: 2026-04-13 | Phase A QA run: 2026-04-13 | Last updated: 2026-04-15*
