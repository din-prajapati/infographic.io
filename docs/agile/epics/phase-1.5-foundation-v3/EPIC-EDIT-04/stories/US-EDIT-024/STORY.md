---
title: Story Card — US-EDIT-024
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-30
---

# Story Card — US-EDIT-024 — V3 top bar and canvas header, light and dark

> **Status:** 🔲 Not Started — hardened 2026-10-30 by /new-story (draft of 2026-10-29 was size L; split into US-EDIT-024 · 028 · 029 · 030)
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-09-v3-shell](../../milestones/M-EDIT-09-v3-shell.md)
> **Linear:** LIN-XXX
> **Size:** M *(was L — the guide bar moved to [US-EDIT-028](../US-EDIT-028/STORY.md), the tool rail and Quick Styles to [US-EDIT-029](../US-EDIT-029/STORY.md), the For sale / For rent badge to [US-EDIT-030](../US-EDIT-030/STORY.md))*
> **Depends on:** — (starts from `main`; first story in the M-EDIT-09 milestone branch)
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md); V3 canvas mockup (`Mockups/buildographic-canvas-simplification-v3/index.html` — `header.topbar`, `div.canvas-topline`, `div.selection-bar`; untracked)

---

## Story

*As* an agent opening the editor
*I want* a clear top bar and a canvas header that says what I am looking at, in whichever theme I use
*So that* I can find my projects, undo, ask the AI and export from one place, and I always know the format and mode of the design in front of me

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** **Top bar** (`EditorToolbar.tsx`, root `data-testid="editor-topbar"`), left to right: a home icon button (`aria-label="Home"`, calls the existing `onBackClick` — `App.tsx` `handleBackFromEditor`, which navigates to `/templates`; unchanged); a **Projects** button (`aria-label="Projects"`) that navigates with Wouter to `/my-designs`; the existing `EditableTitle`; a save-status slot `<span data-testid="save-status-slot" role="status">` that renders the new optional `saveStatus?: ReactNode` prop and is empty when the prop is absent (US-EDIT-027 fills it); `ZoomControls` (unchanged, still centred); **Undo** and **Redo** icon buttons (`aria-label="Undo"` / `"Redo"`, disabled when `history.past` / `history.future` is empty); an **AI Assistant** button; **Save**; **Save as Template**; **Export**. The yellow logo square (`bg-yellow-500` / `text-gray-900`) and the top-bar Preview icon are removed (Preview moves to the canvas header, AC4).
- [ ] **AC2 [happy-path]:** **AI Assistant** opens and closes the same `AIChatBox` panel as the floating AI bubble. The open state moves from `CenterCanvas`'s local `isAIChatExpanded` to `EditorLayout` and is passed down as a controlled prop pair; the button carries `aria-expanded`. The floating bubble (`aria-label="Open AI Chat"` / `"Close AI Chat"`) keeps working exactly as today.
- [ ] **AC3 [happy-path]:** Undo / Redo exist **once**: they are removed from `FloatingToolbar` (its `onUndo` / `onRedo` / `canUndo` / `canRedo` props go too) and `page.getByRole('button', { name: 'Undo' })` resolves to exactly one element. Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z and Ctrl/Cmd+Y still work (handler in `EditorLayout` unchanged).
- [ ] **AC4 [happy-path]:** **Canvas header** — new `CanvasHeader.tsx` (`data-testid="canvas-header"`), rendered between the top bar and the canvas and hidden in preview mode: left, "Page 1" and `formatLabel(canvasWidth, canvasHeight)` from new `client/src/lib/canvasFormat.ts`; right, a **Preview** button that calls the existing `handlePreview` (Esc still exits). `formatLabel` returns `Portrait post · 1080 × 1350`, `Square post · 1080 × 1080`, `Story · 1080 × 1920` for those exact sizes, and otherwise `Landscape` / `Portrait` / `Square` by aspect followed by ` · {w} × {h}`.
- [ ] **AC5 [happy-path]:** **Mode bar** — one line under the canvas header (`data-testid="canvas-mode-bar"`, `aria-live="polite"`), chosen from the canvas store: if any element is an image with `isAiImport` → "Generated image · use Edit elements to make the text editable"; else if any text element has a non-empty `slot` → "Linked elements · double-click text to edit"; else → "Free design · add a template or text from the left rail". The existing "Edit elements" pill (`CanvasEditToolbar`) stays where it is.
- [ ] **AC6 [theme]:** Every new or changed element in this story's `.tsx` files uses theme tokens only. Checked by grep on the story diff: no added line matches `#[0-9a-fA-F]{3,8}\b`, `rgba?\(` or a Tailwind palette class `(bg|text|border|ring|from|to)-(white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)\b`. Where an existing token fails AC7, the story adds a scoped token to **both** `:root` and `.dark` in `client/src/styles/globals.css` and maps it in `tailwind.config.ts` (see Decision D1) — never to `client/src/index.css`, which is compiled output.
- [ ] **AC7 [theme]:** Text contrast is **≥ 4.5:1** in both themes, measured by the new E2E `e2e/us-edit-024-v3-shell.spec.ts`: it sets `localStorage.theme` to `light`, then `dark` (reload each time), and runs the same in-browser WCAG probe as `e2e/design-contrast.spec.ts` (`probePageContrast`, copied and scoped to `[data-testid="editor-topbar"], [data-testid="canvas-header"], [data-testid="canvas-mode-bar"]`) with `minRatio = 4.5`; both runs report zero failures. Disabled buttons are excluded (WCAG 1.4.3 exempts inactive controls).
- [ ] **AC8 [theme]:** With `localStorage.theme = "system"` and the editor open, `page.emulateMedia({ colorScheme: 'dark' })` adds `dark` to `<html>` and the computed `background-color` of `editor-topbar` and `canvas-header` changes to the dark `--background` value **without a reload**; switching back to `light` restores it.
- [ ] **AC9 [regression]:** `npm run check` and `npm run test:unit` pass. Run against localhost (`PLAYWRIGHT_BASE_URL=http://localhost:5000`), these existing specs pass **unchanged**: `editor-ai-chatbox`, `us-ai-036-canvas-orientation`, `us-ai-037-save-as-template`, `us-ai-032-editable-canvas`, `us-ai-032-export-parity`, `qa-canvas-editor`. No change to `canvasState.ts`, `canvasExport.ts` or `client/src/components/canvas/*`.

---

## Out of Scope

- The guide bar (1 Choose a look → 4 Review & export) — [US-EDIT-028](../US-EDIT-028/STORY.md)
- The left tool rail and moving Quick Styles — [US-EDIT-029](../US-EDIT-029/STORY.md)
- The **For sale / For rent** badge — [US-EDIT-030](../US-EDIT-030/STORY.md) (needs US-PROP-002's `transaction` field)
- The **Sample listing** badge — no "sample data" flag exists anywhere in the client; parked as Decision D2 (see Notes)
- A **My Properties** entry under Projects — `/my-properties` arrives with US-PROP-006 (M-PROP-01); add it after that milestone merges
- Filling the save-status slot (US-EDIT-027), the AI Assistant panel itself (US-EDIT-023), "Manage links" (US-EDIT-020), the export review dialog (US-EDIT-021)
- Phone layout · SVG export · dark mode for Pricing / Landing · any canvas renderer change

---

## Engineering / PR

- **Branch:** `feat/edit/m-09-v3-shell` (milestone branch — see M-EDIT-09 notes: no milestone PR to `main` this wave)
- **PR:** #_____
- **Primary files touched:**
  - `client/src/components/editor/EditorToolbar.tsx` — V3 top bar
  - `client/src/components/editor/EditorLayout.tsx` — lift AI-chat open state; mount `CanvasHeader`; pass undo/redo/AI/saveStatus to the toolbar; stop passing undo/redo to `FloatingToolbar`
  - `client/src/components/editor/CenterCanvas.tsx` — AI-chat open state becomes a controlled prop pair
  - `client/src/components/editor/FloatingToolbar.tsx` — remove Undo / Redo only
  - `client/src/components/editor/CanvasHeader.tsx` — new: page + format, Preview, mode bar
  - `client/src/lib/canvasFormat.ts` — new: `formatLabel()`, `canvasMode()`
  - `client/src/lib/__tests__/canvasFormat.spec.ts` — new
  - `client/src/styles/globals.css` — scoped shell tokens in `:root` and `.dark` (only if D1 is confirmed)
  - `tailwind.config.ts` — map those tokens (only if D1 is confirmed)
  - `e2e/us-edit-024-v3-shell.spec.ts` — new

---

## AI Implementation Prompt

> Paste this block into Claude Code to implement the story.

```
Context: Buildographic (code name InfographicAI) — React 18 + Vite, Wouter (never React Router), Zustand + React Query,
Tailwind v3 + shadcn/ui, lucide-react. Theme is class-based: lib/theme-provider.tsx puts "light"/"dark" on <html>,
localStorage key "theme". Tokens live in client/src/styles/globals.css (:root and .dark) and tailwind.config.ts.
client/src/index.css is COMPILED Tailwind output — never add tokens there.

Story: US-EDIT-024 — V3 top bar and canvas header, light and dark (milestone branch feat/edit/m-09-v3-shell)

Acceptance Criteria:
AC1: EditorToolbar (data-testid="editor-topbar"): Home (onBackClick) · Projects → navigate('/my-designs') · EditableTitle ·
     <span data-testid="save-status-slot" role="status">{saveStatus}</span> (new optional prop) · ZoomControls (centred) ·
     Undo/Redo (aria-label, disabled from history) · AI Assistant · Save · Save as Template · Export.
     Remove the bg-yellow-500 logo square and the Maximize/Preview icon.
AC2: AI Assistant toggles the existing AIChatBox. Lift isAIChatExpanded from CenterCanvas into EditorLayout and pass
     isAIChatExpanded + onAIChatExpandedChange to CenterCanvas. The floating bubble keeps its aria-labels and behaviour.
AC3: Remove Undo/Redo (and their props) from FloatingToolbar; exactly one Undo button in the DOM; shortcuts unchanged.
AC4: New CanvasHeader.tsx (data-testid="canvas-header") between top bar and canvas, hidden in preview: "Page 1" +
     formatLabel(w,h) from client/src/lib/canvasFormat.ts; Preview button → existing handlePreview.
     formatLabel: 1080x1350 "Portrait post · 1080 × 1350", 1080x1080 "Square post · …", 1080x1920 "Story · …",
     else Landscape/Portrait/Square by aspect + " · {w} × {h}".
AC5: Mode bar (data-testid="canvas-mode-bar", aria-live="polite") from canvasMode(elements): isAiImport image →
     "Generated image · use Edit elements to make the text editable"; text element with slot → "Linked elements ·
     double-click text to edit"; else "Free design · add a template or text from the left rail".
AC6: Token classes only — no hex, rgb()/rgba(), or Tailwind palette classes in added lines.
AC7: e2e/us-edit-024-v3-shell.spec.ts: contrast probe (copy probePageContrast from e2e/design-contrast.spec.ts, scope it
     to the three testids, skip disabled buttons) at minRatio 4.5 in light and dark → zero failures.
AC8: theme "system" + page.emulateMedia({colorScheme:'dark'}) flips the shell to dark without reload.
AC9: npm run check · npm run test:unit · listed existing E2E specs pass unchanged on localhost.

Architecture notes:
- Existing tokens FAIL 4.5:1 in places (measured 2026-10-30): light text-muted-foreground on background 3.84:1, on muted
  3.45:1; white on bg-primary 3.64:1 light / 3.10:1 dark. Use text-foreground for labels; for secondary text and filled
  buttons use the scoped tokens from Decision D1 (--shell-muted-foreground light 45 5% 40%, dark 45 8% 55%;
  --shell-primary 207 90% 40% both themes, white text 5.16:1) once confirmed.
- Keyboard shortcuts stay in EditorLayout; do not duplicate them in the toolbar.
- canvasMode() and formatLabel() are pure functions — unit-test them, keep components thin.
- Do NOT touch CanvasEditToolbar.tsx (US-EDIT-026), RightSidebar.tsx, canvasState.ts, canvasExport.ts.

Out of Scope: guide bar (028) · tool rail + Quick Styles (029) · For sale/For rent badge (030) · Sample listing badge ·
My Properties link · autosave status content (027) · AI Assistant panel (023) · Manage links (020) · export review (021).

Primary files (do NOT touch others): client/src/components/editor/EditorToolbar.tsx · EditorLayout.tsx · CenterCanvas.tsx ·
FloatingToolbar.tsx · CanvasHeader.tsx (new) · client/src/lib/canvasFormat.ts (new) ·
client/src/lib/__tests__/canvasFormat.spec.ts (new) · client/src/styles/globals.css · tailwind.config.ts ·
e2e/us-edit-024-v3-shell.spec.ts (new)

Rules: touch only these files; run `npm run check` and `npm run test:unit`; report files changed, ACs checked, test output.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-EDIT-024-01 | E2E | P0 | Given the editor is open, then `editor-topbar` contains, in order, Home · Projects · title · save-status slot · Undo · Redo · AI Assistant · Save · Save as Template · Export | 🔲 | |
| TC-EDIT-024-02 | E2E | P0 | Given the editor in light, then in dark, when the scoped contrast probe runs at 4.5:1 over top bar, canvas header and mode bar, then it reports 0 failures in each theme | 🔲 | |
| TC-EDIT-024-03 | E2E | P0 | Given the AI panel is closed, when AI Assistant is clicked, then `#ai-chat-panel` is visible and the button has `aria-expanded="true"`; when the floating bubble is clicked, the panel closes and the top-bar button reads `aria-expanded="false"` | 🔲 | |
| TC-EDIT-024-04 | E2E | P0 | Given a 1080 × 1350 canvas, then `canvas-header` reads "Page 1" and "Portrait post · 1080 × 1350" | 🔲 | |
| TC-EDIT-024-05 | Unit | P0 | `formatLabel` for 1080×1350, 1080×1080, 1080×1920, 1800×1350, 1000×1000 returns the AC4 strings — `canvasFormat.spec.ts` | 🔲 | |
| TC-EDIT-024-06 | Unit | P1 | `canvasMode` returns `generated` when an `isAiImport` image exists (even with slotted text), `linked` with a slotted text and no AI image, `free` otherwise — `canvasFormat.spec.ts` | 🔲 | |
| TC-EDIT-024-07 | E2E | P1 | Given one element was added, then exactly one button named "Undo" exists and clicking it removes the element; Ctrl+Z after re-adding also removes it | 🔲 | |
| TC-EDIT-024-08 | E2E | P1 | Given theme "system" and the editor open, when `emulateMedia({ colorScheme: 'dark' })`, then `<html>` has class `dark` and `editor-topbar`'s background equals the dark `--background` without a reload | 🔲 | |
| TC-EDIT-024-09 | E2E | P1 | When Projects is clicked, then the URL is `/my-designs`; when Preview in the canvas header is clicked, then the top bar is hidden and Esc brings it back | 🔲 | |
| TC-EDIT-024-10 | Manual | P1 | `git diff` of this story's `.tsx` files: no added hex, `rgb(`/`rgba(` or Tailwind palette class (AC6 regex) | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Notes

- **Decision D1 (owner) — contrast tokens.** The draft said "use existing tokens" *and* "≥ 4.5:1"; the existing tokens cannot do both (numbers in the AI prompt). Recommendation: add two scoped tokens (`--shell-muted-foreground`, `--shell-primary`) used only by the new shell, rather than darkening the global `--muted-foreground` / `--primary`, which would shift every page and the existing contrast and token E2E suites. Alternative: accept 3:1 for secondary text (WCAG "large text" level) — not recommended, labels here are 12–14 px.
- **Decision D2 (owner) — "Sample listing" badge.** Nothing in the client marks a design as using sample data (no flag on designs, templates or `usePropertyStore`; US-PROP-003's `fieldOrigins` only records accepted Auto-Fill fields). Recommendation: leave it out of M-EDIT-09 and add it with whichever story introduces sample designs (onboarding sample or proven templates, US-PROP-005).
- **Merge order:** in the milestone branch, US-EDIT-024 → US-EDIT-028 → US-EDIT-029 → US-EDIT-027 → US-EDIT-030. `EditorLayout.tsx` is also changed by US-PROP-006 (M-PROP-01): the M-EDIT-09 branch must be rebased onto `main` after the M-PROP-01 milestone PR merges (wave day 5), and the M-EDIT-09 PR merges after it.

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

### 2026-10-30 — hardened by /new-story; split
- **Split** (L → M + M + M + XS): top bar + canvas header stay here; guide bar → US-EDIT-028; tool rail + Quick Styles → US-EDIT-029; For sale / For rent badge → US-EDIT-030.
- Found against the code:
  - `LeftSidebar.tsx` and `sidebar/ToolsTab.tsx` are **dead code** — neither is imported anywhere. The live left rail is `FloatingToolbar.tsx` (Templates · Select/Hand · Undo/Redo · Add-element menu · Layers). The draft's rail files were wrong; so is US-EDIT-022's `LeftSidebar.tsx` entry.
  - **Quick Styles lives in `RightSidebar.tsx`** (Design tab, ~lines 1312–1360, helpers ~168 and ~600–790), not in any Text tool — moving it touches `RightSidebar.tsx` (US-EDIT-029).
  - `client/src/index.css` is compiled Tailwind output; theme tokens live in `client/src/styles/globals.css`.
  - Existing tokens fail 4.5:1 in places (Decision D1).
  - The AI panel's open state is local to `CenterCanvas` — a top-bar AI button needs it lifted.
  - No sample-data flag and no `transaction` field exist yet (D2; US-EDIT-030 waits for US-PROP-002).
  - The guide bar's targets (Look picker, AI Assistant, export review) are other stories' work; US-EDIT-028 points them at today's equivalents.

---

*Story created: 2026-10-29 · hardened 2026-10-30*
