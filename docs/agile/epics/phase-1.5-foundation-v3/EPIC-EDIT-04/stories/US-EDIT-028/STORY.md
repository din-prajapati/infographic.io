---
title: Story Card — US-EDIT-028
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-30
---

# Story Card — US-EDIT-028 — Guide bar: the four steps, light and dark

> **Status:** 🔲 Not Started — created 2026-10-30 by /new-story (split from the US-EDIT-024 L draft)
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-09-v3-shell](../../milestones/M-EDIT-09-v3-shell.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Depends on:** [US-EDIT-024](../US-EDIT-024/STORY.md) must be merged into the milestone branch first (top bar layout, lifted AI-chat state in `EditorLayout`, scoped shell tokens).
> **Created:** 2026-10-30 | **Closed:** —
> **Source:** [US-EDIT-024](../US-EDIT-024/STORY.md) draft AC2; V3 canvas mockup (`Mockups/buildographic-canvas-simplification-v3/index.html` — `div.journey`; untracked)

---

## Story

*As* an agent opening the editor
*I want* a guide through the four steps — choose a look, add details, refine, review and export — that shows where I am and takes me to each step
*So that* I always know the next step, and can hide the guide once I don't need it

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** A guide bar (`EditorGuideBar.tsx`, `nav` with `aria-label="Design steps"`, `data-testid="editor-guide-bar"`) sits directly under the top bar and is hidden in preview mode. It shows four buttons: **1 Choose a look** · **2 Add details** · **3 Refine** · **4 Review & export**.
- [ ] **AC2 [happy-path]:** Each step opens its place (today's equivalents — see Decision D4): 1 → `openPanel('templates')` (the Templates flyout); 2 → the right panel switches to its **Property** tab; 3 → the AI panel opens (the state US-EDIT-024 lifted into `EditorLayout`); 4 → the existing Export handler (`handleExport`). Switching the right-panel tab from outside means the tab value moves from `RightSidebar`'s local `useState` into `PanelStateProvider` (`rightTab` / `setRightTab`); the Design / Property / Agent buttons keep working.
- [ ] **AC3 [happy-path]:** The current step carries `aria-current="step"` and a highlighted style, computed by the pure function `currentGuideStep({ elementCount, property })` in new `client/src/lib/editorGuide.ts` (rule in Decision D3): **1** when the canvas has no elements; **2** when there are elements and any of `property.headline`, `property.price`, `property.address` is empty (trimmed); **3** otherwise. Step 4 is never auto-highlighted — it is an action.
- [ ] **AC4 [happy-path]:** A collapse button (`aria-label="Hide steps"`, then `"Show steps"`, with `aria-expanded`) hides the four steps and leaves a single-line bar. The choice is stored in `localStorage` under `editor.guideBar.collapsed:<user.id>` (user from `useAuth()`); after a reload, the same user sees the same state; a different user on the same browser starts expanded. `clearUserStorage()` does not clear it.
- [ ] **AC5 [theme]:** Theme tokens only — the US-EDIT-024 AC6 grep finds no hex, `rgb()`/`rgba()` or Tailwind palette class in the added lines. Contrast ≥ 4.5:1 in light and dark: `e2e/us-edit-028-guide-bar.spec.ts` runs the scoped WCAG probe (as in US-EDIT-024 AC7) over `[data-testid="editor-guide-bar"]`, expanded and collapsed, in both themes → zero failures. The highlighted step is checked too.
- [ ] **AC6 [regression]:** `npm run check` and `npm run test:unit` pass; `qa-canvas-editor`, `design-consistency` and `us-ai-036-canvas-orientation` pass unchanged on localhost; the canvas still fits the viewport (`scheduleFitCanvasZoomToViewport`) with the guide bar expanded and collapsed.

---

## Out of Scope

- The Look picker in the Design tab (US-EDIT-022), the AI Assistant panel (US-EDIT-023), the export review dialog (US-EDIT-021) — when they land, each retargets its step in one line
- Renaming the Agent tab to Contact (US-EDIT-022 / 025)
- Syncing the collapsed state across devices (it is per browser)
- The "Guide" help dialog from the mockup's rail
- Top bar, canvas header (US-EDIT-024) and tool rail (US-EDIT-029)

---

## Engineering / PR

- **Branch:** `feat/edit/m-09-v3-shell` (milestone branch)
- **PR:** #_____
- **Primary files touched:**
  - `client/src/components/editor/EditorGuideBar.tsx` — new
  - `client/src/lib/editorGuide.ts` — new: `currentGuideStep()`, `guideCollapsedKey()`
  - `client/src/lib/__tests__/editorGuide.spec.ts` — new
  - `client/src/lib/panelState.tsx` — `rightTab` / `setRightTab` + `RightPanelTab` type
  - `client/src/components/editor/RightSidebar.tsx` — read the tab from `usePanelState()` instead of local state (one hook swap)
  - `client/src/components/editor/EditorLayout.tsx` — mount the guide bar; wire the four step actions
  - `e2e/us-edit-028-guide-bar.spec.ts` — new

---

## AI Implementation Prompt

> Paste this block into Claude Code to implement the story.

```
Context: Buildographic (code name InfographicAI) — React 18 + Vite, Wouter, Zustand, Tailwind v3 + shadcn/ui.
Prerequisite: US-EDIT-024 merged into feat/edit/m-09-v3-shell (top bar, isAIChatExpanded owned by EditorLayout,
scoped shell tokens).

Story: US-EDIT-028 — Guide bar: the four steps, light and dark

Acceptance Criteria:
AC1: EditorGuideBar (nav aria-label="Design steps", data-testid="editor-guide-bar") under the top bar, hidden in preview:
     1 Choose a look · 2 Add details · 3 Refine · 4 Review & export.
AC2: 1 → openPanel('templates'); 2 → setRightTab('property-details'); 3 → setIsAIChatExpanded(true); 4 → handleExport.
     Move RightSidebar's activeTab useState into PanelStateProvider (rightTab, setRightTab, type RightPanelTab =
     'design' | 'property-details' | 'agent-info'). The three tab buttons keep working.
AC3: currentGuideStep({ elementCount, property }) in client/src/lib/editorGuide.ts: 1 if no elements; 2 if any of
     headline/price/address is blank (trimmed); else 3. Never 4. Current step → aria-current="step" + highlight.
AC4: Collapse toggle (aria-label "Hide steps"/"Show steps", aria-expanded); localStorage key
     `editor.guideBar.collapsed:${user.id}` via guideCollapsedKey(); wrap storage access in try/catch.
AC5: Token classes only; scoped contrast probe at 4.5:1 over the bar, expanded + collapsed, light + dark → 0 failures.
AC6: npm run check · npm run test:unit · qa-canvas-editor, design-consistency, us-ai-036 unchanged; canvas fit OK.

Architecture notes:
- PanelStateProvider already wraps EditorLayout's tree, so RightSidebar can call usePanelState().
- Read the property with usePropertyStore((s) => s.property); element count from useCanvasStore((s) => s.elements.length).
- Do not change RightSidebar beyond the activeTab hook swap — US-PROP-002, US-EDIT-022 and US-EDIT-025 all edit it.
- Re-run scheduleFitCanvasZoomToViewport() after collapse/expand so the canvas refits.

Out of Scope: Look picker (022) · AI Assistant panel (023) · export review (021) · Agent→Contact rename · cross-device sync.

Primary files (do NOT touch others): client/src/components/editor/EditorGuideBar.tsx (new) · client/src/lib/editorGuide.ts (new) ·
client/src/lib/__tests__/editorGuide.spec.ts (new) · client/src/lib/panelState.tsx · client/src/components/editor/RightSidebar.tsx ·
client/src/components/editor/EditorLayout.tsx · e2e/us-edit-028-guide-bar.spec.ts (new)

Rules: touch only these files; run `npm run check` and `npm run test:unit`; report files changed, ACs checked, test output.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-EDIT-028-01 | Unit | P0 | `currentGuideStep`: 0 elements → 1; 3 elements + blank price → 2; 3 elements + headline/price/address filled → 3; price "  " counts as blank — `editorGuide.spec.ts` | 🔲 | |
| TC-EDIT-028-02 | E2E | P0 | Given an empty canvas, then step 1 has `aria-current="step"`; when a template is applied and headline, price and address are typed in the Property tab, then step 3 has it | 🔲 | |
| TC-EDIT-028-03 | E2E | P0 | When step 2 is clicked, then the right panel shows the Property tab; when step 1 is clicked, the Templates flyout opens; when step 3 is clicked, `#ai-chat-panel` is visible | 🔲 | |
| TC-EDIT-028-04 | E2E | P0 | Given the bar is collapsed and the page reloaded, then it is still collapsed for that user; after logging in as a second user on the same browser, it is expanded | 🔲 | |
| TC-EDIT-028-05 | E2E | P0 | Scoped contrast probe at 4.5:1 over `editor-guide-bar`, expanded and collapsed, light and dark → 0 failures | 🔲 | |
| TC-EDIT-028-06 | E2E | P1 | When step 4 is clicked, then a PNG download starts (same as the top-bar Export) | 🔲 | |
| TC-EDIT-028-07 | Unit | P1 | `guideCollapsedKey('u1')` returns `editor.guideBar.collapsed:u1` — `editorGuide.spec.ts` | 🔲 | |
| TC-EDIT-028-08 | Manual | P1 | Clicking Design / Property / Agent in the right panel still switches tabs after the state move | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Notes

- **Decision D3 (owner) — what "current step" means.** The draft said "highlighted from editor state" without a rule. AC3 is the recommended rule (first incomplete step; headline, price and address are the facts the export check needs most). Confirm or replace before implementing.
- **Decision D4 (owner) — step targets before their stories land.** Recommended: point steps at today's equivalents (Templates flyout, Property tab, existing AI chat panel, current Export) and let US-EDIT-022 / 023 / 021 retarget them. The alternative — waiting for those stories — would block M-EDIT-09 on M-EDIT-06/07/08.
- `RightSidebar.tsx` is shared with US-PROP-002 (T6, generation request ~line 542), US-EDIT-022, US-EDIT-025, US-EDIT-020, US-EDIT-023 and US-EDIT-029; this story changes only the `activeTab` line (~277).

---

## Definition of Done

- [ ] All ACs checked ✅ · all test cases run and recorded
- [ ] `npm run check` · `npm run test:unit` pass
- [ ] Gate 2 — browser checks in light **and** dark (local, then staging)
- [ ] Merged into the M-EDIT-09 milestone branch (PR #_____)
- [ ] [TASKS.md](./TASKS.md) fully checked ✅ · STORY.md status `✅ Done`

---

## Implementation Update (log)

> Appended by code-agent during/after implementation. Newest entries on top.

### 2026-10-30 — created by /new-story (split from US-EDIT-024)
- The draft's step targets mostly don't exist yet: no Look picker (US-EDIT-022), no AI Assistant panel (US-EDIT-023), no export review (US-EDIT-021). The right panel's tab is local state in `RightSidebar`, so "step 2 opens the Property tab" needs that state lifted.
- The mockup's journey bar has neither a current-step highlight nor a collapse; both come from the draft card and are defined here.

---

*Story created: 2026-10-30*
