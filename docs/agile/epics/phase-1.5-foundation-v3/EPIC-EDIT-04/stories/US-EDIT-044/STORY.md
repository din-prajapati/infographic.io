# Story Card — US-EDIT-044

> **Status:** Implementation verified — review/merge pending
> **Feature:** N/A — responsive M-EDIT-11 extension
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-11-v3-editor-slice](../../milestones/M-EDIT-11-v3-editor-slice.md)
> **Linear:** Unassigned
> **Size:** M
> **Created:** 2026-11-13 | **Closed:** —

---

## Story

*As a* solo real estate agent preparing listing artwork on a phone or tablet
*I want* the V3 editor controls to adapt to my available screen
*So that* I can see the artwork and complete existing editing, saving and export actions without switching devices.

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When the authenticated agent opens `client/src/components/editor/v3/V3Editor.tsx` at 320, 375, 390, 768, 820, 1024 and 1440 CSS-pixel widths, the editor satisfies Responsive Contract clauses 1–7 below in both light and dark themes, with visible canvas and accessible existing save/export/editing controls.
- [x] **AC2 [error-path]:** When a panel/menu is opened, closed, scrolled or dismissed, the viewport changes orientation/size, a selected element is absent, or a save/export request is pending or fails, `V3Editor.tsx`, `V3Canvas.tsx` and existing contextual controls satisfy clauses 3–8 below without changing document geometry, adding document history, losing existing retry/error affordances, or leaving keyboard focus in hidden content.

## Responsive Contract

1. Given a portrait viewport 320–767px wide, the header is one compact 52–56px row with Projects, a truncated design title, Save and More; navigation is a horizontally scrollable bottom strip with each action at least 44×44 CSS pixels. Navigation retains an accessible name for every existing tool, including Listing, Agent and Brand. The page itself has no horizontal overflow.
2. Given a viewport 768–1199px wide, the compact header, side rail and an open 280–320px panel fit the viewport with a nonzero visible canvas region; the shell does not enforce a 1024px minimum. At widths >=1200px, current desktop navigation, panel composition and editing behavior remain available.
3. Given an initial phone load, tool content starts closed and the canvas is visible. When a phone navigation tool opens its content, it appears in a scrollable bottom sheet with named Expand/Collapse and Close controls. Collapsed sheet height is clamped between 160px and 380px using the available dynamic viewport (target: 100dvh minus 374px), leaving a visible canvas region; expanded content can expose long forms by internal scrolling. Escape and Close return focus to the opening control. In short landscape phone viewports (height <=500px and width <=767px), a bounded side panel may replace the bottom sheet to preserve canvas access. No tool content extends beyond the viewport.
4. When More opens on a phone, Preview, Export and Undo/Redo remain reachable and expose existing disabled/pending states. Save remains directly available. Listing pending Apply/Undo last apply and Template Fields remain reachable through their existing panel flow. Save/export failures retain the existing visible message and retry behavior; pending actions cannot falsely report completion.
5. When the viewport or panel dimensions change, `V3Canvas.tsx` fits/repositions the viewport using measured available dimensions. The document width/height and each element's x/y/width/height/rotation are unchanged solely by responsive layout, including save/reopen/export. Touch panning uses the existing Hand tool; no pinch-zoom redesign is introduced.
6. When Tools, element formatting, Layers, Arrange, color, image or Effects controls open, their controls and popovers remain reachable by internal scrolling or viewport clamping; no action requires accessing content outside the visible screen. Existing selected-element edits and Undo retain their established behavior.
7. Given light or dark theme, safe-area insets and dynamic browser height, the header, canvas, bottom navigation and panel controls remain within the visible app viewport. Phone text-entry controls render at >=16px font size. Interactive controls have keyboard-accessible names/focus; phone primary navigation and sheet actions have >=44×44px targets.
8. When no element is selected or a panel/menu closes during resize, selection-required actions retain current disabled/empty states, hidden content has no active focus, existing errors are not swallowed, and no document mutation/history entry is caused by a responsive transition. Legacy editor routes and default desktop behavior remain unchanged.

## Prerequisites and Size

Existing locally verified V3 listing and Arrange candidate on `codex/v3-arrange-opus`. Bounded M (2–4h) shell adaptation reuses existing controls and data flows; no new editing engine or mobile-only feature is included. Trace actual route → V3Editor → V3Canvas/panels/store before implementation. Historical desktop-only shell constraints are superseded only for this responsive slice.

## Out of Scope

- Does not change the legacy editor, backend/schema/auth, plan rules, document data model or other site pages.
- Does not implement AI Assistant, property providers/connectors or automatic photo ranking.
- Does not add a new canvas engine, multi-touch/pinch-zoom redesign, offline mode or unrelated optimization.
- Does not alter artwork geometry to fit a screen or change existing save/export semantics.

## Engineering / PR

- **Branch:** `codex/v3-arrange-opus` (existing shared milestone candidate)
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/components/editor/v3/V3Editor.tsx` — shell, compact actions, responsive panel composition.
  - `client/src/components/editor/v3/V3Canvas.tsx` — measured available viewport.
  - `client/src/components/editor/v3/v3-editor.css` — remove conflicting shell constraints.
  - `client/src/components/editor/v3/v3-responsive.css` — responsive scoped layout and overflow.
  - `client/src/components/editor/v3/V3ElementToolbar.tsx` — only if viewport clamp requires code.
  - `client/src/lib/canvasState.ts` — only if fit helper needs available dimensions; preserve legacy defaults.
  - `client/src/lib/v3Responsive.ts` — optional pure responsive helper.
  - `client/src/hooks/useV3Responsive.ts` — optional responsive hook.
  - `client/src/lib/__tests__/v3Responsive.spec.ts` — optional helper contract tests.
  - `client/src/hooks/__tests__/useV3Responsive.spec.ts` — optional hook contract tests.
  - `e2e/v3-responsive.spec.ts` — responsive user journeys.
  - `e2e/v3-slice.config.ts` — register bounded browser verification.

## AI Implementation Prompt

> Paste this block into Codex to implement the story.

```text
Context: InfographicAI SaaS — React18/Vite/Wouter/Zustand frontend through Express5000, NestJS11 API3001, Prisma6. Read AGENTS.md and PROJECT_CONTEXT.yaml.
Story: US-EDIT-044 — Responsive V3 editor shell
As a solo real estate agent preparing listing artwork on phone/tablet, I want responsive existing controls so that I can see artwork and edit/save/export on my device.
Acceptance: AC1 and AC2 plus every numbered Responsive Contract clause in this STORY.md are normative. Test 320/375/390/768/820/1024/1440px, portrait and short landscape, light/dark, canvas visibility, panel focus/overflow, save/export and geometry preservation.
Out of scope: legacy editor, backend/data model, other site pages, Assistant, providers, automatic photo ranking, new canvas engine, pinch-zoom redesign.
Primary files: ONLY the explicit Primary files touched list in this STORY.md, and this STORY/TASKS/scaffold documentation. Conditional files require actual runtime need. Preserve others' edits.
Rules: trace runtime before edits; preserve desktop and document geometry; use current handlers. Run npm run check and full npm run test:unit with bounded workers (maximum 2), then npx playwright test --config=e2e/v3-slice.config.ts e2e/v3-responsive.spec.ts --workers=1. Do not weaken failures. Record actual outputs and AC/test results. Group inseparable tests/implementation into green commits; never commit intentionally failing test-only states. Root owns commits. No push/merge/deploy implied.
```

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-EDIT-044-01 | E2E | P0 | happy-path: When the authenticated agent opens at 320, 375, 390, 768,… | ✅ | Responsive browser contracts; see TASKS evidence |
| TC-EDIT-044-02 | E2E | P0 | error-path: When a panel/menu is opened, closed, scrolled or dismisse… | ✅ | Responsive browser contracts; see TASKS evidence |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

## Definition of Done

- [x] All ACs checked ✅
- [ ] All applicable test cases run and recorded; conditional tests documented
- [x] `npm run check` passes (0 new TypeScript errors)
- [x] `npm run test:unit` passes (no regressions; maximum 2 workers)
- [ ] Responsive browser matrix and existing affected desktop flow pass
- [ ] Manual flow verified on `localhost:5000`
- [ ] No console errors in changed flow
- [ ] PR merged (PR #_____)
- [x] [TASKS.md](./TASKS.md) fully checked
- [ ] STORY.md status updated to ✅ Done only after merge


## Verification note

Responsive19 + existing Layers10 browser tests PASS (29 total), across both themes and the specified widths; actual screenshots reviewed. Type checks, full bounded unit suites and production build pass. Broader historical shell suite has three obsolete Listing/template cases still failing; overall release E2E and full localhost:5000/manual hardware checks remain pending. No push, merge or deployment was performed. See TASKS.md for commands, logs and scope.
